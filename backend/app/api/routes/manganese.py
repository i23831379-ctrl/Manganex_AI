from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import csv
import io

from app.database import get_db
from app.models.target import ExplorationTarget
from app.services.ml_service import ml_predictor

router = APIRouter()

# ---------- Schemas ----------
from pydantic import BaseModel, Field, validator

class ManganesePredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    features: Dict[str, float]

    @validator("features")
    def at_least_one_feature(cls, v):
        if not v:
            raise ValueError("features must contain at least one entry")
        return v

class BatchPredictionRequest(BaseModel):
    requests: List[ManganesePredictionRequest]

class ModelStatusResponse(BaseModel):
    mineral: str = "manganese"
    status: str = "demo"
    metrics: Any = None
    training_date: Any = None
    feature_list: List[str] = Field(default_factory=lambda: ["elevation", "slope", "magnetic_value", "mn_concentration", "fe_concentration"])
    record_count: Any = None

class UploadResponse(BaseModel):
    mineral: str = "manganese"
    record_count: int
    feature_columns: List[str]

# ---------- Helper ----------
def _target_to_response(target: ExplorationTarget) -> Dict[str, Any]:
    return {
        "id": target.id,
        "code": target.id,
        "name": target.name,
        "description": target.description,
        "latitude": target.latitude,
        "longitude": target.longitude,
        "prospectivity_score": target.prospectivity_score,
        "is_verified": target.is_verified,
        "mineral": "manganese",
        "model_status": "demo",
    }

# ---------- Routes ----------
@router.get("/targets", response_model=List[Dict[str, Any]])
def get_manganese_targets(db: Session = Depends(get_db)):
    targets = db.query(ExplorationTarget).all()
    return [_target_to_response(t) for t in targets]

@router.get("/targets/{target_id}", response_model=Dict[str, Any])
def get_manganese_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(ExplorationTarget).filter(ExplorationTarget.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return _target_to_response(target)

@router.get("/prospectivity", response_model=Dict[str, Any])
def get_manganese_prospectivity(db: Session = Depends(get_db)):
    targets = db.query(ExplorationTarget).all()
    features = []
    for t in targets:
        pred = ml_predictor.predict(t.latitude, t.longitude)
        prob = pred["prospectivity_score"]
        classification = "VERY_HIGH" if prob > 0.8 else "HIGH" if prob > 0.6 else "MEDIUM" if prob > 0.4 else "LOW"
        offset = 0.05
        ring = [
            [t.longitude - offset, t.latitude - offset],
            [t.longitude + offset, t.latitude - offset],
            [t.longitude + offset, t.latitude + offset],
            [t.longitude - offset, t.latitude + offset],
            [t.longitude - offset, t.latitude - offset],
            [t.longitude - offset, t.latitude - offset],
            [t.longitude + offset, t.latitude - offset],
            [t.longitude + offset, t.latitude + offset],
            [t.longitude - offset, t.latitude + offset],
        ]
        feature = {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [ring]},
            "properties": {
                "target_id": t.id,
                "mineral": "manganese",
                "classification": classification,
                "manganese_probability": prob,
                "model_status": "demo",
                "latitude": t.latitude,
                "longitude": t.longitude,
            },
        }
        features.append(feature)
    return {"type": "FeatureCollection", "features": features}

@router.post("/predict", response_model=Dict[str, Any])
def predict_manganese(req: ManganesePredictionRequest):
    pred = ml_predictor.predict(req.latitude, req.longitude)
    prob = pred["prospectivity_score"]
    return {
        "mineral": "manganese",
        "manganese_probability": prob,
        "model_status": "demo",
        "feature_summary": sorted(req.features.keys()),
    }

@router.post("/predict-batch", response_model=List[Dict[str, Any]])
def batch_predict(req: BatchPredictionRequest):
    results = []
    for item in req.requests:
        pred = ml_predictor.predict(item.latitude, item.longitude)
        prob = pred["prospectivity_score"]
        results.append({
            "mineral": "manganese",
            "manganese_probability": prob,
            "model_status": "demo",
            "feature_summary": list(item.features.keys()),
        })
    return results

@router.get("/model/status", response_model=ModelStatusResponse)
def model_status_endpoint():
    return ModelStatusResponse()

@router.post("/upload-data", response_model=UploadResponse)
def upload_csv(csv_text: Dict[str, str]):
    text = csv_text.get("csv_text")
    if not text:
        raise HTTPException(status_code=422, detail="csv_text is required")
    f = io.StringIO(text)
    reader = csv.DictReader(f)
    required = {"latitude", "longitude", "label"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=422, detail="Missing required columns")
    records = []
    seen = set()
    for row in reader:
        try:
            float(row["latitude"])
            float(row["longitude"])
        except (ValueError, KeyError):
            raise HTTPException(status_code=422, detail="Invalid data row")
        coord = (row["latitude"].strip(), row["longitude"].strip())
        if coord in seen:
            raise HTTPException(status_code=422, detail="Duplicate coordinates")
        seen.add(coord)
        records.append(row)
    feature_cols = [c for c in reader.fieldnames if c not in required]
    return UploadResponse(record_count=len(records), feature_columns=feature_cols)
