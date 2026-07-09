from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
    get_owned_profile,
)
from app.database.connection import get_db
from app.models.user import User

from .service import (
    get_portfolio_risk,
    get_asset_allocation,
    get_diversification_score,
    get_risk_profile,
)

from .schemas import (
    PortfolioRiskResponse,
    AssetAllocationResponse,
    DiversificationResponse,
    RiskProfileResponse,
)

router = APIRouter(
    prefix="/risk",
    tags=["Risk Analysis"]
)


@router.get(
    "/allocation/{portfolio_id}",
    response_model=AssetAllocationResponse,
)
def asset_allocation(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_asset_allocation(portfolio_id)


@router.get(
    "/portfolio/{portfolio_id}",
    response_model=PortfolioRiskResponse,
)
def portfolio_risk(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_portfolio_risk(portfolio_id)


@router.get(
    "/diversification/{portfolio_id}",
    response_model=DiversificationResponse,
)
def diversification(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_diversification_score(portfolio_id)


@router.get(
    "/profile/{profile_id}",
    response_model=RiskProfileResponse,
)
def risk_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_owned_profile(db, profile_id, current_user)
    return get_risk_profile(profile)
