from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    ForeignKey
)
from app.database.base import Base


class Goal(Base):

    __tablename__ = "goals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    goal_type = Column(
        String,
        nullable=False
    )

    goal_name = Column(
        String,
        nullable=True
    )

    target_amount = Column(
        Float,
        nullable=False
    )

    target_date = Column(
        Date,
        nullable=False
    )

    current_amount = Column(
        Float,
        nullable=False
    )

    monthly_contribution = Column(
        Float,
        nullable=False
    )

    annual_income = Column(
        Float,
        nullable=False,
        default=0.0
    )