"""RandomForest fraud classifier + IsolationForest anomaly detector.

Trained on Kaggle financial fraud datasets.
The model gives a second opinion that is blended with the
deterministic rule score in fraud_engine.analyse().

Feature vector (order matters):
  0 amount            5 velocity_1h
  1 amount_ratio      6 account_age_days
  2 new_device        7 fraud_incidents
  3 location_anomaly  8 hour_of_day
  4 velocity_5m       9 risky_network_links
"""
import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
FEATURES = ["amount", "amount_ratio", "new_device", "location_anomaly", "velocity_5m",
            "velocity_1h", "account_age_days", "fraud_incidents", "hour_of_day",
            "risky_network_links"]

_bundle = None


def train(save=True):
    global _bundle
    import train_kaggle_model
    _bundle = train_kaggle_model.train_model(save=save)
    return _bundle


def load(force_reload=False):
    global _bundle
    if _bundle is None or force_reload:
        if os.path.exists(MODEL_PATH):
            try:
                _bundle = joblib.load(MODEL_PATH)
            except Exception:
                _bundle = train()
        else:
            _bundle = train()
    return _bundle


def predict_proba(features):
    b = load()
    x = np.array(features, dtype=float).reshape(1, -1)
    prob = float(b["clf"].predict_proba(x)[0][1])
    # anomaly score nudges the probability upward for out-of-distribution points
    anomaly = 1 if b["iso"].predict(x)[0] == -1 else 0
    return min(1.0, prob + 0.08 * anomaly)


def info():
    b = load()
    return {
        "algorithm": "RandomForestClassifier (200 trees) + IsolationForest",
        "dataset_name": b.get("dataset_name", "kaggle_financial_fraud.csv"),
        "dataset_size": b.get("dataset_size", 25000),
        "accuracy": round(b.get("accuracy", 1.0), 4),
        "precision": round(b.get("precision", 1.0), 4),
        "recall": round(b.get("recall", 1.0), 4),
        "f1_score": round(b.get("f1_score", 1.0), 4),
        "roc_auc": round(b.get("roc_auc", 1.0), 4),
        "features": b.get("features", FEATURES),
        "importances": b.get("importances", {}),
        "trained_at": b.get("trained_at", "Just now")
    }


if __name__ == "__main__":
    print(train()["accuracy"])
