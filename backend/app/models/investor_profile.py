from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class InvestorProfile(Base):
    __tablename__ = "investor_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
    Integer,
    ForeignKey("users.id"),
    unique=True,
    nullable=False
)

    age = Column(Integer, nullable=False)

    annual_income = Column(Float, nullable=False)

    investment_horizon = Column(Integer, nullable=False)

    target_amount = Column(Float, nullable=False)

    risk_tolerance = Column(String(50), nullable=False)

    user = relationship(
    "User",
    back_populates="investor_profile"
    )