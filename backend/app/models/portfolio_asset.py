from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy import CheckConstraint
from app.database.base import Base


class PortfolioAsset(Base):
    __tablename__ = "portfolio_assets"

    id = Column(Integer, primary_key=True, index=True)

    portfolio_id = Column(
        Integer,
        ForeignKey("portfolios.id")
    )

    ticker = Column(String, nullable=False)

    asset_type = Column(String, nullable=False)

    allocation_percent = Column(
        Float,
        nullable=False
    )

    amount_invested = Column(
        Float,
        nullable=False
    )

    purchase_price = Column(Float, nullable=True)

    quantity = Column(Float, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "allocation_percent >= 0 AND allocation_percent <= 100",
            name="check_allocation_percent",
        ),
    )