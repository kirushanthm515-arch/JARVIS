"""SQLite layer for FraudShield AI.

All data in this database is SYNTHETIC / DEMO data generated locally.
It is not real banking data. Swap sqlite3 for SQLAlchemy to migrate to
MySQL / PostgreSQL later - all queries are isolated in this module.
"""
import json
import os
import random
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "fraudshield.db"))

LOCATIONS = ["Coimbatore", "Chennai", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune"]
TYPES = ["UPI", "Bank Transfer", "Card", "Wallet"]

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'analyst',
  password_hash TEXT NOT NULL,
  is_verified INTEGER DEFAULT 0,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
  account_number TEXT PRIMARY KEY,
  upi_id TEXT,
  holder_name TEXT,
  opened_at TEXT,
  home_location TEXT,
  known_devices TEXT,
  known_locations TEXT,
  fraud_incidents INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 10
);
CREATE TABLE IF NOT EXISTS transactions (
  txn_id TEXT PRIMARY KEY,
  account_number TEXT,
  upi_id TEXT,
  amount REAL,
  txn_type TEXT,
  location TEXT,
  device_id TEXT,
  created_at TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  action TEXT,
  status TEXT DEFAULT 'COMPLETED',
  reasons TEXT,
  is_fraud INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  txn_id TEXT, level TEXT, title TEXT, message TEXT,
  created_at TEXT, read INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cases (
  case_id TEXT PRIMARY KEY,
  txn_id TEXT, account_number TEXT, upi_id TEXT,
  risk_score INTEGER, status TEXT DEFAULT 'OPEN',
  evidence TEXT, timeline TEXT, notes TEXT, created_at TEXT
);
CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT, ip TEXT, device TEXT, success INTEGER, created_at TEXT
);
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used INTEGER DEFAULT 0
);
"""


def connect():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def q(sql, args=(), one=False):
    conn = connect()
    cur = conn.execute(sql, args)
    rows = [dict(r) for r in cur.fetchall()]
    conn.commit()
    conn.close()
    return (rows[0] if rows else None) if one else rows


def execute(sql, args=()):
    conn = connect()
    conn.execute(sql, args)
    conn.commit()
    conn.close()


def now():
    return datetime.utcnow().isoformat(timespec="seconds")


# ---------------------------------------------------------------- seeding
def init_db(force=False):
    if force and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = connect()
    conn.executescript(SCHEMA)
    # Ensure is_verified column exists on legacy sqlite file
    try:
        conn.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")
    except Exception:
        pass
    conn.commit()
    conn.close()
    if not q("SELECT 1 FROM users LIMIT 1"):
        _seed_users()
    else:
        # Guarantee demo users are verified
        execute("UPDATE users SET is_verified=1 WHERE email IN ('analyst@fraudshield.ai', 'admin@fraudshield.ai')")
    if not q("SELECT 1 FROM accounts LIMIT 1"):
        _seed_accounts()
        _seed_transactions()


def _seed_users():
    from auth import hash_password
    demo = [
        ("analyst@fraudshield.ai", "Demo Analyst", "analyst", "demo1234"),
        ("admin@fraudshield.ai", "Risk Admin", "admin", "admin1234"),
    ]
    for email, name, role, pw in demo:
        execute(
            "INSERT OR IGNORE INTO users(email,name,role,password_hash,is_verified,created_at) VALUES(?,?,?,?,1,?)",
            (email, name, role, hash_password(pw), now()),
        )


def _seed_accounts():
    random.seed(7)
    names = ["Kiruthika R", "Arun Prasad", "Meera Nair", "Vikram Shah", "Divya S",
             "Rahul Menon", "Sneha Iyer", "Karthik V", "Priya Das", "Imran Q",
             "Anitha M", "Joseph K"]
    for i, nm in enumerate(names):
        acc = f"ACC{1001 + i}"
        home = LOCATIONS[i % len(LOCATIONS)]
        devices = [f"DEV{100 + i}", f"DEV{200 + i}"]
        locs = [home] + ([LOCATIONS[(i + 1) % len(LOCATIONS)]] if i % 3 == 0 else [])
        execute(
            """INSERT OR REPLACE INTO accounts
               (account_number,upi_id,holder_name,opened_at,home_location,known_devices,
                known_locations,fraud_incidents,risk_score) VALUES(?,?,?,?,?,?,?,?,?)""",
            (acc, f"{nm.split()[0].lower()}@upi", nm,
             (datetime.utcnow() - timedelta(days=random.randint(20, 2200))).isoformat(timespec="seconds"),
             home, json.dumps(devices), json.dumps(locs),
             1 if i in (4, 9) else 0, random.randint(5, 45)),
        )
    # demo account used in the scripted hackathon flow
    execute(
        """INSERT OR REPLACE INTO accounts
           (account_number,upi_id,holder_name,opened_at,home_location,known_devices,
            known_locations,fraud_incidents,risk_score) VALUES(?,?,?,?,?,?,?,?,?)""",
        ("ACC1001", "demo@upi", "Kiruthika R",
         (datetime.utcnow() - timedelta(days=95)).isoformat(timespec="seconds"),
         "Coimbatore", json.dumps(["DEV100", "DEV200"]),
         json.dumps(["Coimbatore"]), 0, 22),
    )


def _seed_transactions(count=260):
    from fraud_engine import analyse
    random.seed(11)
    accounts = q("SELECT * FROM accounts")
    base = datetime.utcnow() - timedelta(days=30)
    for i in range(count):
        a = random.choice(accounts)
        ts = base + timedelta(minutes=random.randint(0, 43200))
        suspicious = random.random() < 0.22
        devices = json.loads(a["known_devices"])
        payload = {
            "account_number": a["account_number"],
            "upi_id": a["upi_id"],
            "amount": round(random.uniform(40000, 250000) if suspicious else random.uniform(200, 25000), 2),
            "txn_type": random.choice(TYPES),
            "location": random.choice(LOCATIONS) if suspicious else a["home_location"],
            "device_id": f"DEV{random.randint(700, 999)}" if suspicious else random.choice(devices),
            "timestamp": ts.isoformat(timespec="seconds"),
        }
        res = analyse(payload, persist=True, txn_id=f"TXN-{10000 + i}", created_at=payload["timestamp"])
        if res["risk_level"] in ("HIGH", "CRITICAL"):
            add_alert(res["txn_id"], res["risk_level"],
                      "Critical fraud risk detected" if res["risk_level"] == "CRITICAL"
                      else "High-risk transaction detected",
                      f"{res['txn_id']} scored {res['risk_score']}/100 on account "
                      f"{mask(payload['account_number'])}.")


def add_alert(txn_id, level, title, message):
    execute("INSERT INTO alerts(txn_id,level,title,message,created_at,read) VALUES(?,?,?,?,?,0)",
            (txn_id, level, title, message, now()))


def mask(value):
    if not value:
        return value
    tail = value[-4:]
    return "XXXX XXXX " + tail


def create_otp(email):
    code = f"{random.randint(100000, 999999)}"
    exp = (datetime.utcnow() + timedelta(minutes=10)).isoformat(timespec="seconds")
    execute("INSERT INTO otp_verifications(email, code, expires_at, created_at, used) VALUES(?,?,?,?,0)",
            (email.strip().lower(), code, exp, now()))
    return code


def verify_otp(email, code):
    email = email.strip().lower()
    code = str(code).strip()
    row = q("""SELECT * FROM otp_verifications 
               WHERE email=? AND code=? AND used=0 AND expires_at > ? 
               ORDER BY id DESC LIMIT 1""", (email, code, now()), one=True)
    if not row:
        return False
    execute("UPDATE otp_verifications SET used=1 WHERE id=?", (row["id"],))
    return True


def create_user(email, name, role, password, is_verified=0):
    from auth import hash_password
    email = email.strip().lower()
    if q("SELECT 1 FROM users WHERE email=?", (email,), one=True):
        raise ValueError("User with this email already exists.")
    execute("INSERT INTO users(email, name, role, password_hash, is_verified, created_at) VALUES(?,?,?,?,?,?)",
            (email, name.strip() or "Fraud Analyst", role or "analyst", hash_password(password), 1 if is_verified else 0, now()))
    return q("SELECT * FROM users WHERE email=?", (email,), one=True)


def create_verification_token(email):
    import secrets
    email = email.strip().lower()
    # Invalidate previous unused tokens for this email
    execute("UPDATE verification_tokens SET used=1 WHERE email=?", (email,))
    token = secrets.token_hex(32)
    exp = (datetime.utcnow() + timedelta(hours=24)).isoformat(timespec="seconds")
    execute("INSERT INTO verification_tokens(email, token, expires_at, created_at, used) VALUES(?,?,?,?,0)",
            (email, token, exp, now()))
    return token


def verify_token(token):
    token = str(token).strip()
    if not token:
        return ("invalid", None)
    row = q("SELECT * FROM verification_tokens WHERE token=?", (token,), one=True)
    if not row:
        return ("invalid", None)
    email = row["email"]
    user = q("SELECT * FROM users WHERE email=?", (email,), one=True)
    if user and user.get("is_verified") == 1:
        return ("already_verified", email)
    if row["used"] == 1:
        return ("invalid", email)
    if row["expires_at"] <= now():
        return ("expired", email)
    
    # Mark token used & user verified
    execute("UPDATE verification_tokens SET used=1 WHERE id=?", (row["id"],))
    execute("UPDATE users SET is_verified=1 WHERE email=?", (email,))
    return ("success", email)


def mark_user_verified(email):
    execute("UPDATE users SET is_verified=1 WHERE email=?", (email.strip().lower(),))


def get_user_by_email(email):
    return q("SELECT * FROM users WHERE email=?", (email.strip().lower(),), one=True)

