from fastapi import HTTPException

from app.database.connection import SessionLocal
from app.models.investor_profile import InvestorProfile
from app.models.portfolio import Portfolio
from app.risk.service import (
    _get_portfolio_assets,
    calculate_asset_allocation,
    calculate_diversification,
    calculate_risk_score,
)

from .schemas import (
    PortfolioHealthResponse,
    RebalanceResponse,
    RecommendationResponse,
)


RECOMMENDED_ALLOCATIONS = {
    "Conservative": {
        "equity": 40,
        "debt": 50,
        "cash": 10,
    },
    "Moderate": {
        "equity": 60,
        "debt": 30,
        "cash": 10,
    },
    "Growth": {
        "equity": 75,
        "debt": 20,
        "cash": 5,
    },
    "Aggressive": {
        "equity": 90,
        "debt": 10,
        "cash": 0,
    },
}


def _get_profile_for_portfolio(
    db,
    portfolio: Portfolio,
) -> InvestorProfile | None:
    return (
        db.query(InvestorProfile)
        .filter(InvestorProfile.user_id == portfolio.user_id)
        .first()
    )


def _get_portfolio_for_profile(
    db,
    profile: InvestorProfile,
) -> Portfolio:
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.user_id == profile.user_id)
        .first()
    )

    if not portfolio:
        raise HTTPException(
            status_code=404,
            detail="Portfolio not found",
        )

    return portfolio


def _allocation_balance_score(
    allocation: dict[str, float],
    recommended: dict[str, float],
) -> int:
    # Score declines as the live allocation moves away from its target mix.
    total_gap = sum(
        abs(allocation[bucket] - recommended[bucket])
        for bucket in recommended
    )

    return round(max(0, 100 - total_gap))


def _risk_profile_compatibility_score(
    allocation: dict[str, float],
    risk_profile: str,
) -> int:
    recommended = RECOMMENDED_ALLOCATIONS[risk_profile]

    equity_gap = abs(allocation["equity"] - recommended["equity"])
    cash_gap = abs(allocation["cash"] - recommended["cash"])

    return round(max(0, 100 - equity_gap * 1.2 - cash_gap * 0.8))


def _health_rating(health_score: int) -> str:
    if health_score >= 90:
        return "Excellent"

    if health_score >= 75:
        return "Strong"

    if health_score >= 60:
        return "Moderate"

    return "Weak"


def _build_rebalance_action(
    allocation: dict[str, float],
    recommended: dict[str, float],
    asset_count: int,
) -> str:
    actions = []

    if asset_count == 1:
        actions.append("Diversify beyond a single asset")

    if allocation["equity"] > recommended["equity"] + 5:
        actions.append("reduce equity exposure")
    elif allocation["equity"] < recommended["equity"] - 5:
        actions.append("increase equity exposure")

    if allocation["debt"] > recommended["debt"] + 5:
        actions.append("reduce debt allocation")
    elif allocation["debt"] < recommended["debt"] - 5:
        actions.append("increase debt allocation")

    if allocation["cash"] > recommended["cash"] + 5:
        actions.append("deploy excess cash")
    elif allocation["cash"] < recommended["cash"] - 5:
        actions.append("build a small cash buffer")

    if not actions:
        return "Maintain current allocation and review periodically"

    return "; ".join(actions).capitalize()


def _build_recommendations(
    allocation: dict[str, float],
    recommended: dict[str, float],
    asset_count: int,
) -> list[str]:
    recommendations = []

    if asset_count == 1:
        recommendations.append("Diversify across more assets")

    if allocation["equity"] > recommended["equity"] + 5:
        recommendations.append("Reduce equity exposure")
    elif allocation["equity"] < recommended["equity"] - 5:
        recommendations.append("Increase equity exposure")

    if allocation["debt"] > recommended["debt"] + 5:
        recommendations.append("Reduce debt allocation")
    elif allocation["debt"] < recommended["debt"] - 5:
        recommendations.append("Increase debt allocation")

    if allocation["cash"] > recommended["cash"] + 5:
        recommendations.append("Deploy excess cash")
    elif allocation["cash"] < recommended["cash"] - 5:
        recommendations.append("Maintain an adequate cash reserve")

    if not recommendations:
        recommendations.append("Maintain current allocation")

    recommendations.append("Review portfolio allocation periodically")

    return recommendations


def get_portfolio_health(
    portfolio_id: int,
) -> PortfolioHealthResponse:
    db = SessionLocal()

    try:
        portfolio, assets = _get_portfolio_assets(
            db,
            portfolio_id,
        )
        profile = _get_profile_for_portfolio(
            db,
            portfolio,
        )

        risk_profile = (
            determine_risk_profile(profile)
            if profile
            else "Moderate"
        )
        recommended = RECOMMENDED_ALLOCATIONS[risk_profile]
        allocation = calculate_asset_allocation(assets)
        diversification = calculate_diversification(assets)

        # Health combines breadth, allocation discipline, and user fit.
        diversification_score = diversification["score"]
        allocation_score = _allocation_balance_score(
            allocation,
            recommended,
        )
        compatibility_score = _risk_profile_compatibility_score(
            allocation,
            risk_profile,
        )
    finally:
        db.close()

    health_score = round(
        diversification_score * 0.40
        + compatibility_score * 0.30
        + allocation_score * 0.30
    )

    return PortfolioHealthResponse(
        portfolio_id=portfolio_id,
        health_score=health_score,
        rating=_health_rating(health_score),
    )


def determine_risk_profile(profile):

    risk_score = calculate_risk_score(profile)

    if risk_score <= 30:
        return "Conservative"

    elif risk_score <= 50:
        return "Moderate"

    elif risk_score <= 75:
        return "Growth"

    return "Aggressive"


def get_rebalance_recommendation(
    profile,
) -> RebalanceResponse:

    risk_profile = determine_risk_profile(
        profile
    )
    recommended = RECOMMENDED_ALLOCATIONS[risk_profile]
    db = SessionLocal()

    try:
        portfolio = _get_portfolio_for_profile(db, profile)
        _, assets = _get_portfolio_assets(db, portfolio.id)
        allocation = calculate_asset_allocation(assets)
    finally:
        db.close()

    return RebalanceResponse(
        risk_profile=risk_profile,

        current_equity=allocation["equity"],
        recommended_equity=recommended["equity"],

        current_debt=allocation["debt"],
        recommended_debt=recommended["debt"],

        current_cash=allocation["cash"],
        recommended_cash=recommended["cash"],

        action=_build_rebalance_action(
            allocation,
            recommended,
            len(assets),
        ),
    )


def get_recommendations(
    profile,
) -> RecommendationResponse:

    risk_profile = determine_risk_profile(
        profile
    )
    recommended = RECOMMENDED_ALLOCATIONS[risk_profile]
    db = SessionLocal()

    try:
        portfolio = _get_portfolio_for_profile(db, profile)
        _, assets = _get_portfolio_assets(db, portfolio.id)
        allocation = calculate_asset_allocation(assets)
        recommendations = _build_recommendations(
            allocation,
            recommended,
            len(assets),
        )
    finally:
        db.close()

    return RecommendationResponse(
        risk_profile=risk_profile,
        recommendations=recommendations,
    )
