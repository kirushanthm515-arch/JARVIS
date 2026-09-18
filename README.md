<<<<<<< HEAD
# COTNEXA

**Real-Time AI Financial Risk Intelligence Platform**

> All data in this project is **synthetic demo data generated locally**. It is not real banking data. The system produces a **risk assessment to support investigation** — it cannot guarantee fraud detection and the score is an advisory risk index.

---

## 1. Problem Statement

Fraud engines that score a transaction in isolation miss complex attacks. A ₹95,000 UPI transfer is unremarkable on its own; it is alarming when it comes from a device the account has never used, from a city the account never transacts in, three minutes after two other transfers, on a handset shared with an account that was blocked recently.

**COTNEXA** scores transactions **in full context**: transaction behaviour, account history, account number, UPI ID, device characteristics, location patterns, transaction velocity, and network relationships.

---

## 2. Risk Output & Actions

| Output | What It Means |
|---|---|
| **Risk Score** | Transparent 0–100 score: rule engine (65%) blended with a RandomForest ML model (35%) |
| **Risk Level** | LOW (0–30) · MEDIUM (31–70) · HIGH (71–85) · CRITICAL (86–100) |
| **Evidence** | Every signal with severity level, human-readable evidence, and point contribution |
| **Recommended Action** | ALLOW / VERIFY / RESTRICT / BLOCK (overridable by security analyst) |

---

## 3. Features

* **Landing Page & Authentication**: JWT authentication with demo login, email verification, dark/light theme.
* **Dashboard**: Animated KPI counters, live transaction monitor, one-click fraud attack simulation.
* **3D Visualizations & WebGL**: Interactive 3D CyberShield, 3D Network Graph, 3D Scan Beam, and Threat Globe.
* **Analyze Transaction**: Circular risk meter, explainable signal cards, velocity windows, and action triggers.
* **Account & UPI Intelligence**: Account age, averages, known devices/locations, connected accounts, risk timeline.
* **Fraud Network Graph**: Interactive SVG & 3D graph with clickable nodes and highlighted suspicious edges.
* **Transaction History**: Real-time search, risk filtering, column sorting, and CSV export.
* **Analytics**: Fraud vs. legitimate breakdown, risk distribution, location/type analysis, volume trends.
* **Investigation Case Management**: Alert center and case manager with full evidence timelines and notes.
* **AI Investigation Assistant**: AI assistant grounded strictly in the local database.
* **Security & Auth Posture**: Login attempt audit logs, suspicious device tracking, model posture.
* **Multi-language Support (i18n)**: Instant switching between 6 languages (English, Tamil, Hindi, Telugu, Malayalam, Kannada).

---

## 4. Architecture

```
React + Vite + Tailwind  ──REST/JWT──►  Flask API
  (frontend/)                            (backend/app.py)
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
               Fraud Engine           ML Model              SQLite Database
             (fraud_engine.py)      (ml_model.py)               (db.py)
           6 signal families     RandomForest + IsolationForest  accounts,
           transparent scoring   trained on synthetic data       transactions,
                                                                 alerts, cases
```

---

## 5. Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Three.js / React Three Fiber, Recharts, Lucide Icons, Framer Motion, React Router.
* **Backend**: Python 3, Flask, Flask-CORS, PyJWT, PBKDF2 password hashing.
* **AI/ML**: Scikit-Learn (`RandomForestClassifier`, `IsolationForest`), NumPy, Joblib.
* **Database**: SQLite (`fraudshield.db` — auto-initialized and seeded on startup via `db.py`).

---

## 6. Installation & Setup

### Prerequisites
* **Node.js**: v18+ and `npm`
* **Python**: v3.9+ and `pip`

---

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create environment configuration
cp .env.example .env

# 5. Start Flask backend server (runs on http://localhost:5000)
python app.py
```

*Note: On first run, the backend automatically initializes `fraudshield.db`, seeds synthetic accounts/transactions, and loads the pre-trained `model.joblib`.*

---

### Frontend Setup

Open a second terminal window:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Create environment configuration
cp .env.example .env

# 4. Start Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## 7. Environment Variables

### Root / Backend `.env.example`
```env
PORT=5000
JWT_SECRET=dev-cyber-defense-key-998811
JWT_TTL_HOURS=8
CORS_ORIGIN=*
DB_PATH=fraudshield.db
FRONTEND_URL=http://localhost:5173

# Optional: Email Verification / SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@cotnexa.ai

# Optional: AI Assistant LLM Key
LLM_API_KEY=
```

### Frontend `.env.example`
```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TARGET=http://localhost:5000
```

---

## 8. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Analyst | `analyst@fraudshield.ai` | `demo1234` |
| Admin | `admin@fraudshield.ai` | `admin1234` |

*The login screen includes a **Demo Login** button that fills these credentials automatically.*

---

## 9. License & Responsible Use

Synthetic data only. All passwords are stored using PBKDF2-SHA256 hashes. Secrets are loaded strictly from environment variables.
=======
# JARVIS
>>>>>>> 5136ef96ce8529dfa37581784443d4362ec15307
