from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional

from app.config import settings
from app.services.satellite_provider import (
    SatelliteProvider,
    DemoSatelliteProvider,
    RealSatelliteProvider,
    SatelliteSearchRequest,
    SatelliteScene,
)

router = APIRouter()

def get_provider() -> SatelliteProvider:
    """Return the appropriate satellite provider based on demo mode.

    In demo mode we always use ``DemoSatelliteProvider``. In production mode
    we attempt to instantiate ``RealSatelliteProvider`` which requires an
    environment variable ``SATELLITE_API_KEY``. If the key is missing we raise a
    clear error.
    """
    if settings.DEMO_MODE:
        return DemoSatelliteProvider()
    else:
        try:
            return RealSatelliteProvider()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

class SatelliteSearchRequestModel(BaseModel):
    bbox: List[float] = Field(..., description="[west, south, east, north]")
    start_date: date = Field(..., description="Start of acquisition period")
    end_date: date = Field(..., description="End of acquisition period")
    max_cloud: float = Field(20.0, ge=0, le=100, description="Maximum cloud cover percentage")
    satellite: Optional[str] = Field(None, description="Sentinel-2 or Landsat")

class SatelliteSceneResponse(BaseModel):
    scene_id: str
    satellite: str
    sensor: Optional[str] = None
    acquisition_date: date
    processing_date: Optional[date] = None
    cloud_cover: Optional[float] = None
    bbox: Optional[List[float]] = None
    center_coordinates: Optional[List[float]] = None
    product_level: Optional[str] = None
    processing_baseline: Optional[str] = None
    provider: Optional[str] = None
    provider_product_id: Optional[str] = None
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    crs: Optional[str] = None
    resolution: Optional[float] = None
    quality_status: Optional[str] = None
    source: str
    metadata_url: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    preview_url: Optional[str] = None
    metadata: Optional[dict] = None

@router.post("/search", response_model=List[SatelliteSceneResponse])
def search_scenes(request: SatelliteSearchRequestModel, provider: SatelliteProvider = Depends(get_provider)):
    """Search for satellite scenes matching the request.

    The response includes a ``source`` field that is either ``"DEMO"`` or
    ``"REAL"`` so the frontend can clearly label the data.
    """
    search_req = SatelliteSearchRequest(
        bbox=request.bbox,
        start_date=request.start_date,
        end_date=request.end_date,
        max_cloud=request.max_cloud,
        satellite=request.satellite,
    )
    scenes: List[SatelliteScene] = provider.search(search_req)
    result = []
    for s in scenes:
        # Determine if required provenance fields are present
        required_fields = [s.provider, s.provider_product_id, s.scene_id, s.acquisition_date]
        has_all = all(field is not None for field in required_fields)
        source_label = "REAL"
        if s.metadata and s.metadata.get("demo"):
            source_label = "DEMO"
        elif not has_all:
            source_label = "INVALID_METADATA"

        result.append(
            SatelliteSceneResponse(
                scene_id=s.scene_id,
                satellite=s.satellite,
                sensor=getattr(s, "sensor", None),
                acquisition_date=s.acquisition_date,
                processing_date=getattr(s, "processing_date", None),
                cloud_cover=s.cloud_cover,
                bbox=getattr(s, "bbox", None),
                center_coordinates=getattr(s, "center_coordinates", None),
                product_level=getattr(s, "product_level", None),
                processing_baseline=getattr(s, "processing_baseline", None),
                provider=getattr(s, "provider", None),
                provider_product_id=getattr(s, "provider_product_id", None),
                download_url=getattr(s, "download_url", None),
                thumbnail_url=getattr(s, "thumbnail_url", None),
                crs=getattr(s, "crs", None),
                resolution=getattr(s, "resolution", None),
                quality_status=getattr(s, "quality_status", None),
                source=source_label,
                metadata_url=getattr(s, "metadata_url", None),
                retrieved_at=getattr(s, "retrieved_at", None),
                preview_url=s.preview_url,
                metadata=s.metadata,
            )
        )
    return result
