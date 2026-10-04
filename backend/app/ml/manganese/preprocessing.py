"""Preprocessing utilities for manganese ML models."""
from typing import List, Tuple, Iterable
from .training import ManganeseTrainingRecord

def build_feature_matrix(records: Iterable[ManganeseTrainingRecord], feature_names: Tuple[str, ...]) -> Tuple[List[List[float]], List[int]]:
    """Build a feature matrix and label list from training records.

    Args:
        records: An iterable of ManganeseTrainingRecord instances.
        feature_names: Ordered feature names to include in the matrix.

    Returns:
        A tuple (matrix, labels) where matrix is a list of rows corresponding to
        the records and each row contains float values for the requested features.
        Missing feature values are filled with 0.0.
    """
    matrix: List[List[float]] = []
    labels: List[int] = []
    for rec in records:
        row: List[float] = []
        for name in feature_names:
            value = getattr(rec, name, None)
            row.append(float(value) if value is not None else 0.0)
        matrix.append(row)
        labels.append(int(rec.label))
    return matrix, labels
