"""FraudShield AI - Flask REST API.

Run:  python app.py      (http://localhost:5000)
All data served here is SYNTHETIC demo data.
"""
import json
import os
import random
from datetime import datetime, timedelta

from flask import Flask, jsonify, request

import assistant
import db
import fraud_engine as engine
from auth import make_token, require_auth, verify_password

app = Flask(__name__)
START = datetime.utcnow()


@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def preflight(_any):
    return ("", 204)


@app.errorhandler(Exception)
def handle_error(e):
    code = getattr(e, "code", 500)
    return jsonify({"error": str(e) if code != 500 else "Internal server error. Please retry."}), code


def body():
    return request.get_json(silent=True) or {}


# ------------------------------------------------------------------ auth
@app.post("/api/login")
def login():
    data = body()
    email = (data.get("email") or "").strip().lower()
    user = db.q("SELECT * FROM users WHERE email=?", (email,), one=True)
    ok = bool(user) and verify_password(data.get("password") or "", user["password_hash"])
    db.execute("INSERT INTO login_events(email,ip,device,success,created_at) VALUES(?,?,?,?,?)",
               (email, request.remote_addr or "127.0.0.1",
                request.headers.get("User-Agent", "unknown")[:60], 1 if ok else 0, db.now()))
    if not ok:
        return jsonify({"error": "Invalid email or password."}), 401
    
    # Check email verification status
    if user.get("is_verified") == 0:
        return jsonify({
            "error": "unverified",
            "message": "Please verify your email address before signing in.",
            "email": email
        }), 403

    return jsonify({"token": make_token(user),
                    "user": {"email": user["email"], "name": user["name"], "role": user["role"]}})


@app.post("/api/signup")
def signup():
    data = body()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    role = (data.get("role") or "analyst").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    try:
        user = db.create_user(email, name, role, password, is_verified=0)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    from auth import send_verification_email
    v_token = db.create_verification_token(email)
    sent, verify_url = send_verification_email(email, v_token)

    return jsonify({
        "ok": True,
        "message": "Account created successfully! Please check your email to verify your account.",
        "user": {"email": user["email"], "name": user["name"], "role": user["role"]},
        "verify_token": v_token,
        "verify_url": verify_url
    }), 201


@app.post("/api/auth/verify-email")
def verify_email_route():
    data = body()
    token = (data.get("token") or "").strip()
    if not token:
        return jsonify({"error": "invalid", "message": "Verification token is required."}), 400

    status, email = db.verify_token(token)
    if status == "success":
        return jsonify({
            "ok": True,
            "status": "success",
            "message": "Email verified successfully! You may now sign in.",
            "email": email
        })
    elif status == "already_verified":
        return jsonify({
            "ok": True,
            "status": "already_verified",
            "message": "Your email address is already verified.",
            "email": email
        })
    elif status == "expired":
        return jsonify({
            "error": "expired",
            "message": "Verification link has expired. Please request a new verification email.",
            "email": email
        }), 400
    else:
        return jsonify({
            "error": "invalid",
            "message": "Invalid verification link."
        }), 400


@app.post("/api/auth/resend-verification")
def resend_verification_route():
    data = body()
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email address is required."}), 400

    user = db.get_user_by_email(email)
    if not user:
        return jsonify({"error": "No account found with this email address."}), 404
    if user.get("is_verified") == 1:
        return jsonify({"ok": True, "status": "already_verified", "message": "This email address is already verified."})

    from auth import send_verification_email
    v_token = db.create_verification_token(email)
    sent, verify_url = send_verification_email(email, v_token)

    return jsonify({
        "ok": True,
        "message": f"Verification email resent to {email}.",
        "verify_token": v_token,
        "verify_url": verify_url
    })


@app.get("/api/me")
@require_auth
def me():
    return jsonify(request.user)




# ------------------------------------------------------------- dashboard
@app.get("/api/dashboard")
@require_auth
def dashboard():
    s = db.q("""SELECT COUNT(*) total,
                SUM(risk_level IN ('HIGH','CRITICAL')) fraud_detected,
                SUM(risk_level='HIGH') high_risk,
                SUM(action='BLOCK') blocked,
                SUM(CASE WHEN action IN ('BLOCK','RESTRICT') THEN amount ELSE 0 END) protected
                FROM transactions""", one=True)
    by_level = db.q("SELECT risk_level, COUNT(*) c FROM transactions GROUP BY risk_level")
    recent = db.q("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 12")
    return jsonify({
        "kpis": {"total_transactions": s["total"] or 0, "analyzed": s["total"] or 0,
                 "fraud_detected": s["fraud_detected"] or 0, "high_risk": s["high_risk"] or 0,
                 "blocked": s["blocked"] or 0, "amount_protected": round(s["protected"] or 0, 2)},
        "risk_distribution": {r["risk_level"]: r["c"] for r in by_level},
        "recent": [_pub(t) for t in recent],
        "data_notice": "Synthetic demo data generated locally.",
    })


@app.get("/api/analytics")
@require_auth
def analytics():
    def rows(sql):
        return db.q(sql)
    by_loc = rows("""SELECT location k, COUNT(*) total,
                     SUM(risk_level IN ('HIGH','CRITICAL')) fraud, SUM(amount) amount
                     FROM transactions GROUP BY location ORDER BY fraud DESC""")
    by_type = rows("""SELECT txn_type k, COUNT(*) total,
                      SUM(risk_level IN ('HIGH','CRITICAL')) fraud
                      FROM transactions GROUP BY txn_type""")
    trend = rows("""SELECT substr(created_at,1,10) k, COUNT(*) total,
                    SUM(risk_level IN ('HIGH','CRITICAL')) fraud,
                    SUM(CASE WHEN risk_level IN ('HIGH','CRITICAL') THEN amount ELSE 0 END) fraud_amount
                    FROM transactions GROUP BY k ORDER BY k""")
    dist = rows("SELECT risk_level k, COUNT(*) total FROM transactions GROUP BY k")
    return jsonify({"by_location": by_loc, "by_type": by_type, "trend": trend,
                    "risk_distribution": dist})


# ----------------------------------------------------------- transactions
def _pub(t):
    t = dict(t)
    t["masked_account"] = db.mask(t.get("account_number"))
    try:
        t["signals"] = json.loads(t.get("reasons") or "[]")
    except Exception:
        t["signals"] = []
    t.pop("reasons", None)
    return t


@app.get("/api/transactions")
@require_auth
def transactions():
    search = request.args.get("search", "").strip()
    level = request.args.get("risk_level", "")
    limit = min(int(request.args.get("limit", 200)), 1000)
    sql = "SELECT * FROM transactions WHERE 1=1"
    args = []
    if search:
        sql += """ AND (txn_id LIKE ? OR account_number LIKE ? OR upi_id LIKE ?
                   OR device_id LIKE ? OR location LIKE ?)"""
        args += [f"%{search}%"] * 5
    if level:
        sql += " AND risk_level=?"
        args.append(level)
    sql += " ORDER BY created_at DESC LIMIT ?"
    args.append(limit)
    return jsonify([_pub(t) for t in db.q(sql, tuple(args))])


@app.get("/api/transaction/<txn_id>")
@require_auth
def transaction(txn_id):
    row = db.q("SELECT * FROM transactions WHERE txn_id=?", (txn_id,), one=True)
    if not row:
        return jsonify({"error": "Transaction not found."}), 404
    out = _pub(row)
    out["timeline"] = _timeline(out)
    return jsonify(out)


def _timeline(t):
    base = engine._parse(t["created_at"])
    steps = [("Session started", 0), ("Device fingerprint captured", 1),
             ("Location resolved: " + (t.get("location") or "-"), 2),
             (f"Transaction of Rs {t['amount']:,.0f} initiated", 3),
             ("Contextual signals evaluated", 3),
             (f"Risk score computed: {t['risk_score']}/100", 4),
             (f"Recommended action: {t['action']}", 4)]
    return [{"time": (base + timedelta(minutes=m)).strftime("%d %b %H:%M"), "event": e}
            for e, m in steps]


@app.post("/api/transaction/check")
@require_auth
def check():
    data = body()
    try:
        amount = float(data.get("amount"))
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Please enter a valid transaction amount."}), 400
    if not data.get("account_number") and not data.get("upi_id"):
        return jsonify({"error": "Provide an account number or a UPI ID."}), 400
    if not engine.account_profile(data.get("account_number"), data.get("upi_id")):
        return jsonify({"error": "Account not found. Please check the account number or UPI ID. "
                                 "Demo accounts: ACC1001 - ACC1012."}), 404
    result = engine.analyse(data, persist=True)
    if result["risk_level"] in ("HIGH", "CRITICAL"):
        db.add_alert(result["txn_id"], result["risk_level"],
                     "Critical fraud risk detected" if result["risk_level"] == "CRITICAL"
                     else "High-risk transaction detected",
                     f"{result['txn_id']} scored {result['risk_score']}/100.")
    return jsonify(result)


@app.post("/api/transaction/<txn_id>/action")
@require_auth
def set_action(txn_id):
    action = (body().get("action") or "").upper()
    if action not in ("ALLOW", "VERIFY", "RESTRICT", "BLOCK"):
        return jsonify({"error": "Unknown action."}), 400
    if not db.q("SELECT 1 FROM transactions WHERE txn_id=?", (txn_id,), one=True):
        return jsonify({"error": "Transaction not found."}), 404
    status = {"ALLOW": "COMPLETED", "VERIFY": "PENDING_VERIFICATION",
              "RESTRICT": "RESTRICTED", "BLOCK": "BLOCKED"}[action]
    db.execute("UPDATE transactions SET action=?, status=? WHERE txn_id=?", (action, status, txn_id))
    return jsonify({"txn_id": txn_id, "action": action, "status": status})


# ------------------------------------------------------- account / upi / net
@app.get("/api/account/<account_number>")
@require_auth
def account(account_number):
    p = engine.account_profile(account_number=account_number)
    if not p:
        return jsonify({"error": "Account not found. Please check the account number."}), 404
    p["recent_transactions"] = [_pub(t) for t in p["recent_transactions"]]
    p["account_number"] = p["masked_account"]  # never return the full number to the client
    return jsonify(p)


@app.get("/api/upi/<path:upi_id>")
@require_auth
def upi(upi_id):
    p = engine.account_profile(upi_id=upi_id)
    if not p:
        return jsonify({"error": "UPI ID not found. Please check and try again."}), 404
    txns = p["recent_transactions"]
    vel = engine.velocity(p["account_number"], datetime.utcnow())
    high = [t for t in txns if t["risk_level"] in ("HIGH", "CRITICAL")]
    profile = {
        "upi_id": upi_id, "masked_account": p["masked_account"],
        "transaction_count": p["transaction_count"], "avg_amount": p["avg_amount"],
        "known_devices": p["known_devices"], "known_locations": p["known_locations"],
        "connected_accounts": p["connected_accounts"],
        "velocity": vel,
        "risk": "HIGH" if len(high) >= 3 else "MEDIUM" if high else "LOW",
        "velocity_flag": "HIGH" if vel["1h"] >= 4 else "NORMAL",
        "new_device": "YES" if len(p["known_devices"]) > 3 else "NO",
        "location_anomaly": "YES" if len(p["known_locations"]) > 2 else "NO",
        "network_anomaly": "YES" if any(c["max_risk_score"] >= 70 for c in p["connected_accounts"]) else "NO",
        "recent_transactions": [_pub(t) for t in txns[:10]],
    }
    return jsonify(profile)


@app.get("/api/network/<account_number>")
@require_auth
def network(account_number):
    p = engine.account_profile(account_number=account_number)
    if not p:
        return jsonify({"error": "Account not found."}), 404
    nodes = [{"id": account_number, "label": p["masked_account"], "type": "account",
              "risk": p["risk_score"], "root": True},
             {"id": p["upi_id"], "label": p["upi_id"], "type": "upi", "risk": p["risk_score"]}]
    edges = [{"source": account_number, "target": p["upi_id"], "kind": "owns"}]
    for d in p["known_devices"][:6]:
        risk = db.q("SELECT MAX(risk_score) r FROM transactions WHERE device_id=?", (d,), one=True)
        nodes.append({"id": d, "label": d, "type": "device", "risk": risk["r"] or 0})
        edges.append({"source": p["upi_id"], "target": d, "kind": "used"})
        for c in db.q("""SELECT DISTINCT account_number a, MAX(risk_score) r FROM transactions
                         WHERE device_id=? AND account_number<>? GROUP BY a LIMIT 3""",
                      (d, account_number)):
            if not any(n["id"] == c["a"] for n in nodes):
                nodes.append({"id": c["a"], "label": db.mask(c["a"]), "type": "account",
                              "risk": c["r"] or 0})
            edges.append({"source": d, "target": c["a"], "kind": "shared",
                          "suspicious": (c["r"] or 0) >= 70})
    return jsonify({"nodes": nodes, "edges": edges})


# ------------------------------------------------------- alerts & cases
@app.get("/api/alerts")
@require_auth
def alerts():
    return jsonify(db.q("SELECT * FROM alerts ORDER BY id DESC LIMIT 50"))


@app.post("/api/alerts/<int:alert_id>/read")
@require_auth
def read_alert(alert_id):
    db.execute("UPDATE alerts SET read=1 WHERE id=?", (alert_id,))
    return jsonify({"ok": True})


@app.get("/api/investigations")
@require_auth
def cases():
    out = []
    for c in db.q("SELECT * FROM cases ORDER BY created_at DESC"):
        c["evidence"] = json.loads(c["evidence"] or "[]")
        c["timeline"] = json.loads(c["timeline"] or "[]")
        out.append(c)
    return jsonify(out)


@app.post("/api/investigation")
@require_auth
def create_case():
    data = body()
    t = db.q("SELECT * FROM transactions WHERE txn_id=?", (data.get("txn_id"),), one=True)
    if not t:
        return jsonify({"error": "Transaction not found."}), 404
    t = _pub(t)
    case_id = f"CASE-{db.q('SELECT COUNT(*) c FROM cases', one=True)['c'] + 1001}"
    db.execute("""INSERT INTO cases(case_id,txn_id,account_number,upi_id,risk_score,status,
                  evidence,timeline,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)""",
               (case_id, t["txn_id"], t["account_number"], t["upi_id"], t["risk_score"], "OPEN",
                json.dumps(t["signals"]), json.dumps(_timeline(t)),
                data.get("notes", ""), db.now()))
    return jsonify({"case_id": case_id, "status": "OPEN"}), 201


@app.patch("/api/investigation/<case_id>")
@require_auth
def update_case(case_id):
    data = body()
    status = data.get("status", "OPEN")
    if status not in ("OPEN", "UNDER REVIEW", "RESOLVED", "FALSE POSITIVE"):
        return jsonify({"error": "Invalid case status."}), 400
    db.execute("UPDATE cases SET status=?, notes=? WHERE case_id=?",
               (status, data.get("notes", ""), case_id))
    return jsonify({"case_id": case_id, "status": status})


# --------------------------------------------------- assistant / demo data
@app.post("/api/assistant")
@require_auth
def ask():
    return jsonify(assistant.answer(body().get("question", "")))


@app.post("/api/demo/generate")
@require_auth
def generate():
    mode = (body().get("mode") or "normal").lower()
    accounts = db.q("SELECT * FROM accounts")
    made = []
    n = {"normal": 6, "suspicious": 5, "attack": 4}.get(mode, 5)
    for i in range(n):
        a = random.choice(accounts)
        devices = json.loads(a["known_devices"])
        if mode == "normal":
            payload = {"account_number": a["account_number"], "upi_id": a["upi_id"],
                       "amount": round(random.uniform(200, 18000), 2),
                       "txn_type": random.choice(db.TYPES), "location": a["home_location"],
                       "device_id": random.choice(devices), "timestamp": db.now()}
        else:
            payload = {"account_number": a["account_number"], "upi_id": a["upi_id"],
                       "amount": round(random.uniform(60000, 240000), 2),
                       "txn_type": random.choice(["UPI", "Bank Transfer"]),
                       "location": random.choice([l for l in db.LOCATIONS if l != a["home_location"]]),
                       "device_id": f"DEV{random.randint(900, 999)}", "timestamp": db.now()}
        made.append(engine.analyse(payload, persist=True))
    return jsonify({"generated": len(made), "mode": mode, "transactions": made,
                    "notice": "Synthetic demo transactions - not real banking data."})


@app.post("/api/demo/simulate-attack")
@require_auth
def simulate_attack():
    """Scripted escalating fraud attack on ACC1001 for the live demo."""
    acc = db.q("SELECT * FROM accounts WHERE account_number='ACC1001'", one=True)
    script = [
        (5000, "Coimbatore", "DEV100", "Normal transaction"),
        (20000, "Coimbatore", "DEV999", "New device introduced"),
        (50000, "Chennai", "DEV999", "New location detected"),
        (90000, "Chennai", "DEV999", "High velocity burst"),
        (145000, "Mumbai", "DEV998", "Network anomaly - shared attacker device"),
    ]
    out = []
    for amount, loc, dev, note in script:
        r = engine.analyse({"account_number": acc["account_number"], "upi_id": acc["upi_id"],
                            "amount": amount, "txn_type": "UPI", "location": loc,
                            "device_id": dev, "timestamp": db.now()}, persist=True)
        r["step_note"] = note
        out.append(r)
    db.add_alert(out[-1]["txn_id"], "CRITICAL", "Fraud attack pattern detected",
                 "Escalating velocity + new device + location change on ACC1001.")
    return jsonify({"steps": out, "final_action": out[-1]["action"],
                    "notice": "Simulated attack on synthetic demo data."})


# -------------------------------------------------------- system / security
@app.get("/api/health")
def health():
    ml_ok = True
    try:
        import ml_model
        ml_model.load()
    except Exception:
        ml_ok = False
    db_ok = bool(db.q("SELECT 1 c", one=True))
    return jsonify({"backend": "ONLINE", "database": "ONLINE" if db_ok else "OFFLINE",
                    "ml_model": "ONLINE" if ml_ok else "DEGRADED", "fraud_engine": "ONLINE",
                    "api": "ONLINE", "ai_assistant": "READY",
                    "uptime_seconds": int((datetime.utcnow() - START).total_seconds())})


@app.get("/api/security")
@require_auth
def security():
    logins = db.q("SELECT email,ip,device,success,created_at FROM login_events ORDER BY id DESC LIMIT 15")
    devices = db.q("""SELECT device_id, COUNT(DISTINCT account_number) accounts, MAX(risk_score) risk
                      FROM transactions GROUP BY device_id HAVING risk>=70 ORDER BY risk DESC LIMIT 10""")
    try:
        import ml_model
        model = ml_model.info()
    except Exception:
        model = {"algorithm": "unavailable"}
    return jsonify({"login_events": logins, "suspicious_devices": devices, "model": model,
                    "auth": {"scheme": "JWT (HS256)", "password_hashing": "PBKDF2-SHA256 120k rounds",
                             "secrets": "loaded from environment variables"}})


@app.post("/api/ml/train")
@require_auth
def train_ml():
    try:
        import ml_model
        info = ml_model.train(save=True)
        return jsonify({"ok": True, "message": "ML Model re-trained on Kaggle dataset", "model": ml_model.info()})
    except Exception as exc:
        return jsonify({"error": f"Model training failed: {str(exc)}"}), 500


if __name__ == "__main__":
    db.init_db()
    try:
        import ml_model
        ml_model.load()
    except Exception as exc:  # the API still works on the rule engine alone
        print("ML model unavailable:", exc)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=False)

