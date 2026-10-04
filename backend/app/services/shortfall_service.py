import os
import joblib
import numpy as np
from typing import Dict, Any

# Load the pre-trained shortfall model (LinearRegressor saved with joblib)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "shortfall_xgb_model.joblib")

# Lazy load model to avoid loading on import if not needed
_model = None

def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Shortfall model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_shortfall(features: Dict[str, Any]) -> Dict[str, Any]:
    """Predict shortfall tons given input feature values.

    Expected keys in ``features``:
        - rainfall_mm
        - equipment_downtime_hrs
        - blasting_delays_hrs
        - active_haul_trucks
    """
    model = _load_model()
    X = np.array([
        features.get("rainfall_mm"),
        features.get("equipment_downtime_hrs"),
        features.get("blasting_delays_hrs"),
        features.get("active_haul_trucks"),
    ], dtype=float).reshape(1, -1)
    pred = model.predict(X)[0]
    return {"shortfall_tons": float(pred)}
