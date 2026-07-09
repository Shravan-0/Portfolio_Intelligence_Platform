import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_profile,
)
from app.database.connection import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset

from app.risk.service import (
    calculate_risk_score,
    calculate_asset_allocation,
    calculate_allocation_risk_metrics,
)

from app.schemas.monte_carlo import (
    MonteCarloRequest,
    MonteCarloResponse
)

from app.services.monte_carlo import (
    run_monte_carlo
)

router = APIRouter()
logger = logging.getLogger(__name__)


def get_risk_parameters(profile):
    """Fallback return/volatility used only when the user has no
    portfolio (or no assets) to base the simulation on yet."""

    risk_score = calculate_risk_score(
        profile
    )

    if risk_score <= 30:
        return ("Conservative", 8, 10)
    elif risk_score <= 50:
        return ("Moderate", 10, 15)
    elif risk_score <= 75:
        return ("Growth", 12, 18)
    return ("Aggressive", 15, 25)


def get_portfolio_based_parameters(db: Session, user_id: int):
    """
    Derive expected return and volatility from the user's actual
    portfolio allocation, using the same logic already used for
    Goal probability calculations.

    Returns (expected_return, volatility) or None if the user has
    no portfolio or no assets yet.
    """
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == user_id)
        .first()
    )

    if not portfolio:
        return None

    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio.id)
        .all()
    )

    if not assets:
        return None

    allocation = calculate_asset_allocation(assets)
    metrics = calculate_allocation_risk_metrics(allocation)

    return metrics["expected_return"], metrics["volatility"]


@router.post(
    "/monte-carlo/{profile_id}",
    response_model=MonteCarloResponse
)
def monte_carlo_simulation(
    profile_id: int,
    request: MonteCarloRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_owned_profile(db, profile_id, current_user)

    risk_profile, fallback_return, fallback_volatility = (
        get_risk_parameters(profile)
    )

    portfolio_metrics = None
    try:
        portfolio_metrics = get_portfolio_based_parameters(
            db,
            profile.user_id,
        )
    except Exception:
        logger.exception(
            "Failed to derive Monte Carlo parameters from portfolio "
            "for user_id=%s, falling back to risk-profile defaults",
            profile.user_id,
        )
        portfolio_metrics = None

    if portfolio_metrics:
        expected_return, volatility = portfolio_metrics
    else:
        expected_return, volatility = fallback_return, fallback_volatility

    try:
        result = run_monte_carlo(
            initial_amount=request.initial_amount,
            monthly_contribution=request.monthly_contribution,
            expected_return=expected_return,
            volatility=volatility,
            years=request.years,
            simulations=request.simulations
        )
    except Exception:
        logger.exception(
            "Monte Carlo simulation failed for profile_id=%s",
            profile_id,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to run the Monte Carlo simulation. Please try again.",
        )

    return MonteCarloResponse(
        risk_profile=risk_profile,

        expected_return=expected_return,
        volatility=volatility,

        median_value=result["median_value"],
        best_case=result["best_case"],
        worst_case=result["worst_case"]
    )