from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset

from app.schemas.efficient_frontier import (
    EfficientFrontierResponse
)

from app.services.efficient_frontier import (
    generate_efficient_frontier
)

router = APIRouter()


@router.get(
    "/efficient-frontier",
    response_model=EfficientFrontierResponse
)
def get_efficient_frontier(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
        .first()
    )

    if not portfolio:
        return EfficientFrontierResponse(frontier=[])

    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio.id)
        .all()
    )

    frontier = generate_efficient_frontier(assets)

    return EfficientFrontierResponse(frontier=frontier)