"""Authentication: PBKDF2 password hashing + JWT session tokens."""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import jsonify, request

SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
ALGO = "HS256"
TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "8"))


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"pbkdf2$120000${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, rounds, salt_hex, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def make_token(user: dict) -> str:
    payload = {
        "sub": user["email"],
        "name": user.get("name"),
        "role": user.get("role", "analyst"),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TTL_HOURS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)


def decode_token(token: str):
    return jwt.decode(token, SECRET, algorithms=[ALGO])


def send_verification_email(email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    
    # Always log development link to console for local testing
    print(f"\n==================================================")
    print(f"[COTNEXA DEV VERIFICATION LINK FOR {email}]")
    print(f"{verify_url}")
    print(f"==================================================\n")

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@cotnexa.ai")

    if not smtp_host or not smtp_user:
        return (False, verify_url)

    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your COTNEXA account"
        msg["From"] = smtp_from
        msg["To"] = email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background-color: #080d19; color: #f1f5f9; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #0d1527; border: 1px solid rgba(0,240,255,0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h1 style="color: #00f0ff; margin-top: 0; font-size: 24px; tracking: 1px;"># COTNEXA</h1>
            <p style="color: #94a3b8; font-size: 13px; font-weight: 600;">Real-Time Financial Risk Intelligence Platform</p>
            <hr style="border: none; border-top: 1px solid rgba(0,240,255,0.2); margin: 20px 0;" />
            <h2 style="color: #ffffff; font-size: 18px;">Welcome to COTNEXA!</h2>
            <p style="color: #cbd5e1; line-height: 1.6; font-size: 14px;">
              Please verify your email address by clicking the button below to complete your registration and activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{verify_url}" style="background: linear-gradient(90deg, #00f0ff, #3b82f6); color: #03060d; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
                VERIFY EMAIL ADDRESS
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              If you did not request this email, please ignore this message. This verification link will expire in 24 hours.
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 24px; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
              COTNEXA Cyber Security Gateway · Automated System Notice
            </div>
          </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [email], msg.as_string())
        return (True, verify_url)
    except Exception as exc:
        print(f"[COTNEXA SMTP ERROR]: {exc}")
        return (False, verify_url)


def require_auth(fn):
    """Route decorator - rejects missing/expired bearer tokens."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Missing authentication token"}), 401
        try:
            request.user = decode_token(header.split(" ", 1)[1])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Invalid authentication token"}), 401
        return fn(*args, **kwargs)
    return wrapper

