from datetime import date
from sqlalchemy import Column, Integer, Float, Date
from app.database import Base

class OperationalLog(Base):
    __tablename__ = "operational_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=date.today)
    equipment_downtime_hrs = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    blasting_delays_hrs = Column(Float, nullable=False)
    extraction_shortfall_tons = Column(Float, nullable=False)
