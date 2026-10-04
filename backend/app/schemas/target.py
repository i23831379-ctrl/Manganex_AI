from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExplorationTargetBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    prospectivity_score: float = Field(..., ge=0, le=100)
    ranking: Optional[int] = None  # NEW: ranking column
    is_verified: bool = False

class ExplorationTargetCreate(ExplorationTargetBase):
    pass

from pydantic import computed_field

class ExplorationTargetResponse(ExplorationTargetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    def zone(self) -> str:
        if self.prospectivity_score >= 70:
            return "HIGH"
        if self.prospectivity_score >= 40:
            return "MEDIUM"
        return "LOW"

    class Config:
        from_attributes = True
