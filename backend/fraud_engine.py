"""FraudShield AI - contextual fraud analysis engine.

The engine never looks at a transaction in isolation. It combines six signal
families (behaviour, account history, device, location, velocity, network),
produces a transparent 0-100 risk score, explainable evidence and a
recommended action. A RandomForest model contributes a secondary opinion that
is blended with the deterministic rule score.

NOTE: this produces a RISK ASSESSMENT to support investigation. It is not a
guaranteed probability of fraud and must not be treated as one.
"""
import json
import uuid
from datetime import datetime, timedelta

import db

# signal weight = maximum points that signal can add to the risk score
WEIGHTS = {
    "amount_deviation": 22,
    "new_device": 18,
    "location_anomaly": 16,
    "velocity": 18,
    "account_age": 8,
    "odd_hour": 6,
    "network_relationship": 14,
    "fraud_history": 10,
    "channel_risk": 6,
}

THRESHOLDS = [(30, "LOW", "ALLOW"), (70, "MEDIUM", "VERIFY"),
              (85, "HIGH", "RESTRICT"), (100, "CRITICAL", "BLOCK")]


def _parse(ts):
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return datetime.utcnow()


def level_for(score):
    for cap, level, action in THRESHOLDS:
        if score <= cap:
            return level, action
    return "CRITICAL", "BLOCK"


def account_profile(account_number=None, upi_id=None):
    """Aggregate history for an account number or UPI ID."""
    acc = None
    if account_number:
        acc = db.q("SELECT * FROM accounts WHERE account_number=?", (account_number,), one=True)
    if not acc and upi_id:
        acc = db.q("SELECT * FROM accounts WHERE upi_id=?", (upi_id,), one=True)
    if not acc:
        return None
    txns = db.q(
        "SELECT * FROM transactions WHERE account_number=? ORDER BY created_at DESC",
        (acc["account_number"],))
    # the behavioural baseline only learns from transactions that were NOT flagged,
    # otherwise fraudulent devices/locations would quickly be treated as normal
    trusted = [t for t in txns if t["risk_level"] == "LOW"] or txns
    amounts = [t["amount"] for t in trusted] or [0]
    opened = _parse(acc["opened_at"])
    devices = sorted({t["device_id"] for t in trusted} | set(json.loads(acc["known_devices"] or "[]")))
    locations = sorted({t["location"] for t in trusted} | set(json.loads(acc["known_locations"] or "[]")))
    return {
        "account_number": acc["account_number"],
        "masked_account": db.mask(acc["account_number"]),
        "upi_id": acc["upi_id"],
        "holder_name": acc["holder_name"],
        "opened_at": acc["opened_at"],
        "account_age_days": max((datetime.utcnow() - opened).days, 0),
        "home_location": acc["home_location"],
        "transaction_count": len(txns),
        "avg_amount": round(sum(amounts) / len(amounts), 2),
        "max_amount": round(max(amounts), 2),
        "known_devices": devices,
        "known_locations": locations,
        "fraud_incidents": acc["fraud_incidents"],
        "risk_score": acc["risk_score"],
        "recent_transactions": txns[:25],
        "connected_accounts": connected_accounts(acc["account_number"]),
    }


def connected_accounts(account_number):
    """Accounts that share a device or UPI id with this account."""
    mine = db.q("SELECT DISTINCT device_id FROM transactions WHERE account_number=?", (account_number,))
    devices = [r["device_id"] for r in mine if r["device_id"]]
    if not devices:
        return []
    placeholders = ",".join("?" * len(devices))
    rows = db.q(
        f"""SELECT account_number, device_id, COUNT(*) c, MAX(risk_score) risk
            FROM transactions WHERE device_id IN ({placeholders}) AND account_number<>?
            GROUP BY account_number, device_id ORDER BY risk DESC LIMIT 12""",
        (*devices, account_number))
    return [{"account_number": r["account_number"], "masked": db.mask(r["account_number"]),
             "shared_device": r["device_id"], "shared_transactions": r["c"],
             "max_risk_score": r["risk"] or 0} for r in rows]


def velocity(account_number, when):
    out = {}
    for label, minutes in (("1m", 1), ("5m", 5), ("15m", 15), ("1h", 60), ("24h", 1440)):
        since = (when - timedelta(minutes=minutes)).isoformat(timespec="seconds")
        row = db.q("""SELECT COUNT(*) c FROM transactions
                      WHERE account_number=? AND created_at>=? AND created_at<=?""",
                   (account_number, since, when.isoformat(timespec="seconds")), one=True)
        out[label] = row["c"] if row else 0
    return out


def _signal(name, label, severity, evidence, points):
    return {"signal": name, "label": label, "severity": severity,
            "evidence": evidence, "contribution": round(points, 1)}


def evaluate_signals(payload, profile):
    """Return (signals, rule_score, feature_vector)."""
    amount = float(payload.get("amount") or 0)
    when = _parse(payload.get("timestamp") or db.now())
    device = (payload.get("device_id") or "").strip()
    location = (payload.get("location") or "").strip()
    txn_type = payload.get("txn_type") or "UPI"
    signals, score = [], 0.0

    avg = profile["avg_amount"] if profile and profile["avg_amount"] else 5000.0
    mx = profile["max_amount"] if profile and profile["max_amount"] else 20000.0
    ratio = amount / max(avg, 1.0)

    # A. transaction behaviour / amount deviation
    if ratio >= 3:
        pts = min(WEIGHTS["amount_deviation"], 6 + (ratio - 3) * 4)
        sev = "Critical" if ratio >= 8 else "High" if ratio >= 5 else "Medium"
        signals.append(_signal("AMOUNT_DEVIATION", "Amount far above normal behaviour", sev,
                               f"Rs {amount:,.0f} is {ratio:.1f}x the account's average of "
                               f"Rs {avg:,.0f} (previous maximum Rs {mx:,.0f}).", pts))
        score += pts

    # C. device
    known_devices = profile["known_devices"] if profile else []
    new_device = bool(device) and device not in known_devices
    if new_device:
        pts = WEIGHTS["new_device"]
        signals.append(_signal("NEW_DEVICE", "New device detected", "High",
                               f"Device {device} has never been associated with this account. "
                               f"{len(known_devices)} device(s) previously seen.", pts))
        score += pts

    # D. location
    known_locations = profile["known_locations"] if profile else []
    location_anomaly = bool(location) and location not in known_locations
    if location_anomaly:
        pts = WEIGHTS["location_anomaly"]
        home = profile["home_location"] if profile else "unknown"
        signals.append(_signal("LOCATION_ANOMALY", "Unusual location detected", "High",
                               f"Transaction originated from {location}; this account normally "
                               f"transacts from {home}.", pts))
        score += pts

    # E. velocity
    vel = velocity(profile["account_number"], when) if profile else {"1m": 0, "5m": 0, "15m": 0, "1h": 0, "24h": 0}
    if vel["5m"] >= 3 or vel["1h"] >= 6:
        pts = min(WEIGHTS["velocity"], 6 + vel["5m"] * 3 + vel["1h"])
        sev = "Critical" if vel["5m"] >= 5 else "High"
        signals.append(_signal("HIGH_VELOCITY", "High transaction velocity", sev,
                               f"{vel['1m']} txn in 1 min, {vel['5m']} in 5 min, "
                               f"{vel['15m']} in 15 min, {vel['1h']} in 1 hour.", pts))
        score += pts

    # B. account history
    age = profile["account_age_days"] if profile else 0
    if profile and age < 120:
        pts = WEIGHTS["account_age"] * (1 - age / 120)
        signals.append(_signal("NEW_ACCOUNT", "Recently opened account", "Medium",
                               f"Account opened {age} days ago with only "
                               f"{profile['transaction_count']} recorded transactions.", pts))
        score += pts
    if profile and profile["fraud_incidents"]:
        pts = WEIGHTS["fraud_history"]
        signals.append(_signal("FRAUD_HISTORY", "Previous fraud incidents on account", "High",
                               f"{profile['fraud_incidents']} confirmed incident(s) in account history.", pts))
        score += pts

    # time of day
    if when.hour < 5 or when.hour >= 23:
        pts = WEIGHTS["odd_hour"]
        signals.append(_signal("ODD_HOUR", "Transaction outside normal hours", "Low",
                               f"Initiated at {when.strftime('%H:%M')}, outside this account's "
                               f"typical activity window.", pts))
        score += pts

    # F. network relationships
    risky_links = [c for c in (profile["connected_accounts"] if profile else [])
                   if c["max_risk_score"] >= 70]
    if risky_links:
        pts = min(WEIGHTS["network_relationship"], 6 + 4 * len(risky_links))
        names = ", ".join(c["masked"] for c in risky_links[:3])
        signals.append(_signal("NETWORK_ANOMALY", "Suspicious network relationship", "High",
                               f"Shares device fingerprints with {len(risky_links)} flagged "
                               f"account(s): {names}.", pts))
        score += pts
    if new_device:
        shared = db.q("""SELECT COUNT(DISTINCT account_number) c FROM transactions
                         WHERE device_id=?""", (device,), one=True)
        if shared and shared["c"] >= 3:
            pts = 8
            signals.append(_signal("DEVICE_SHARING", "Device shared across many accounts", "Medium",
                                   f"Device {device} appears on {shared['c']} different accounts.", pts))
            score += pts

    # channel risk
    if txn_type in ("UPI", "Wallet") and amount >= 50000:
        pts = WEIGHTS["channel_risk"]
        signals.append(_signal("CHANNEL_RISK", "High-value transfer on instant channel", "Medium",
                               f"Rs {amount:,.0f} via {txn_type} is irreversible once completed.", pts))
        score += pts

    # signal convergence: independent evidence families agreeing is itself a signal
    severe = [s for s in signals if s["severity"] in ("High", "Critical")]
    if len(severe) >= 3:
        pts = 6 + 3 * (len(severe) - 3)
        signals.append(_signal("SIGNAL_CONVERGENCE", "Multiple independent signals agree", "High",
                               f"{len(severe)} high-severity signals from different evidence "
                               f"families triggered on the same transaction.", pts))
        score += pts

    features = [amount, ratio, 1 if new_device else 0, 1 if location_anomaly else 0,
                vel["5m"], vel["1h"], age, profile["fraud_incidents"] if profile else 0,
                when.hour, len(risky_links)]
    return signals, min(score, 100.0), features


def analyse(payload, persist=True, txn_id=None, created_at=None, user=None):
    profile = account_profile(payload.get("account_number"), payload.get("upi_id"))
    signals, rule_score, features = evaluate_signals(payload, profile)

    ml_prob, ml_ok = 0.0, False
    try:
        import ml_model
        ml_prob = ml_model.predict_proba(features)
        ml_ok = True
    except Exception:
        ml_ok = False

    score = round(rule_score * 0.65 + ml_prob * 100 * 0.35) if ml_ok else round(rule_score)
    score = int(max(0, min(100, score)))
    lvl, action = level_for(score)

    txn_id = txn_id or f"TXN-{uuid.uuid4().hex[:6].upper()}"
    created_at = created_at or payload.get("timestamp") or db.now()
    result = {
        "txn_id": txn_id,
        "account_number": payload.get("account_number"),
        "masked_account": db.mask(payload.get("account_number")),
        "upi_id": payload.get("upi_id"),
        "amount": float(payload.get("amount") or 0),
        "txn_type": payload.get("txn_type"),
        "location": payload.get("location"),
        "device_id": payload.get("device_id"),
        "created_at": created_at,
        "risk_score": score,
        "rule_score": round(rule_score, 1),
        "ml_score": round(ml_prob * 100, 1) if ml_ok else None,
        "ml_available": ml_ok,
        "risk_level": lvl,
        "action": action,
        "signals": signals,
        "velocity": velocity(profile["account_number"], _parse(created_at)) if profile else {},
        "account_known": profile is not None,
        "explanation": explain(signals, score, lvl, action),
        "disclaimer": "Synthetic demo data. Risk assessment for investigation support only "
                      "- not a guaranteed probability of fraud.",
    }
    if persist:
        db.execute("""INSERT OR REPLACE INTO transactions
            (txn_id,account_number,upi_id,amount,txn_type,location,device_id,created_at,
             risk_score,risk_level,action,status,reasons,is_fraud)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                   (txn_id, payload.get("account_number"), payload.get("upi_id"),
                    float(payload.get("amount") or 0), payload.get("txn_type"),
                    payload.get("location"), payload.get("device_id"), created_at,
                    score, lvl, action, "FLAGGED" if lvl in ("HIGH", "CRITICAL") else "COMPLETED",
                    json.dumps(signals), 1 if lvl == "CRITICAL" else 0))
    return result


def explain(signals, score, level, action):
    """Local (no external API) natural-language explanation engine."""
    if not signals:
        return ("No contextual risk signals were triggered. Amount, device, location, "
                f"velocity and network relationships are all consistent with this account's "
                f"history, giving a low risk score of {score}/100.")
    top = sorted(signals, key=lambda s: -s["contribution"])[:3]
    joined = "; ".join(s["label"].lower() for s in top)
    return (f"This transaction scored {score}/100 ({level}) because of {len(signals)} contextual "
            f"signal(s), led by {joined}. Because these signals reinforce each other across "
            f"different evidence families, the engine recommends {action}.")
