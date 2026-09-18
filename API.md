# FraudShield AI — API Documentation

Base URL: `http://localhost:5000/api`
Auth: every endpoint except `/login` and `/health` requires `Authorization: Bearer <JWT>`.
Errors return `{ "error": "friendly message" }` with 400 / 401 / 404 / 500.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/login` | Exchange email + password for a JWT |
| GET | `/me` | Current token claims |
| GET | `/health` | Backend, DB, ML, engine, API, assistant status |
| GET | `/dashboard` | KPIs, risk distribution, 12 most recent transactions |
| GET | `/analytics` | Aggregates by location, type, day and risk level |
| GET | `/transactions?search=&risk_level=&limit=` | Searchable transaction list |
| GET | `/transaction/<txn_id>` | One transaction with signals and timeline |
| POST | `/transaction/check` | Run the fraud engine on a transaction |
| POST | `/transaction/<txn_id>/action` | Set ALLOW / VERIFY / RESTRICT / BLOCK |
| GET | `/account/<account_number>` | Account risk profile (number returned masked) |
| GET | `/upi/<upi_id>` | UPI risk profile with velocity and anomaly flags |
| GET | `/network/<account_number>` | Graph nodes and edges for the account |
| GET | `/alerts` | Recent alerts |
| POST | `/alerts/<id>/read` | Mark an alert read |
| GET | `/investigations` | All cases with evidence and timeline |
| POST | `/investigation` | Create a case from a transaction |
| PATCH | `/investigation/<case_id>` | Update status / notes |
| POST | `/assistant` | Ask the investigation assistant |
| POST | `/demo/generate` | Generate synthetic transactions (`normal`/`suspicious`/`attack`) |
| POST | `/demo/simulate-attack` | Scripted escalating attack on ACC1001 |
| GET | `/security` | Login events, suspicious devices, model info |

## POST /login
```json
{ "email": "analyst@fraudshield.ai", "password": "demo1234" }
```
```json
{ "token": "eyJhbGciOi...", "user": { "email": "...", "name": "Demo Analyst", "role": "analyst" } }
```

## POST /transaction/check
```json
{
  "account_number": "ACC1001", "upi_id": "demo@upi", "amount": 95000,
  "txn_type": "UPI", "device_id": "DEV999", "location": "Chennai",
  "timestamp": "2026-05-01T21:14:00"
}
```
```json
{
  "txn_id": "TXN-9A31C2",
  "masked_account": "XXXX XXXX 1001",
  "risk_score": 80, "rule_score": 69.7, "ml_score": 100.0, "ml_available": true,
  "risk_level": "HIGH", "action": "RESTRICT",
  "signals": [
    { "signal": "NEW_DEVICE", "label": "New device detected", "severity": "High",
      "evidence": "Device DEV999 has never been associated with this account. 2 device(s) previously seen.",
      "contribution": 18 }
  ],
  "velocity": { "1m": 0, "5m": 0, "15m": 0, "1h": 0, "24h": 1 },
  "explanation": "This transaction scored 80/100 (HIGH) because of 6 contextual signal(s)...",
  "disclaimer": "Synthetic demo data. Risk assessment for investigation support only..."
}
```

## Error examples
| Status | Body |
|---|---|
| 400 | `{ "error": "Please enter a valid transaction amount." }` |
| 401 | `{ "error": "Session expired. Please log in again." }` |
| 404 | `{ "error": "Account not found. Please check the account number." }` |
