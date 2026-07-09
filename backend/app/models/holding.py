from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    ForeignKey
)

from app.database.base import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)

    portfolio_id = Column(
        Integer,
        ForeignKey("portfolios.id"),
        nullable=False
    )

    symbol = Column(String, nullable=False)

    quantity = Column(Float, nullable=False)

    purchase_price = Column(Float, nullable=False)

    current_price = Column(Float, nullable=False)