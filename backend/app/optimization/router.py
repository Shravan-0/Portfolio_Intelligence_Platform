from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
    get_owned_profile,
)
from app.database.connection import get_db
from app.models.user import User

from .schemas import (
    PortfolioHealthResponse,
    RebalanceResponse,
    RecommendationResponse,
)

from .service import (
    get_portfolio_health,
    get_rebalance_recommendation,
    get_recommendations,
)

router = APIRouter(
    prefix="/optimization",
    tags=["Optimization"]
)


@router.get(
    "/health/{portfolio_id}",
    response_model=PortfolioHealthResponse,
)
def portfolio_health(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_portfolio_health(
        portfolio_id
    )


@router.get(
    "/rebalance/{profile_id}",
    response_model=RebalanceResponse,
)
def rebalance(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_owned_profile(db, profile_id, current_user)

    return get_rebalance_recommendation(
        profile
    )


@router.get(
    "/recommendations/{profile_id}",
    response_model=RecommendationResponse,
)
def recommendations(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_owned_profile(db, profile_id, current_user)

    return get_recommendations(
        profile
    )
