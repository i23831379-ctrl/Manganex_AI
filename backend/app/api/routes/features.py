from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.api.schemas.feature_engineering import (
    FeatureDefinition,
    FeatureValue,
    FeatureVector,
    FeatureFusionRequest,
    FeatureFusionResponse,
)
from app.services.feature_engineering_service import (
    get_feature_catalog,
    calculate_features,
    fuse_feature_vectors,
)

router = APIRouter()

@router.get("/catalog", response_model=List[FeatureDefinition])
def get_catalog():
    """Return the full feature registry."""
    return get_feature_catalog()

@router.post("/calculate", response_model=List[FeatureValue])
def calculate(request: Dict[str, Any]):
    """Calculate requested features.
    Expected JSON:
    {
        "feature_ids": ["ndvi", "vv"],
        "band_values": {"B04": 0.1, "B08": 0.3, "VV": -15.0, "VH": -20.0}
    }
    """
    feature_ids = request.get("feature_ids")
    band_values = request.get("band_values", {})
    if not feature_ids:
        raise HTTPException(status_code=400, detail="feature_ids list required")
    results = calculate_features(feature_ids, band_values)
    # Convert to FeatureValue list, ignoring errors for simplicity
    feature_values = []
    for r in results:
        if "error" in r:
            raise HTTPException(status_code=400, detail=r["error"])
        fv = FeatureValue(
            feature_id=r["feature_id"],
            value=r["value"],
            provenance=r["provenance"],
        )
        feature_values.append(fv)
    return feature_values

@router.post("/fuse", response_model=FeatureFusionResponse)
def fuse(request: FeatureFusionRequest):
    """Fuse a set of feature values into a single vector.
    The request should include a list of FeatureValue dicts (as payload).
    For demo we accept a simple list under "features".
    """
    # In a real implementation we'd fetch stored values; here we expect payload.
    # The client should send feature values directly.
    # For flexibility, read raw body
    from fastapi import Request
    async def inner(req: Request):
        body = await req.json()
        vectors = body.get("features")
        if not vectors:
            raise HTTPException(status_code=400, detail="features list required")
        fused = fuse_feature_vectors(vectors)
        return FeatureFusionResponse(
            scene_id=request.scene_id,
            fused_vector=fused["fused_vector"],
            provenance=fused["provenance"],
        )
    return inner  # FastAPI will treat this as a dependency function
