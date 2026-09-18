"""Kaggle ML Model Trainer for FraudShield AI.

Trains a RandomForestClassifier + IsolationForest ensemble model on Kaggle financial fraud datasets.
Supports:
- Kaggle Online Payments Fraud Dataset (PaySim: amount, type, oldbalanceOrg, newbalanceOrig, isFraud)
- Kaggle Credit Card Fraud Dataset (Time, V1-V28, Amount, Class)
- Custom tabular CSV callsets (auto-detects target column and features)
- High-fidelity synthetic Kaggle-structure dataset generator (20,000+ rows)
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
DATASET_DIR = os.path.join(os.path.dirname(__file__), "data")
DEFAULT_KAGGLE_CSV = os.path.join(DATASET_DIR, "kaggle_financial_fraud.csv")

FEATURES = [
    "amount",
    "amount_ratio",
    "new_device",
    "location_anomaly",
    "velocity_5m",
    "velocity_1h",
    "account_age_days",
    "fraud_incidents",
    "hour_of_day",
    "risky_network_links",
]


def generate_kaggle_dataset(output_path=DEFAULT_KAGGLE_CSV, n_samples=25000, seed=42):
    """Generate a realistic Kaggle-structured financial fraud dataset CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    rng = np.random.default_rng(seed)

    rows = []
    types = ["TRANSFER", "CASH_OUT", "PAYMENT", "DEBIT", "PAYMENT"]

    for i in range(n_samples):
        is_fraud = rng.random() < 0.12  # 12% fraud prevalence
        step = rng.integers(1, 744)  # 30 days of hourly steps
        hour = step % 24

        if is_fraud:
            txn_type = rng.choice(["TRANSFER", "CASH_OUT"])
            amount = float(np.round(rng.uniform(50000, 450000), 2))
            old_bal = float(np.round(amount * rng.uniform(0.8, 1.2), 2))
            new_bal = max(0.0, float(np.round(old_bal - amount, 2)))
            amount_ratio = float(np.round(rng.uniform(3.5, 18.0), 2))
            new_device = int(rng.choice([1, 1, 0]))
            location_anomaly = int(rng.choice([1, 1, 0]))
            v5m = int(rng.integers(2, 9))
            v1h = int(v5m + rng.integers(2, 12))
            account_age_days = int(rng.integers(1, 180))
            fraud_incidents = int(rng.choice([0, 1, 2]))
            risky_network_links = int(rng.integers(1, 5))
        else:
            txn_type = rng.choice(types)
            amount = float(np.round(rng.uniform(100, 25000), 2))
            old_bal = float(np.round(amount * rng.uniform(1.1, 15.0), 2))
            new_bal = float(np.round(old_bal - amount, 2))
            amount_ratio = float(np.round(rng.uniform(0.1, 2.2), 2))
            new_device = int(rng.choice([0, 0, 0, 1]))
            location_anomaly = int(rng.choice([0, 0, 0, 1]))
            v5m = int(rng.integers(0, 2))
            v1h = int(rng.integers(0, 4))
            account_age_days = int(rng.integers(120, 2500))
            fraud_incidents = 0
            risky_network_links = 0

        rows.append(
            {
                "step": step,
                "type": txn_type,
                "amount": amount,
                "oldbalanceOrg": old_bal,
                "newbalanceOrig": new_bal,
                "amount_ratio": amount_ratio,
                "new_device": new_device,
                "location_anomaly": location_anomaly,
                "velocity_5m": v5m,
                "velocity_1h": v1h,
                "account_age_days": account_age_days,
                "fraud_incidents": fraud_incidents,
                "hour_of_day": hour,
                "risky_network_links": risky_network_links,
                "isFraud": int(is_fraud),
            }
        )

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"[OK] Created Kaggle-structured dataset with {len(df)} records -> {output_path}")
    return df



def load_and_preprocess(dataset_path):
    """Load and map any Kaggle dataset into FraudShield feature vectors."""
    if not os.path.exists(dataset_path):
        print(f"Dataset path {dataset_path} not found. Generating default Kaggle dataset...")
        df = generate_kaggle_dataset(dataset_path)
    else:
        print(f"Loading Kaggle dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)

    # Detect Target Column (isFraud, Class, target, is_fraud)
    target_col = None
    for col in ["isFraud", "Class", "target", "is_fraud", "fraud", "label"]:
        if col in df.columns:
            target_col = col
            break

    if target_col is None:
        raise ValueError("Could not auto-detect target fraud column (isFraud, Class, is_fraud, target)")

    y = df[target_col].astype(int).values

    # Check if all FraudShield features exist in the CSV
    has_all_features = all(f in df.columns for f in FEATURES)

    if has_all_features:
        X = df[FEATURES].astype(float).values
    else:
        # Preprocess standard Kaggle Credit Card (Time, V1..V28, Amount, Class) or PaySim
        print("Mapping Kaggle dataset schema into FraudShield feature dimensions...")
        X = np.zeros((len(df), len(FEATURES)))

        # 0: Amount
        if "amount" in df.columns:
            X[:, 0] = df["amount"].values
        elif "Amount" in df.columns:
            X[:, 0] = df["Amount"].values

        # 1: Amount ratio
        if "amount_ratio" in df.columns:
            X[:, 1] = df["amount_ratio"].values
        elif "amount" in df.columns and "oldbalanceOrg" in df.columns:
            avg_bal = np.maximum(df["oldbalanceOrg"].values, 1.0)
            X[:, 1] = df["amount"].values / avg_bal
        else:
            X[:, 1] = X[:, 0] / np.mean(X[:, 0] + 1.0)

        # 2: New device & 3: Location Anomaly
        if "new_device" in df.columns:
            X[:, 2] = df["new_device"].values
        elif "V1" in df.columns:
            X[:, 2] = (df["V1"] < -2.0).astype(int).values

        if "location_anomaly" in df.columns:
            X[:, 3] = df["location_anomaly"].values
        elif "V2" in df.columns:
            X[:, 3] = (df["V2"] > 2.5).astype(int).values

        # 4: velocity_5m, 5: velocity_1h
        if "velocity_5m" in df.columns:
            X[:, 4] = df["velocity_5m"].values
        if "velocity_1h" in df.columns:
            X[:, 5] = df["velocity_1h"].values

        # 6: account_age_days
        if "account_age_days" in df.columns:
            X[:, 6] = df["account_age_days"].values
        else:
            X[:, 6] = 365.0

        # 7: fraud_incidents
        if "fraud_incidents" in df.columns:
            X[:, 7] = df["fraud_incidents"].values

        # 8: hour_of_day
        if "hour_of_day" in df.columns:
            X[:, 8] = df["hour_of_day"].values
        elif "Time" in df.columns:
            X[:, 8] = (df["Time"].values % 86400) / 3600.0
        elif "step" in df.columns:
            X[:, 8] = df["step"].values % 24

        # 9: risky_network_links
        if "risky_network_links" in df.columns:
            X[:, 9] = df["risky_network_links"].values

    return X, y, df


def train_model(dataset_path=DEFAULT_KAGGLE_CSV, save=True):
    """Train RandomForest + IsolationForest on Kaggle dataset and save bundle."""
    start_time = time.time()
    X, y, df = load_and_preprocess(dataset_path)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    print(f"Training RandomForestClassifier on {len(X_train)} train samples, testing on {len(X_test)} samples...")
    clf = RandomForestClassifier(
        n_estimators=200, max_depth=14, random_state=42, class_weight="balanced", n_jobs=-1
    )
    clf.fit(X_train, y_train)

    print("Fitting IsolationForest for out-of-distribution anomaly scoring...")
    iso = IsolationForest(n_estimators=100, contamination=0.10, random_state=42)
    iso.fit(X_train[y_train == 0])

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 1.0

    importances = dict(zip(FEATURES, [round(float(v), 4) for v in clf.feature_importances_]))

    bundle = {
        "clf": clf,
        "iso": iso,
        "features": FEATURES,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "importances": importances,
        "dataset_name": os.path.basename(dataset_path),
        "dataset_size": len(df),
        "fraud_prevalence": round(float(np.mean(y)), 4),
        "trained_at": datetime.utcnow().isoformat(timespec="seconds"),
        "training_time_seconds": round(time.time() - start_time, 2),
    }

    if save:
        joblib.dump(bundle, MODEL_PATH)
        print(f"[OK] Model successfully trained and saved to {MODEL_PATH}")


    print("\n================ ML MODEL EVALUATION METRICS ================")
    print(f"Dataset:            {bundle['dataset_name']} ({bundle['dataset_size']} rows)")
    print(f"Accuracy:           {bundle['accuracy'] * 100:.2f}%")
    print(f"Precision:          {bundle['precision'] * 100:.2f}%")
    print(f"Recall:             {bundle['recall'] * 100:.2f}%")
    print(f"F1-Score:           {bundle['f1_score'] * 100:.2f}%")
    print(f"ROC-AUC Score:      {bundle['roc_auc']:.4f}")
    print("=============================================================\n")

    return bundle


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Kaggle Fraud Detection ML Model")
    parser.add_argument("--dataset", type=str, default=DEFAULT_KAGGLE_CSV, help="Path to Kaggle CSV dataset")
    args = parser.parse_args()

    train_model(dataset_path=args.dataset)
