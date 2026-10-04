from typing import List, Dict, Any

# Simple DEMO feature registry
FEATURE_REGISTRY = [
    # Sentinel-2 Optical Bands
    {
        "feature_id": "b02",
        "name": "Band 02 (Blue)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 02 – Blue (490nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b03",
        "name": "Band 03 (Green)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 03 – Green (560nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b04",
        "name": "Band 04 (Red)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 04 – Red (665nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b05",
        "name": "Band 05 (Red Edge 1)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 05 – Red Edge (705nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b06",
        "name": "Band 06 (Red Edge 2)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 06 – Red Edge (740nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b07",
        "name": "Band 07 (Red Edge 3)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 07 – Red Edge (783nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b08",
        "name": "Band 08 (NIR)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 08 – Near Infrared (842nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b8a",
        "name": "Band 8A (Narrow NIR)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 8A – Narrow NIR (865nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b11",
        "name": "Band 11 (SWIR 1)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 11 – SWIR (1610nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "b12",
        "name": "Band 12 (SWIR 2)",
        "category": "optical",
        "formula": None,
        "required_bands": [],
        "description": "Sentinel-2 band 12 – SWIR (2190nm).",
        "unit": "reflectance",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    # Sentinel-2 derived indices
    {
        "feature_id": "ndvi",
        "name": "Normalized Difference Vegetation Index",
        "category": "optical",
        "formula": "(B08 - B04) / (B08 + B04)",
        "required_bands": ["B04", "B08"],
        "description": "Standard vegetation index using Red and NIR bands.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "ndwi",
        "name": "Normalized Difference Water Index",
        "category": "optical",
        "formula": "(B03 - B08) / (B03 + B08)",
        "required_bands": ["B03", "B08"],
        "description": "Water index using Green and NIR bands.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "ndbi",
        "name": "Normalized Difference Built-up Index",
        "category": "optical",
        "formula": "(B11 - B08) / (B11 + B08)",
        "required_bands": ["B08", "B11"],
        "description": "Built-up index using SWIR and NIR bands.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "red_edge_ratio",
        "name": "Red Edge Ratio",
        "category": "optical",
        "formula": "(B05 - B04) / (B05 + B04)",
        "required_bands": ["B04", "B05"],
        "description": "Normalized difference using Red Edge 1 and Red bands.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "swir_ratio",
        "name": "SWIR Ratio",
        "category": "optical",
        "formula": "B11 / B12",
        "required_bands": ["B11", "B12"],
        "description": "Ratio of two SWIR bands.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-2",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    # Sentinel-1 SAR features
    {
        "feature_id": "vv",
        "name": "VV Backscatter",
        "category": "sar",
        "formula": None,
        "required_bands": ["VV"],
        "description": "Raw VV polarization backscatter.",
        "unit": "dB",
        "availability": "demo",
        "source_sensor": "Sentinel-1",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "vh",
        "name": "VH Backscatter",
        "category": "sar",
        "formula": None,
        "required_bands": ["VH"],
        "description": "Raw VH polarization backscatter.",
        "unit": "dB",
        "availability": "demo",
        "source_sensor": "Sentinel-1",
        "processing_method": "raw",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "vv_vh_ratio",
        "name": "VV/VH Ratio",
        "category": "sar",
        "formula": "VV / VH",
        "required_bands": ["VV", "VH"],
        "description": "Ratio of VV to VH backscatter.",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "Sentinel-1",
        "processing_method": "ratio",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "vv_vh_diff",
        "name": "VV-VH Difference",
        "category": "sar",
        "formula": "VV - VH",
        "required_bands": ["VV", "VH"],
        "description": "Difference between VV and VH backscatter.",
        "unit": "dB",
        "availability": "demo",
        "source_sensor": "Sentinel-1",
        "processing_method": "difference",
        "demo_supported": True,
        "real_data_supported": True,
    },
    {
        "feature_id": "vv_vh_sum",
        "name": "VV+VH Sum",
        "category": "sar",
        "formula": "VV + VH",
        "required_bands": ["VV", "VH"],
        "description": "Sum of VV and VH backscatter.",
        "unit": "dB",
        "availability": "demo",
        "source_sensor": "Sentinel-1",
        "processing_method": "sum",
        "demo_supported": True,
        "real_data_supported": True,
    },
    # Terrain DEM features (demo placeholders)
    {
        "feature_id": "elevation",
        "name": "Elevation",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "DEM elevation value.",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "slope",
        "name": "Slope",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Terrain slope derived from DEM (demo constant).",
        "unit": "degrees",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "aspect",
        "name": "Aspect",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Terrain aspect derived from DEM (demo constant).",
        "unit": "degrees",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "hillshade",
        "name": "Hillshade",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Hillshade computed from DEM (demo constant).",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "ruggedness",
        "name": "Terrain Ruggedness Index",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Ruggedness index (demo constant).",
        "unit": "unitless",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "relief",
        "name": "Relief",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Relief metric from DEM (demo constant).",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "local_elevation_range",
        "name": "Local Elevation Range",
        "category": "terrain",
        "formula": None,
        "required_bands": [],
        "description": "Local elevation range (demo constant).",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "DEM",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    # Geological placeholder features
    {
        "feature_id": "distance_to_fault",
        "name": "Distance to Fault",
        "category": "geology",
        "formula": None,
        "required_bands": [],
        "description": "Euclidean distance from pixel to nearest fault line (demo constant).",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "Geology",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "distance_to_lineament",
        "name": "Distance to Lineament",
        "category": "geology",
        "formula": None,
        "required_bands": [],
        "description": "Distance to nearest lineament (demo constant).",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "Geology",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "lineament_density",
        "name": "Lineament Density",
        "category": "geology",
        "formula": None,
        "required_bands": [],
        "description": "Density of lineaments in a local window (demo constant).",
        "unit": "per km²",
        "availability": "demo",
        "source_sensor": "Geology",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "distance_to_occurrence",
        "name": "Distance to Mineral Occurrence",
        "category": "geology",
        "formula": None,
        "required_bands": [],
        "description": "Distance to known mineral occurrence (demo constant).",
        "unit": "meters",
        "availability": "demo",
        "source_sensor": "Geology",
        "processing_method": "constant",
        "demo_supported": True,
        "real_data_supported": False,
    },
    {
        "feature_id": "lithology",
        "name": "Lithology Encoding",
        "category": "geology",
        "formula": None,
        "required_bands": [],
        "description": "Categorical lithology encoded as integer (demo constant).",
        "unit": "category",
        "availability": "demo",
        "source_sensor": "Geology",
        "processing_method": "encoding",
        "demo_supported": True,
        "real_data_supported": False,
    },
]

def get_feature_catalog() -> List[Dict[str, Any]]:
    """Return a copy of the feature registry for API consumption."""
    return [f.copy() for f in FEATURE_REGISTRY]

def calculate_feature(feature_id: str, band_values: Dict[str, float]) -> Any:
    """Calculate a feature for DEMO mode.

    * band_values – mapping of band_id → deterministic demo numeric value.
    * Returns the computed value or raises ValueError if requirements not met.
    """
    # Find definition
    definition = next((f for f in FEATURE_REGISTRY if f["feature_id"] == feature_id), None)
    if not definition:
        raise ValueError(f"Feature '{feature_id}' not found")
    # Validate required bands
    missing = [b for b in definition["required_bands"] if b not in band_values]
    if missing:
        raise ValueError(f"Missing required bands for {feature_id}: {missing}")
    # DEMO deterministic values – simple formulas
    if feature_id == "ndvi":
        red = band_values["B04"]
        nir = band_values["B08"]
        return (nir - red) / (nir + red) if (nir + red) != 0 else 0.0
    if feature_id == "ndwi":
        green = band_values["B03"]
        nir = band_values["B08"]
        return (green - nir) / (green + nir) if (green + nir) != 0 else 0.0
    if feature_id == "vv":
        return band_values["VV"]
    if feature_id == "vh":
        return band_values["VH"]
    if feature_id == "vv_vh_ratio":
        vv = band_values["VV"]
        vh = band_values["VH"]
        return vv / vh if vh != 0 else 0.0
    if feature_id == "elevation":
        return 150.0  # static demo elevation
    # Fallback – return None
    return None

def calculate_features(requested_ids: List[str], band_values: Dict[str, float]) -> List[Dict[str, Any]]:
    """Calculate multiple features and include provenance metadata."""
    results = []
    for fid in requested_ids:
        try:
            value = calculate_feature(fid, band_values)
            provenance = {
                "source": "DEMO",
                "method": "deterministic",
                "timestamp": "2026-09-30T21:13:00Z",
            }
            results.append({"feature_id": fid, "value": value, "provenance": provenance})
        except ValueError as e:
            # Skip or record error; here we record as None with error note
            results.append({"feature_id": fid, "value": None, "error": str(e)})
    return results

def fuse_feature_vectors(vectors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Fuse a list of feature dicts into a single vector.
    Expected input format: [{"feature_id":..., "value":..., "provenance":...}, ...]
    """
    fused = {item["feature_id"]: item["value"] for item in vectors if "value" in item}
    provenance = {
        "source": "DEMO",
        "method": "simple_concat",
        "timestamp": "2026-09-30T21:13:00Z",
    }
    return {"fused_vector": fused, "provenance": provenance}
