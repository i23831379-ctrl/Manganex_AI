from fastapi import APIRouter, Depends, HTTPException
from app.api.schemas import remote_sensing as schemas
from app.services.remote_sensing_service import get_available_bands, preprocess_scene

router = APIRouter()

@router.post("/bands", response_model=schemas.BandsResponse)
def get_bands(scene: schemas.SceneInfo):
    """Return available bands for the scene's satellite.
    The demo provider uses the same band set for all scenes of a given satellite.
    """
    bands = get_available_bands(scene.satellite)
    return schemas.BandsResponse(
        scene_id=scene.scene_id,
        satellite=scene.satellite,
        source=scene.source,
        bands=bands,
    )

@router.post("/preprocess", response_model=schemas.PreprocessResponse)
def run_preprocess(request: schemas.PreprocessRequest):
    """Run placeholder preprocessing for the given scene and selected bands.
    In DEMO_MODE this returns a fabricated success response.
    """
    result = preprocess_scene(
        scene_id=request.scene_id,
        selected_bands=request.selected_bands,
        options=request.options,
    )
    # Convert processing steps dicts to ProcessingStep models automatically via response_model
    return schemas.PreprocessResponse(**result)
