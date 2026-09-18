"""FraudShield investigation assistant.

Answers analyst questions strictly from data already stored in the database.
It never invents transaction records. If an LLM API key is configured
(LLM_API_KEY) it is used only to rephrase the retrieved evidence; the retrieval
and all numbers still come from the local database.
"""
import json
import os
import re

import db
import fraud_engine

LLM_ENABLED = bool(os.getenv("LLM_API_KEY"))


def answer(question: str):
    text = (question or "").strip()
    low = text.lower()
    txn = re.search(r"(TXN-[A-Z0-9]+)", text.upper())
    acc = re.search(r"(ACC\d+)", text.upper())
    upi = re.search(r"([\w.\-]+@[\w]+)", text)

    if txn:
        return _explain_txn(txn.group(1))
    if acc or (upi and "upi" in low) or upi:
        return _explain_account(acc.group(1) if acc else None, upi.group(1) if upi else None)
    if "velocity" in low:
        rows = db.q("""SELECT account_number, COUNT(*) c FROM transactions
                       WHERE created_at >= datetime('now','-1 day')
                       GROUP BY account_number HAVING c>3 ORDER BY c DESC LIMIT 5""")
        if not rows:
            return _wrap("No accounts exceeded the velocity threshold in the last 24 hours.", [])
        lines = [f"{db.mask(r['account_number'])} - {r['c']} transactions in 24h" for r in rows]
        return _wrap("Accounts with elevated transaction velocity in the last 24 hours:", lines)
    if "suspicious" in low or "today" in low or "high risk" in low or "high-risk" in low:
        rows = db.q("""SELECT txn_id, account_number, amount, risk_score, risk_level, location
                       FROM transactions WHERE risk_level IN ('HIGH','CRITICAL')
                       ORDER BY created_at DESC LIMIT 8""")
        if not rows:
            return _wrap("No high-risk transactions are currently recorded.", [])
        lines = [f"{r['txn_id']} - Rs {r['amount']:,.0f} from {r['location']} - "
                 f"{r['risk_score']}/100 ({r['risk_level']})" for r in rows]
        return _wrap(f"{len(rows)} recent high-risk transactions:", lines)
    if "alert" in low:
        rows = db.q("SELECT level,title,txn_id FROM alerts ORDER BY id DESC LIMIT 6")
        return _wrap("Latest alerts:", [f"[{r['level']}] {r['title']} ({r['txn_id']})" for r in rows])
    if "signal" in low or "how" in low and "work" in low:
        return _wrap("The engine scores six signal families and blends a RandomForest opinion:",
                     ["Transaction behaviour - amount deviation, channel, timing",
                      "Account history - age, averages, prior incidents",
                      "Device - new / shared / unknown fingerprints",
                      "Location - deviation from usual geography",
                      "Velocity - counts over 1m, 5m, 15m, 1h windows",
                      "Network - accounts linked by shared devices or UPI IDs"])

    stats = db.q("""SELECT COUNT(*) total, SUM(risk_level IN ('HIGH','CRITICAL')) high,
                    SUM(action='BLOCK') blocked FROM transactions""", one=True)
    return _wrap(
        "Ask me about a transaction ID (TXN-...), an account (ACC1001), a UPI ID, "
        "velocity, alerts or today's suspicious activity.",
        [f"{stats['total']} transactions analysed",
         f"{stats['high'] or 0} high or critical risk",
         f"{stats['blocked'] or 0} recommended for blocking"])


def _explain_txn(txn_id):
    row = db.q("SELECT * FROM transactions WHERE txn_id=?", (txn_id,), one=True)
    if not row:
        return _wrap(f"I have no record of {txn_id} in the database.", [])
    signals = json.loads(row["reasons"] or "[]")
    lines = [f"{s['label']} ({s['severity']}, +{s['contribution']}) - {s['evidence']}" for s in signals]
    head = (f"{txn_id} scored {row['risk_score']}/100 ({row['risk_level']}). "
            f"Rs {row['amount']:,.0f} via {row['txn_type']} from {row['location']} "
            f"on device {row['device_id']}. Recommended action: {row['action']}.")
    return _wrap(head, lines or ["No risk signals were triggered for this transaction."])


def _explain_account(account_number, upi_id):
    p = fraud_engine.account_profile(account_number, upi_id)
    if not p:
        return _wrap("That account or UPI ID is not in the database. "
                     "Please check the identifier and try again.", [])
    lines = [f"Account age: {p['account_age_days']} days",
             f"Transactions: {p['transaction_count']}, average Rs {p['avg_amount']:,.0f}, "
             f"maximum Rs {p['max_amount']:,.0f}",
             f"Known devices: {', '.join(p['known_devices'][:6]) or 'none'}",
             f"Known locations: {', '.join(p['known_locations']) or 'none'}",
             f"Prior fraud incidents: {p['fraud_incidents']}",
             f"Connected accounts sharing a device: {len(p['connected_accounts'])}"]
    return _wrap(f"Profile for {p['masked_account']} ({p['upi_id']}):", lines)


def _wrap(summary, bullets):
    return {"answer": summary, "details": bullets, "grounded_in": "local demo database",
            "llm_used": False}
