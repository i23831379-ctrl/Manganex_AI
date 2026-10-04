import os
from typing import List, Dict

from fastapi import HTTPException

# Demo band definitions for Sentinel-2 and Landsat (simplified)
SENTINEL_2_BANDS = [
    {"band_id": "B02", "name": "Blue", "wavelength": "490nm", "resolution": "10m", "description": "Coastal aerosol", "available": True},
    {"band_id": "B03", "name": "Green", "wavelength": "560nm", "resolution": "10m", "description": "Green", "available": True},
    {"band_id": "B04", "name": "Red", "wavelength": "665nm", "resolution": "10m", "description": "Red", "available": True},
    {"band_id": "B05", "name": "Red Edge 1", "wavelength": "705nm", "resolution": "20m", "description": "Red Edge 1", "available": True},
    {"band_id": "B06", "name": "Red Edge 2", "wavelength": "740nm", "resolution": "20m", "description": "Red Edge 2", "available": True},
    {"band_id": "B07", "name": "Red Edge 3", "wavelength": "783nm", "resolution": "20m", "description": "Red Edge 3", "available": True},
    {"band_id": "B08", "name": "NIR", "wavelength": "842nm", "resolution": "10m", "description": "Near Infrared", "available": True},
    {"band_id": "B11", "name": "SWIR 1", "wavelength": "1610nm", "resolution": "20m", "description": "SWIR 1", "available": True},
    {"band_id": "B12", "name": "SWIR 2", "wavelength": "2190nm", "resolution": "20m", "description": "SWIR 2", "available": True},
]

LANDSAT_BANDS = [
    {"band_id": "B1", "name": "Coastal", "wavelength": "440nm", "resolution": "30m", "description": "Coastal aerosol", "available": True},
    {"band_id": "B2", "name": "Blue", "wavelength": "480nm", "resolution": "30m", "description": "Blue", "available": True},
    {"band_id": "B3", "name": "Green", "wavelength": "560nm", "resolution": "30m", "description": "Green", "available": True},
    {"band_id": "B4", "name": "Red", "wavelength": "655nm", "resolution": "30m", "description": "Red", "available": True},
    {"band_id": "B5", "name": "NIR", "wavelength": "865nm", "resolution": "30m", "description": "Near Infrared", "available": True},
    {"band_id": "B6", "name": "SWIR 1", "wavelength": "1609nm", "resolution": "30m", "description": "SWIR 1", "available": True},
    {"band_id": "B7", "name": "SWIR 2", "wavelength": "2201nm", "resolution": "30m", "description": "SWIR 2", "available": True},
]

# Sentinel-1 SAR band definitions (VV, VH polarizations)
SENTINEL_1_BANDS = [
    {"band_id": "VV", "name": "VV Polarization", "description": "Vertical transmit, vertical receive", "resolution": "10m", "available": True},
    {"band_id": "VH", "name": "VH Polarization", "description": "Vertical transmit, horizontal receive", "resolution": "10m", "available": True},
    {"band_id": "HH", "name": "HH Polarization", "description": "Horizontal transmit, horizontal receive", "resolution": "10m", "available": True},
    {"band_id": "HV", "name": "HV Polarization", "description": "Horizontal transmit, vertical receive", "resolution": "10m", "available": True},
]

def get_available_bands(satellite: str) -> List[Dict]:
    """Return band metadata for the requested satellite.
    Supports 'Sentinel-2' and 'Landsat'. Raises HTTPException for unknown.
    """
    sat = satellite.lower()
    # Prioritize Sentinel-1 detection before generic Sentinel handling
    if "sentinel-1" in sat or "sentinel1" in sat:
        return SENTINEL_1_BANDS
    if "sentinel" in sat:
        return SENTINEL_2_BANDS
    if "landsat" in sat:
        return LANDSAT_BANDS
    raise HTTPException(status_code=400, detail=f"Unsupported satellite '{satellite}'")

def preprocess_scene(scene_id: str, selected_bands: List[str], options: Dict) -> Dict:
    """Placeholder preprocessing implementation.

    In DEMO_MODE this simply echoes the request and marks all steps as completed.
    A real implementation would invoke rasterio, numpy, etc.
    """
    steps = [
        {"name": "cloud_masking", "status": "completed"},
        {"name": "nodata_handling", "status": "completed"},
        {"name": "crs_validation", "status": "completed"},
        {"name": "alignment", "status": "completed"},
        {"name": "resampling", "status": "completed"},
        {"name": "clip_to_study_area", "status": "completed"},
    ]


    return {
        "status": "completed",
        "scene_id": scene_id,
        "selected_bands": selected_bands,
        "processing_steps": steps,
        "output_metadata": {
            "crs": "EPSG:4326",
            "bounds": [0, 0, 1, 1],
            "width": 1024,
            "height": 1024,
            "band_count": len(selected_bands),
            "resolution": 10,
        },
    }
