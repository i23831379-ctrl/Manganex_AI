# Import all model modules to ensure they are registered with SQLAlchemy Base metadata

from app.models.user import User
from app.models.project import Project
from app.models.study_area import StudyArea
from app.models.dataset import Dataset
from app.models.target import ExplorationTarget
from app.models.field_note import FieldNote
from app.models.prospectivity_zone import ProspectivityZone
from app.models.geological_layer import GeologicalLayer
from app.models.geochemical_sample import GeochemicalSample
from app.models.remote_sensing_layer import RemoteSensingLayer
from app.models.model_run import ModelRun
from app.models.prediction import Prediction
from app.models.evidence import Evidence
from app.models.target_ranking import TargetRanking
from app.models.audit_log import AuditLog
from app.models.upload_record import UploadRecord
