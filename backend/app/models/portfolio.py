from sqlalchemy import Column, Integer, String, Float
from app.database.base import Base

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    total_value = Column(Float, default=0)