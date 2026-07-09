from sqlalchemy import Column, Date, Float, Integer

from app.database.base import Base


class PerformanceSnapshot(Base):
    __tablename__ = "performance_snapshots"

    id = Column(Integer, primary_key=True, index=True)

    portfolio_id = Column(Integer, index=True, nullable=False)

    date = Column(Date, index=True, nullable=False)

    portfolio_value = Column(Float, nullable=False)
