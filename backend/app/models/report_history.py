from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database.base import Base


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=True)
    report_type = Column(String, index=True, nullable=False)
    report_name = Column(String, nullable=False)
    version = Column(Integer, nullable=False)
    generated_at = Column(DateTime(timezone=True), nullable=False)
    downloaded_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, index=True, nullable=False, default="Generated")
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
