from fastapi import APIRouter, Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
    verify_user_ownership,
)
from app.database.connection import get_db
from app.models.user import User

from app.services.portfolio_analytics_service import (
    calculate_summary,
    calculate_dashboard,
    calculate_allocation_breakdown,
    calculate_risk_metrics,
    calculate_health_score,
    calculate_hhi,
    calculate_exposure
)

from app.models.portfolio import Portfolio

from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioResponse
)
from app.schemas.portfolio_summary import (
    PortfolioSummaryResponse
)

from app.models.portfolio_asset import PortfolioAsset

from app.schemas.portfolio_asset import (
    PortfolioAssetCreate,
    PortfolioAssetResponse
)
from app.schemas.portfolio_dashboard import (
    PortfolioDashboardResponse
)
from app.schemas.portfolio_allocation import AllocationItem
from app.schemas.portfolio_risk import PortfolioRiskResponse
from app.schemas.portfolio_health import (
    PortfolioHealthResponse
)
from app.schemas.portfolio_concentration import (
    PortfolioConcentrationResponse
)
from app.schemas.portfolio_exposure import (
    AssetExposureItem
)

router = APIRouter(
    prefix="/portfolios",
    tags=["Portfolios"]
)

@router.post("/", response_model=PortfolioResponse)
def create_portfolio(
    portfolio: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_user_ownership(portfolio.user_id, current_user)

    existing_portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.user_id
            == portfolio.user_id
        )
        .first()
    )

    if existing_portfolio:

        existing_portfolio.name = (
            portfolio.name
        )

        db.commit()

        db.refresh(
            existing_portfolio
        )

        return existing_portfolio

    new_portfolio = Portfolio(
        name=portfolio.name,
        user_id=portfolio.user_id
    )

    db.add(new_portfolio)

    db.commit()

    db.refresh(new_portfolio)

    return new_portfolio

@router.get("/", response_model=list[PortfolioResponse])
def get_all_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolios = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
        .all()
    )

    return portfolios

@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_portfolio(db, portfolio_id, current_user)

@router.get(
    "/{portfolio_id}/assets",
    response_model=list[PortfolioAssetResponse]
)
def get_portfolio_assets(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    assets = (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id == portfolio_id
        )
        .all()
    )

    return assets

@router.post(
    "/{portfolio_id}/assets",
    response_model=PortfolioAssetResponse
)
def add_asset(
    portfolio_id: int,
    asset: PortfolioAssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    existing_assets = (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id == portfolio_id
        )
        .all()
    )

    current_allocation = sum(
        existing_asset.allocation_percent
        for existing_asset in existing_assets
    )

    new_total = (
        current_allocation +
        asset.allocation_percent
    )

    if new_total > 100:
        raise HTTPException(
            status_code=400,
            detail="Total portfolio allocation cannot exceed 100%.",
        )

    new_asset = PortfolioAsset(
        portfolio_id=portfolio_id,
        ticker=asset.ticker,
        asset_type=asset.asset_type,
        allocation_percent=asset.allocation_percent,
        amount_invested=asset.amount_invested
    )

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return new_asset

@router.get(
    "/{portfolio_id}/summary",
    response_model=PortfolioSummaryResponse
)
def get_portfolio_summary(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_summary(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/dashboard",
    response_model=PortfolioDashboardResponse
)
def get_dashboard(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_dashboard(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/allocation",
    response_model=list[AllocationItem]
)
def get_allocation_breakdown(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_allocation_breakdown(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/risk",
    response_model=PortfolioRiskResponse
)
def get_risk_metrics(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_risk_metrics(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/health",
    response_model=PortfolioHealthResponse
)
def get_portfolio_health(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_health_score(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/concentration",
    response_model=PortfolioConcentrationResponse
)
def get_concentration_index(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_hhi(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get(
    "/{portfolio_id}/exposure",
    response_model=list[AssetExposureItem]
)
def get_asset_exposure(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return calculate_exposure(db, portfolio_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
