from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.target import ExplorationTarget
from app.schemas.ml import PredictionResponse, ShortfallResponse
from pydantic import BaseModel
from app.services.ml_service import ml_predictor
from app.services.shortfall_service import predict_shortfall

router = APIRouter()

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float

@router.post("/predict", response_model=PredictionResponse)
def predict_prospectivity(req: PredictionRequest):
    """
    Run the ML model (simulator) on a specific coordinate.
    """
    prediction = ml_predictor.predict(req.latitude, req.longitude)
    return {
        "latitude": req.latitude,
        "longitude": req.longitude,
        **prediction
    }

@router.post("/shortfall/predict", response_model=ShortfallResponse)
def predict_shortfall_endpoint(rainfall_mm: float, equipment_downtime_hrs: float, blasting_delays_hrs: float, active_haul_trucks: float):
    """Predict shortfall tons using the trained linear model.
    ``predict_shortfall`` expects a dict of features.
    """
    features = {
        "rainfall_mm": rainfall_mm,
        "equipment_downtime_hrs": equipment_downtime_hrs,
        "blasting_delays_hrs": blasting_delays_hrs,
        "active_haul_trucks": active_haul_trucks,
    }
    return predict_shortfall(features)

@router.get("/target/{target_id}/explanation", response_model=PredictionResponse)
def get_target_explanation(target_id: int, db: Session = Depends(get_db)):
    """
    Fetch SHAP explanation for an existing target.
    """
    target = db.query(ExplorationTarget).filter(ExplorationTarget.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
        
    prediction = ml_predictor.predict(target.latitude, target.longitude)
    return {
        "target_id": target.id,
        "latitude": target.latitude,
        "longitude": target.longitude,
        **prediction
    }
