from datetime import date, timedelta
from typing import Any, Dict, List

from sqlalchemy.orm import Session

# Internal Model Imports
from app.models.goal import Goal
from app.models.performance_snapshot import PerformanceSnapshot
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset

# Service and Core Analytics Imports
from app.market_data.service import get_crypto_price, get_stock_price
from app.optimization.service import get_portfolio_health
from app.risk.service import calculate_diversification
from app.services.goal_probability import populate_goal_metrics

# Global Constants
BENCHMARK_RETURNS = {
    "NIFTY 50": 11.5,
    "S&P 500": 10.8,
    "NASDAQ": 13.2,
}


def calculate_live_asset_valuations(
    db: Session, portfolio_id: int
) -> List[Dict[str, Any]]:
    """Return the live market value and return percentage for every asset."""
    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio_id)
        .all()
    )

    valuations = []
    for asset in assets:
        amount_invested = float(asset.amount_invested or 0.0)
        quantity = float(asset.quantity or 0.0)
        purchase_price = float(asset.purchase_price or 0.0)
        price = None
        previous_close = None

        try:
            if "crypto" in asset.asset_type.lower():
                market_data = get_crypto_price(asset.ticker)
            else:
                market_data = get_stock_price(asset.ticker)
            price = market_data.price
            previous_close = market_data.previous_close
        except Exception:
            price = None
            previous_close = None

        if quantity <= 0:
            reference_price = purchase_price or previous_close or price or amount_invested
            quantity = amount_invested / reference_price if reference_price > 0 else 0.0

        current_price = price if price and price > 0 else (
            purchase_price or previous_close or (
                amount_invested / quantity if quantity > 0 else 0.0
            )
        )
        market_value = quantity * current_price
        return_pct = (
            ((market_value - amount_invested) / amount_invested) * 100
            if amount_invested > 0
            else 0.0
        )

        valuations.append({
            "asset": asset,
            "market_value": market_value,
            "return_pct": return_pct,
            "todays_gain_loss": (
                (price - previous_close) * quantity
                if price is not None and previous_close is not None
                else 0.0
            ),
        })

    return valuations


def get_best_and_worst_performers(
    db: Session, portfolio_id: int
) -> tuple[PortfolioAsset | None, PortfolioAsset | None]:
    """Select performance leaders using the holdings return percentage."""
    valuations = calculate_live_asset_valuations(db, portfolio_id)
    if not valuations:
        return None, None

    best = max(valuations, key=lambda item: item["return_pct"])
    worst = min(valuations, key=lambda item: item["return_pct"])
    return best["asset"], worst["asset"]


def calculate_live_portfolio_value_and_returns(db: Session, portfolio_id: int) -> Dict[str, float]:
    """
    Calculates live portfolio values, total returns, and daily price fluctuations
    by pulling current market prices for all assets within the portfolio.
    """
    valuations = calculate_live_asset_valuations(db, portfolio_id)
    if not valuations:
        return {
            "total_value": 0.0,
            "total_invested": 0.0,
            "total_profit_loss": 0.0,
            "total_return_pct": 0.0,
            "todays_gain_loss_amt": 0.0,
            "todays_gain_loss_pct": 0.0,
        }

    total_value = 0.0
    total_invested = 0.0
    todays_gain_loss_amt = 0.0

    for valuation in valuations:
        asset = valuation["asset"]
        amount_invested = float(asset.amount_invested or 0.0)
        total_invested += amount_invested
        total_value += valuation["market_value"]
        todays_gain_loss_amt += valuation["todays_gain_loss"]

    total_profit_loss = total_value - total_invested
    total_return_pct = (total_profit_loss / total_invested) * 100.0 if total_invested > 0 else 0.0

    yesterday_value = total_value - todays_gain_loss_amt
    todays_gain_loss_pct = (todays_gain_loss_amt / yesterday_value) * 100.0 if yesterday_value > 0 else 0.0

    return {
        "total_value": round(total_value, 2),
        "total_invested": round(total_invested, 2),
        "total_profit_loss": round(total_profit_loss, 2),
        "total_return_pct": round(total_return_pct, 2),
        "todays_gain_loss_amt": round(todays_gain_loss_amt, 2),
        "todays_gain_loss_pct": round(todays_gain_loss_pct, 2),
    }


def _record_today_snapshot(db: Session, portfolio_id: int) -> PerformanceSnapshot:
    """
    Saves or updates the historical performance snapshot for the current day.
    """
    live_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    live_value = live_metrics["total_value"]
    today = date.today()

    snapshot = (
        db.query(PerformanceSnapshot)
        .filter(
            PerformanceSnapshot.portfolio_id == portfolio_id,
            PerformanceSnapshot.date == today,
        )
        .first()
    )

    if snapshot:
        snapshot.portfolio_value = live_value
    else:
        snapshot = PerformanceSnapshot(
            portfolio_id=portfolio_id,
            date=today,
            portfolio_value=live_value,
        )
        db.add(snapshot)

    db.commit()
    db.refresh(snapshot)
    return snapshot


def get_performance_history(db: Session, portfolio_id: int, period: str = "max") -> List[PerformanceSnapshot]:
    """
    Retrieves performance snapshots filtered by specific lookback periods.
    """
    _record_today_snapshot(db, portfolio_id)

    query = (
        db.query(PerformanceSnapshot)
        .filter(PerformanceSnapshot.portfolio_id == portfolio_id)
        .order_by(PerformanceSnapshot.date.asc())
    )

    today = date.today()
    if period == "1w":
        query = query.filter(PerformanceSnapshot.date >= today - timedelta(days=7))
    elif period == "1m":
        query = query.filter(PerformanceSnapshot.date >= today - timedelta(days=30))
    elif period == "3m":
        query = query.filter(PerformanceSnapshot.date >= today - timedelta(days=90))
    elif period == "6m":
        query = query.filter(PerformanceSnapshot.date >= today - timedelta(days=180))
    elif period == "1y":
        query = query.filter(PerformanceSnapshot.date >= today - timedelta(days=365))

    return query.all()


def _calculate_portfolio_return(history: List[PerformanceSnapshot]) -> float:
    """
    Helper function to calculate historical return percentage based on snapshots.
    """
    if len(history) < 2:
        return 0.0

    first_value = history[0].portfolio_value
    latest_value = history[-1].portfolio_value

    if first_value <= 0:
        return 0.0

    return round(((latest_value - first_value) / first_value) * 100, 2)


def get_benchmark_comparison(db: Session, portfolio_id: int, benchmark: str = "S&P 500") -> Dict[str, Any]:
    """
    Compares current live portfolio returns against traditional benchmark metrics to extract alpha.
    """
    # Fetch historical tracking data context
    _ = get_performance_history(db, portfolio_id)

    normalized_benchmark = benchmark.upper()
    benchmark_name = next(
        (name for name in BENCHMARK_RETURNS if name.upper() == normalized_benchmark),
        "S&P 500",
    )

    live_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    portfolio_return = live_metrics["total_return_pct"]
    benchmark_return = BENCHMARK_RETURNS[benchmark_name]

    return {
        "benchmark": benchmark_name,
        "portfolio_return": portfolio_return,
        "benchmark_return": benchmark_return,
        "alpha": round(portfolio_return - benchmark_return, 2),
    }


def _get_goal_success(db: Session, user_id: int) -> float:
    """
    Determines success probability of a user's target financial goal.
    """
    goal = db.query(Goal).filter(Goal.user_id == user_id).first()
    if not goal:
        return 0.0

    metrics = populate_goal_metrics(db, goal)
    return metrics.get("success_probability", 0.0)


def _get_rating(score: float) -> str:
    """
    Converts a numerical portfolio score to an explicit grading classification.
    """
    if score >= 85:
        return "A"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "Fair"
    return "Needs Attention"


def get_portfolio_scorecard(db: Session, portfolio_id: int) -> Dict[str, Any]:
    """
    Assembles a comprehensive evaluation score sheet across health, diversification, risk, and alpha.
    """
    from app.services.portfolio_analytics_service import calculate_risk_metrics

    health = get_portfolio_health(portfolio_id)
    risk_metrics = calculate_risk_metrics(db, portfolio_id)
    comparison = get_benchmark_comparison(db, portfolio_id)
    
    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio_id)
        .all()
    )

    best_asset, worst_asset = get_best_and_worst_performers(db, portfolio_id)

    performance_score = max(min(60 + comparison["alpha"], 100), 0)
    
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    goal_success = 0.0
    if portfolio:
        goal_success = _get_goal_success(db, portfolio.user_id)

    risk_score = {
        "Low": 90,
        "Medium": 70,
        "High": 45,
    }.get(risk_metrics.get("concentration_risk"), 60)

    diversification = calculate_diversification(assets)
    
    overall_score = (
        health.health_score * 0.3 +
        diversification.get("score", 0) * 0.2 +
        risk_score * 0.2 +
        performance_score * 0.15 +
        goal_success * 0.15
    )

    return {
        "portfolio_health": health.health_score,
        "diversification": diversification.get("score", 0),
        "risk": risk_metrics.get("concentration_risk", "Unknown"),
        "performance": round(performance_score, 2),
        "goal_success": goal_success,
        "overall_rating": _get_rating(overall_score),
        "best_performer": best_asset.ticker if best_asset else "None",
        "worst_performer": worst_asset.ticker if worst_asset else "None",
    }


def get_portfolio_analytics(db: Session, portfolio_id: int) -> Dict[str, float]:
    """
    Computes time-weighted rolling performance windows (Daily, Weekly, Monthly) and CAGR.
    """
    live_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    current_value = live_metrics["total_value"]

    history = (
        db.query(PerformanceSnapshot)
        .filter(PerformanceSnapshot.portfolio_id == portfolio_id)
        .order_by(PerformanceSnapshot.date.asc())
        .all()
    )

    def get_snapshot_days_ago(days: int) -> Any:
        target_date = date.today() - timedelta(days=days)
        closest = None
        for snap in history:
            if snap.date <= target_date:
                closest = snap
            else:
                break
        return closest

    snap_yesterday = get_snapshot_days_ago(1)
    snap_weekly = get_snapshot_days_ago(7)
    snap_monthly = get_snapshot_days_ago(30)

    daily_return_pct = 0.0
    daily_return_amt = 0.0
    weekly_return_pct = 0.0
    monthly_return_pct = 0.0
    cagr = 0.0

    if snap_yesterday and snap_yesterday.portfolio_value > 0:
        daily_return_amt = current_value - snap_yesterday.portfolio_value
        daily_return_pct = (daily_return_amt / snap_yesterday.portfolio_value) * 100.0
    else:
        daily_return_amt = live_metrics["todays_gain_loss_amt"]
        daily_return_pct = live_metrics["todays_gain_loss_pct"]

    if snap_weekly and snap_weekly.portfolio_value > 0:
        weekly_return_pct = ((current_value - snap_weekly.portfolio_value) / snap_weekly.portfolio_value) * 100.0

    if snap_monthly and snap_monthly.portfolio_value > 0:
        monthly_return_pct = ((current_value - snap_monthly.portfolio_value) / snap_monthly.portfolio_value) * 100.0

    if history:
        first_snap = history[0]
        days_diff = (date.today() - first_snap.date).days
        years = days_diff / 365.25
        if years >= 0.08 and first_snap.portfolio_value > 0 and current_value > 0:
            cagr = ((current_value / first_snap.portfolio_value) ** (1.0 / years) - 1.0) * 100.0

    return {
        "total_return_pct": round(live_metrics["total_return_pct"], 2),
        "total_profit_loss": round(live_metrics["total_profit_loss"], 2),
        "daily_return_amt": round(daily_return_amt, 2),
        "daily_return_pct": round(daily_return_pct, 2),
        "weekly_return_pct": round(weekly_return_pct, 2),
        "monthly_return_pct": round(monthly_return_pct, 2),
        "cagr": round(cagr, 2),
    }
