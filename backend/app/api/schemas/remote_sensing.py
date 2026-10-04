from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class SceneInfo(BaseModel):
    scene_id: str = Field(..., description="Unique identifier of the scene")
    satellite: str = Field(..., description="Satellite name, e.g., Sentinel-2 or Landsat")
    source: str = Field(..., description="Data source, e.g., DemoSatelliteProvider")
    acquisition_date: str = Field(..., description="ISO date of acquisition")
    cloud_cover: float = Field(..., description="Cloud percentage")
    bbox: List[float] = Field(..., description="Bounding box [west, south, east, north]")

class BandInfo(BaseModel):
    band_id: str
    name: str
    wavelength: Optional[str] = None
    resolution: str
    description: str
    available: bool

class BandsResponse(BaseModel):
    scene_id: str
    satellite: str
    source: str
    bands: List[BandInfo]

class PreprocessRequest(BaseModel):
    scene_id: str
    selected_bands: List[str]
    options: Dict = Field(default_factory=dict, description="Additional preprocessing options")

class ProcessingStep(BaseModel):
    name: str
    status: str

class PreprocessResponse(BaseModel):
    status: str
    scene_id: str
    selected_bands: List[str]
    processing_steps: List[ProcessingStep]
    output_metadata: Dict
