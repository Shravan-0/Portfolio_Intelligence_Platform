from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset

from .schemas import (
    PortfolioRiskResponse,
    AssetAllocationResponse,
    DiversificationResponse,
    RiskProfileResponse,
)


def _get_portfolio_assets(
    db: Session,
    portfolio_id: int,
) -> tuple[Portfolio, list[PortfolioAsset]]:
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id)
        .first()
    )

    if not portfolio:
        raise HTTPException(
            status_code=404,
            detail="Portfolio not found",
        )

    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio_id)
        .all()
    )

    if not assets:
        raise HTTPException(
            status_code=404,
            detail="Portfolio has no assets",
        )

    return portfolio, assets


def _with_db_assets(portfolio_id: int):
    db = SessionLocal()

    try:
        return _get_portfolio_assets(db, portfolio_id)
    finally:
        db.close()


def _asset_bucket(asset_type: str) -> str:
    normalized = (asset_type or "").strip().lower()

    debt_terms = (
        "bond",
        "debt",
        "fixed income",
        "fd",
        "gilt",
        "treasury",
    )
    cash_terms = (
        "cash",
        "liquid",
        "money market",
        "savings",
    )

    if any(term in normalized for term in cash_terms):
        return "cash"

    if any(term in normalized for term in debt_terms):
        return "debt"

    return "equity"


def calculate_total_invested(
    assets: list[PortfolioAsset],
) -> float:
    return sum(
        float(asset.amount_invested or 0)
        for asset in assets
    )


def calculate_asset_allocation(
    assets: list[PortfolioAsset],
) -> dict[str, float]:
    allocation = {
        "equity": 0.0,
        "debt": 0.0,
        "cash": 0.0,
    }

    total_invested = calculate_total_invested(assets)

    # Prefer invested value because it reflects the live portfolio weight.
    if total_invested > 0:
        for asset in assets:
            bucket = _asset_bucket(asset.asset_type)
            allocation[bucket] += (
                float(asset.amount_invested or 0)
                / total_invested
                * 100
            )
    else:
        total_allocation = sum(
            float(asset.allocation_percent or 0)
            for asset in assets
        )

        if total_allocation <= 0:
            return allocation

        for asset in assets:
            bucket = _asset_bucket(asset.asset_type)
            allocation[bucket] += (
                float(asset.allocation_percent or 0)
                / total_allocation
                * 100
            )

    return {
        bucket: round(percent, 2)
        for bucket, percent in allocation.items()
    }


def calculate_diversification(
    assets: list[PortfolioAsset],
) -> dict[str, int | str]:
    asset_count = len(assets)

    if asset_count == 1:
        return {
            "score": 25,
            "rating": "Poor",
        }

    if asset_count <= 3:
        return {
            "score": 50,
            "rating": "Fair",
        }

    if asset_count <= 6:
        return {
            "score": 75,
            "rating": "Good",
        }

    return {
        "score": 100,
        "rating": "Excellent",
    }


def calculate_allocation_risk_metrics(
    allocation: dict[str, float],
) -> dict[str, float]:
    equity = allocation["equity"] / 100
    debt = allocation["debt"] / 100
    cash = allocation["cash"] / 100

    # Simple allocation-weighted assumptions keep the metrics data-driven.
    volatility = (
        equity * 18
        + debt * 6
        + cash * 1
    )
    expected_return = (
        equity * 12
        + debt * 7
        + cash * 3
    )
    beta = (
        equity * 1.1
        + debt * 0.25
        + cash * 0.05
    )
    max_drawdown = -(
        equity * 35
        + debt * 8
        + cash * 1
    )
    sharpe_ratio = (
        (expected_return - 4) / volatility
        if volatility > 0
        else 0
    )

    return {
        "volatility": round(volatility, 2),
        "expected_return": round(expected_return, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "max_drawdown": round(max_drawdown, 2),
        "beta": round(beta, 2),
    }


def get_portfolio_risk(
    portfolio_id: int
) -> PortfolioRiskResponse:
    _, assets = _with_db_assets(portfolio_id)
    allocation = calculate_asset_allocation(assets)
    metrics = calculate_allocation_risk_metrics(allocation)

    return PortfolioRiskResponse(
        portfolio_id=portfolio_id,
        volatility=metrics["volatility"],
        sharpe_ratio=metrics["sharpe_ratio"],
        max_drawdown=metrics["max_drawdown"],
        beta=metrics["beta"],
    )


def get_asset_allocation(
    portfolio_id: int,
) -> AssetAllocationResponse:
    _, assets = _with_db_assets(portfolio_id)
    allocation = calculate_asset_allocation(assets)

    return AssetAllocationResponse(
        equity=allocation["equity"],
        debt=allocation["debt"],
        cash=allocation["cash"],
    )


def get_diversification_score(
    portfolio_id: int,
) -> DiversificationResponse:
    _, assets = _with_db_assets(portfolio_id)
    diversification = calculate_diversification(assets)

    return DiversificationResponse(
        score=diversification["score"],
        rating=diversification["rating"],
    )


def calculate_risk_score(profile):

    score = 0

    # Age
    if profile.age < 35:
        score += 20
    elif profile.age < 50:
        score += 10
    else:
        score += 5

    # Investment Horizon
    if profile.investment_horizon > 10:
        score += 25
    elif profile.investment_horizon >= 5:
        score += 15
    else:
        score += 5

    # Income
    if profile.annual_income > 1000000:
        score += 20
    elif profile.annual_income > 500000:
        score += 10

    # Risk Tolerance
    if profile.risk_tolerance == "Aggressive":
        score += 25
    elif profile.risk_tolerance == "Moderate":
        score += 15
    else:
        score += 5

    return score


def get_risk_profile(
    profile,
) -> RiskProfileResponse:

    risk_score = calculate_risk_score(
        profile
    )

    if risk_score <= 30:
        profile_name = "Conservative"

    elif risk_score <= 50:
        profile_name = "Moderate"

    elif risk_score <= 75:
        profile_name = "Growth"

    else:
        profile_name = "Aggressive"

    return RiskProfileResponse(
        risk_score=risk_score,
        risk_profile=profile_name,
    )
