from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FeatureDefinition(BaseModel):
    feature_id: str = Field(..., description="Unique identifier for the feature")
    name: str = Field(..., description="Human readable name")
    category: str = Field(..., description="e.g., optical, sar, terrain, geological, exploration")
    formula: Optional[str] = Field(None, description="Mathematical expression or description")
    required_bands: List[str] = Field(default_factory=list, description="Band IDs required for calculation")
    description: Optional[str] = Field(None, description="Detailed description")
    unit: Optional[str] = Field(None, description="Units of the feature value")
    availability: str = Field(..., description="demo or real")
    source_sensor: Optional[str] = Field(None, description="Source sensor name, e.g., Sentinel-2, Sentinel-1, DEM")
    processing_method: Optional[str] = Field(None, description="Method used to compute the feature")
    demo_supported: bool = Field(False, description="Indicates if feature is supported in DEMO mode")
    real_data_supported: bool = Field(False, description="Indicates if feature can be computed with real data")

class FeatureValue(BaseModel):
    feature_id: str = Field(..., description="Reference to FeatureDefinition")
    value: Any = Field(..., description="Computed value (float, int, etc.)")
    provenance: Dict[str, Any] = Field(..., description="Metadata about source and processing")

class FeatureVector(BaseModel):
    scene_id: str = Field(..., description="Scene identifier the vector belongs to")
    features: List[FeatureValue] = Field(..., description="List of computed feature values")

class FeatureFusionRequest(BaseModel):
    scene_id: str = Field(..., description="Scene identifier to fuse features for")
    feature_ids: Optional[List[str]] = Field(None, description="Specific features to fuse (optional)")

class FeatureFusionResponse(BaseModel):
    scene_id: str = Field(..., description="Scene identifier")
    fused_vector: Dict[str, Any] = Field(..., description="Feature ID → value map")
    provenance: Dict[str, Any] = Field(..., description="Overall provenance for the fused vector")
