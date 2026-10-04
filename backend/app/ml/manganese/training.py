"""Training record definition for manganese ML models."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class ManganeseTrainingRecord:
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    slope: Optional[float] = None
    label: int = 0
