import logging

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
)
from app.schemas.analytics import BenchmarkResponse
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset
from app.models.goal import Goal
from app.performance.service import (
    get_benchmark_comparison as get_performance_benchmark,
)
# Single source of truth for current portfolio value.
# calculate_live_portfolio_value_and_returns uses live market prices
# (current_price × quantity) and returns a Dict[str, float].
from app.performance.service import (
    calculate_live_asset_valuations,
)
from app.schemas.portfolio_intelligence import PortfolioIntelligenceResponse
from app.schemas.analytics import AnalyticsDashboardResponse
from app.services import analytics_service
from app.services.portfolio_analytics_service import calculate_allocation_breakdown
from app.services.factor_exposure import get_factor_exposure
from app.services.goal_probability import calculate_goal_probability
from app.schemas.analytics import CorrelationMatrixResponse
from app.services.analytics_service import (
    get_correlation_matrix,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Shared business logic ────────────────────────────────────────────
# Extracted so that both the route handler and the dashboard can call
# the *service* directly instead of one route calling another route.

def _build_portfolio_intelligence(portfolio_id: int, db: Session) -> dict:
    """Compute portfolio intelligence using a single source of truth
    for the current portfolio value (live market-price valuation).

    This function contains the business logic only — no auth / dependency
    injection.  Route handlers must enforce ownership before calling this.
    """
    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio_id)
        .all()
    )

    if not assets:
        return {
            "portfolio_id": portfolio_id,
            "total_value": 0.0,
            "asset_count": 0,
            "diversification_score": 0.0,
            "health_score": 0.0,
            "concentration_level": "N/A",
            "largest_holding": "None",
            "largest_allocation": 0.0,
        }

    # ── Single source of truth for portfolio value ──────────────
    # Uses live market prices (current_price × quantity), NOT the
    # sum of invested amounts.  This keeps the value consistent
    # with every other page that shows "Portfolio Value".
    #
    asset_count = analytics_service.calculate_asset_count(assets)
    valuations = calculate_live_asset_valuations(db, portfolio_id)
    total_value = sum(item["market_value"] for item in valuations)
    largest_valuation = max(valuations, key=lambda item: item["market_value"])

    # Unify diversification calculation
    from app.risk.service import calculate_diversification
    div_result = calculate_diversification(assets)
    diversification_score = float(div_result.get("score", 0.0))

    largest_allocation = (
        (largest_valuation["market_value"] / total_value) * 100
        if total_value > 0
        else 0.0
    )

    # Unify portfolio health calculation
    # get_portfolio_health returns a PortfolioHealthResponse Pydantic model
    # with attributes: portfolio_id, health_score, rating
    from app.optimization.service import get_portfolio_health
    health_result = get_portfolio_health(portfolio_id)
    health_score = float(health_result.health_score)

    hhi_score = analytics_service.calculate_hhi_score(assets)
    if hhi_score < 1500:
        concentration_level = "Diversified"
    elif hhi_score < 2500:
        concentration_level = "Moderate"
    else:
        concentration_level = "Concentrated"

    return {
        "portfolio_id": portfolio_id,
        "total_value": total_value,
        "asset_count": asset_count,
        "diversification_score": diversification_score,
        "health_score": health_score,
        "concentration_level": concentration_level,
        "largest_holding": largest_valuation["asset"].ticker,
        "largest_allocation": largest_allocation,
    }


# ── Route handlers ───────────────────────────────────────────────────

@router.get(
    "/portfolio/{portfolio_id}",
    response_model=PortfolioIntelligenceResponse,
)
def get_portfolio_intelligence(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        return _build_portfolio_intelligence(portfolio_id, db)
    except Exception:
        logger.exception(
            "Failed to compute portfolio intelligence for portfolio_id=%s",
            portfolio_id,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to compute portfolio intelligence.",
        )


@router.get(
    "/dashboard/{portfolio_id}",
    response_model=AnalyticsDashboardResponse,
)
def get_analytics_dashboard(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    try:
        # 1. Fetch portfolio intelligence via shared service
        portfolio_intel = _build_portfolio_intelligence(portfolio_id, db)

        # 2. Fetch allocation breakdown
        allocation = calculate_allocation_breakdown(db, portfolio_id)

        # 3. Fetch factor exposure
        exposures = get_factor_exposure(portfolio_id, db)
        factor_exposure = [
            {"factor": item["factor"], "exposure": item["exposure"]}
            for item in exposures
        ]

        # 4. Calculate goal probability using portfolio owner's goal or defaults
        portfolio = (
            db.query(Portfolio)
            .filter(Portfolio.id == portfolio_id)
            .first()
        )
        user_goal = None
        if portfolio:
            user_goal = (
                db.query(Goal)
                .filter(Goal.user_id == portfolio.user_id)
                .first()
            )
        if user_goal:
            years = max(
                1,
                user_goal.target_date.year - date.today().year,
            )
            prob = calculate_goal_probability(
                initial_amount=user_goal.current_amount,
                monthly_contribution=user_goal.monthly_contribution,
                expected_return=12.0,
                volatility=15.0,
                years=years,
                target_amount=user_goal.target_amount,
                simulations=1000,
            )
        else:
            prob = calculate_goal_probability(
                initial_amount=500000.0,
                monthly_contribution=10000.0,
                expected_return=12.0,
                volatility=15.0,
                years=10,
                target_amount=4000000.0,
                simulations=1000,
            )

        return {
            "portfolio": portfolio_intel,
            "allocation": allocation,
            "factor_exposure": factor_exposure,
            "goal_probability": {"probability": prob},
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "Failed to build analytics dashboard for portfolio_id=%s",
            portfolio_id,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to build analytics dashboard.",
        )


@router.get(
    "/benchmark/{portfolio_id}",
    response_model=BenchmarkResponse,
)
def benchmark_comparison(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    comparison = get_performance_benchmark(
        db,
        portfolio_id,
    )
    return {
        **comparison,
        "status": (
            "Outperforming"
            if comparison["alpha"] >= 0
            else "Underperforming"
        ),
    }


@router.get(
    "/correlation/{portfolio_id}",
    response_model=CorrelationMatrixResponse,
)
def correlation_matrix(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_correlation_matrix(
        db,
        portfolio_id,
    )
