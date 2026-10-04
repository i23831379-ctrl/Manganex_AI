import os
from datetime import datetime
from datetime import date
from typing import List, Optional
from dataclasses import dataclass

# ---------- Data models ----------

@dataclass
class SatelliteScene:
    scene_id: str
    satellite: str  # "Sentinel-2", "Sentinel-1", or "Landsat"
    acquisition_date: date
    footprint_wkt: str  # WKT polygon of the scene coverage
    sensor: Optional[str] = None
    processing_date: Optional[date] = None
    cloud_cover: Optional[float] = None  # percentage
    bbox: Optional[List[float]] = None  # [west, south, east, north]
    center_coordinates: Optional[List[float]] = None  # [lon, lat]
    product_level: Optional[str] = None
    processing_baseline: Optional[str] = None
    provider: Optional[str] = None
    provider_product_id: Optional[str] = None
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    crs: Optional[str] = None
    resolution: Optional[float] = None
    quality_status: Optional[str] = None
    source: Optional[str] = None
    metadata_url: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    preview_url: Optional[str] = None
    metadata: Optional[dict] = None

@dataclass
class SatelliteSearchRequest:
    bbox: List[float]  # [west, south, east, north]
    start_date: date
    end_date: date
    max_cloud: float = 20.0
    satellite: Optional[str] = None  # "Sentinel-2" or "Landsat" or None for both

# ---------- Provider interface ----------

class SatelliteProvider:
    """Abstract base class for satellite data providers.

    Concrete implementations must implement ``search`` which returns a list of
    :class:`SatelliteScene` objects matching the supplied request.
    """

    def search(self, req: SatelliteSearchRequest) -> List[SatelliteScene]:
        raise NotImplementedError

# ---------- Demo provider ----------

class DemoSatelliteProvider(SatelliteProvider):
    """A deterministic demo provider that returns a small static set of scenes.

    The data is clearly marked as DEMO and allows the whole workflow to run
    without external API credentials.
    """

    _demo_scenes: List[SatelliteScene] = []

    def __init__(self):
        if not self._demo_scenes:
            # Populate a few static scenes covering a generic region.
            self._demo_scenes = [
                SatelliteScene(
                    scene_id="DEMO_SENTINEL_001",
                    satellite="Sentinel-2",
                    acquisition_date=date(2023, 5, 12),
                    cloud_cover=10.0,
                    footprint_wkt="POLYGON((21.0 79.0, 21.5 79.0, 21.5 79.5, 21.0 79.5, 21.0 79.0))",
                    preview_url=None,
                    metadata={"demo": True, "source": "static"},
                ),
                SatelliteScene(
                    scene_id="DEMO_LANDSAT_001",
                    satellite="Landsat",
                    acquisition_date=date(2022, 11, 3),
                    cloud_cover=15.0,
                    footprint_wkt="POLYGON((21.0 79.0, 21.5 79.0, 21.5 79.5, 21.0 79.5, 21.0 79.0))",
                    preview_url=None,
                    metadata={"demo": True, "source": "static"},
                ),
            ]

    def search(self, req: SatelliteSearchRequest) -> List[SatelliteScene]:
        # Simple filter over the static list – enough for demo UI.
        results = []
        for scene in self._demo_scenes:
            if req.satellite and scene.satellite != req.satellite:
                continue
            if not (req.start_date <= scene.acquisition_date <= req.end_date):
                continue
            if scene.cloud_cover > req.max_cloud:
                continue
            # Bounding‑box check – naive WKT parsing for demo purposes.
            # Extract min/max lat/lon from the WKT polygon (assumes rectangle).
            try:
                coords = scene.footprint_wkt.replace('POLYGON((','').replace('))','').split(',')
                xs = [float(p.split()[0]) for p in coords]
                ys = [float(p.split()[1]) for p in coords]
                scene_bbox = [min(xs), min(ys), max(xs), max(ys)]
                # bbox overlap test
                if (
                    scene_bbox[2] < req.bbox[0] or scene_bbox[0] > req.bbox[2] or
                    scene_bbox[3] < req.bbox[1] or scene_bbox[1] > req.bbox[3]
                ):
                    continue
            except Exception:
                # If parsing fails, just skip the check (demo safety).
                pass
            results.append(scene)
        return results

# ---------- Real provider placeholder ----------

class RealSatelliteProvider(SatelliteProvider):
    """Stub for a future real implementation (e.g., using Sentinel Hub, USGS API).

    The class is deliberately minimal now to keep the repository buildable
    without external credentials. When a real service key becomes available the
    ``search`` method can be filled in with actual HTTP calls.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SATELLITE_API_KEY")
        if not self.api_key:
            raise RuntimeError(
                "RealSatelliteProvider requires a SATELLITE_API_KEY environment variable"
            )

    def search(self, req: SatelliteSearchRequest) -> List[SatelliteScene]:
        # Placeholder – raise NotImplementedError to avoid accidental use.
        raise NotImplementedError(
            "Real satellite search not implemented yet. Use DemoSatelliteProvider in demo mode."
        )
