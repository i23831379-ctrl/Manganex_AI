import pandas as pd
import numpy as np
# Simple linear regression using NumPy (no sklearn dependency)
class SimpleLinearRegressor:
    def __init__(self):
        self.coef_ = None
        self.intercept_ = None

    def fit(self, X, y):
        # Add bias term
        X_mat = np.column_stack([np.ones(X.shape[0]), X])
        # Solve least squares
        coeffs, *_ = np.linalg.lstsq(X_mat, y, rcond=None)
        self.intercept_ = coeffs[0]
        self.coef_ = coeffs[1:]
        return self

    def predict(self, X):
        return self.intercept_ + X.dot(self.coef_)

    def score(self, X, y):
        y_pred = self.predict(X)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        return 1 - ss_res / ss_tot

import joblib
import os
def train_test_split(X, y, test_size=0.2, random_state=None):
    """Simple train-test split using numpy random shuffling.
    Returns X_train, X_test, y_train, y_test.
    """
    if random_state is not None:
        np.random.seed(random_state)
    indices = np.arange(len(X))
    np.random.shuffle(indices)
    test_len = int(len(X) * test_size)
    test_idx = indices[:test_len]
    train_idx = indices[test_len:]
    # Preserve pandas DataFrame/Series indexing if applicable
    X_train = X.iloc[train_idx] if hasattr(X, "iloc") else X[train_idx]
    X_test = X.iloc[test_idx] if hasattr(X, "iloc") else X[test_idx]
    y_train = y.iloc[train_idx] if hasattr(y, "iloc") else y[train_idx]
    y_test = y.iloc[test_idx] if hasattr(y, "iloc") else y[test_idx]
    return X_train, X_test, y_train, y_test
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "mining_production_logs.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "shortfall_xgb_model.joblib")

# Load data
df = pd.read_csv(DATA_PATH)
# Features and target
X = df[["rainfall_mm", "equipment_downtime_hrs", "blasting_delays_hrs", "active_haul_trucks"]]
y = df["shortfall_tons"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = SimpleLinearRegressor()
model.fit(X_train, y_train)

# Simple evaluation
score = model.score(X_test, y_test)
print(f"Model R^2 on test set: {score:.4f}")

# Ensure model dir exists
os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model, MODEL_PATH)
print(f"Saved model to {MODEL_PATH}")
