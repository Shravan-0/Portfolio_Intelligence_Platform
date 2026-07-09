from datetime import date

from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.performance_snapshot import PerformanceSnapshot
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset
from app.services.portfolio_analytics_service import (
    calculate_health_score,
    calculate_risk_metrics,
    calculate_summary
)


BENCHMARK_RETURNS = {
    "NIFTY 50": 11.5,
    "S&P 500": 10.8,
    "NASDAQ": 13.2
}


def _record_today_snapshot(
    db: Session,
    portfolio_id: int
):
    live_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    live_value = live_metrics["total_value"]
    today = date.today()

    snapshot = (
        db.query(PerformanceSnapshot)
        .filter(
            PerformanceSnapshot.portfolio_id == portfolio_id,
            PerformanceSnapshot.date == today
        )
        .first()
    )

    if snapshot:
        snapshot.portfolio_value = live_value
    else:
        snapshot = PerformanceSnapshot(
            portfolio_id=portfolio_id,
            date=today,
            portfolio_value=live_value
        )
        db.add(snapshot)

    db.commit()
    db.refresh(snapshot)

    return snapshot


def get_performance_history(
    db: Session,
    portfolio_id: int,
    period: str = "max"
):
    _record_today_snapshot(
        db,
        portfolio_id
    )

    query = (
        db.query(PerformanceSnapshot)
        .filter(
            PerformanceSnapshot.portfolio_id == portfolio_id
        )
        .order_by(PerformanceSnapshot.date.asc())
    )

    from datetime import timedelta
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


def _calculate_portfolio_return(history):
    if len(history) < 2:
        return 0.0

    first_value = history[0].portfolio_value
    latest_value = history[-1].portfolio_value

    if first_value <= 0:
        return 0.0

    return round(
        (
            (latest_value - first_value) /
            first_value
        ) * 100,
        2
    )


def get_benchmark_comparison(
    db: Session,
    portfolio_id: int,
    benchmark: str = "S&P 500"
):
    history = get_performance_history(
        db,
        portfolio_id
    )

    normalized_benchmark = benchmark.upper()

    benchmark_name = next(
        (
            name
            for name in BENCHMARK_RETURNS
            if name.upper() == normalized_benchmark
        ),
        "S&P 500"
    )

    # NEW CODE
    live_metrics = calculate_live_portfolio_value_and_returns(
        db,
        portfolio_id,
    )

    portfolio_return = live_metrics["total_return_pct"]

    benchmark_return = BENCHMARK_RETURNS[
        benchmark_name
    ]

    return {
        "benchmark": benchmark_name,
        "portfolio_return": portfolio_return,
        "benchmark_return": benchmark_return,
        "alpha": round(
            portfolio_return - benchmark_return,
            2
        )
    }


def _get_goal_success(
    db: Session,
    portfolio_value: float,
    user_id: int
):
    user_goal = (
        db.query(Goal)
        .filter(
            Goal.user_id == user_id
        )
        .first()
    )

    if (
        not user_goal or
        user_goal.target_amount <= 0
    ):
        return 0.0

    return round(
        min(
            (
                portfolio_value /
                user_goal.target_amount
            ) * 100,
            100
        ),
        2
    )


def _get_rating(score: float):
    if score >= 85:
        return "A"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "Fair"
    return "Needs Attention"


def get_portfolio_scorecard(
    db: Session,
    portfolio_id: int
):
    summary = calculate_summary(
        db,
        portfolio_id
    )
    health = calculate_health_score(
        db,
        portfolio_id
    )
    risk_metrics = calculate_risk_metrics(
        db,
        portfolio_id
    )
    comparison = get_benchmark_comparison(
        db,
        portfolio_id
    )
    assets = (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id == portfolio_id
        )
        .all()
    )
    best_asset = max(
    assets,
    key=lambda asset: getattr(asset, "return_pct", float("-inf")),
    default=None
    )

    worst_asset = min(
    assets,
    key=lambda asset: getattr(asset, "return_pct", float("inf")),
    default=None
    )
    performance_score = max(
        min(
            60 + comparison["alpha"],
            100
        ),
        0
    )
    portfolio = (
        db.query(Portfolio)
        .filter(
            Portfolio.id == portfolio_id
        )
        .first()
    )
    goal_success = 0.0
    if portfolio:
        goal_success = _get_goal_success(
            db,
            summary["total_value"],
            portfolio.user_id
        )
    risk_score = {
        "Low": 90,
        "Medium": 70,
        "High": 45
    }.get(
        risk_metrics["concentration_risk"],
        60
    )
    overall_score = (
        health["health_score"] * 0.3 +
        health["diversification_score"] * 0.2 +
        risk_score * 0.2 +
        performance_score * 0.15 +
        goal_success * 0.15
    )

    return {
        "portfolio_health": health["health_score"],
        "diversification": health[
            "diversification_score"
        ],
        "risk": risk_metrics[
            "concentration_risk"
        ],
        "performance": round(
            performance_score,
            2
        ),
        "goal_success": goal_success,
        "overall_rating": _get_rating(
            overall_score
        ),
        "best_performer": (
            best_asset.ticker
            if best_asset
            else "None"
        ),
        "worst_performer": (
            worst_asset.ticker
            if worst_asset
            else "None"
        )
    }


def calculate_live_portfolio_value_and_returns(db: Session, portfolio_id: int):
    from app.models.portfolio_asset import PortfolioAsset
    from app.market_data.service import get_stock_price, get_crypto_price

    assets = db.query(PortfolioAsset).filter(PortfolioAsset.portfolio_id == portfolio_id).all()
    if not assets:
        return {
            "total_value": 0.0,
            "total_invested": 0.0,
            "total_profit_loss": 0.0,
            "total_return_pct": 0.0,
            "todays_gain_loss_amt": 0.0,
            "todays_gain_loss_pct": 0.0
        }

    total_value = 0.0
    total_invested = 0.0
    todays_gain_loss_amt = 0.0

    for asset in assets:
        ticker = asset.ticker
        asset_type = asset.asset_type.lower()
        amount_invested = asset.amount_invested or 0.0
        total_invested += amount_invested

        quantity = asset.quantity
        purchase_price = asset.purchase_price
        price = None
        previous_close = None
        try:
            if "crypto" in asset_type:
                market_data = get_crypto_price(ticker)
            else:
                market_data = get_stock_price(ticker)
            price = market_data.price
            previous_close = market_data.previous_close
        except Exception:
           price = purchase_price
           previous_close = purchase_price

        if not quantity:
            ref_price = purchase_price or previous_close or price or amount_invested
            quantity = amount_invested / ref_price if ref_price > 0 else 0.0

        current_asset_price = price if price is not None else (purchase_price or previous_close or (amount_invested / quantity if quantity > 0 else 0.0))
        asset_market_value = quantity * current_asset_price
        asset.return_pct = (
    ((asset_market_value - amount_invested) / amount_invested) * 100
    if amount_invested > 0
    else 0.0
)
        total_value += asset_market_value

        if price is not None and previous_close is not None:
            todays_gain_loss_amt += (price - previous_close) * quantity

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
        "todays_gain_loss_pct": round(todays_gain_loss_pct, 2)
    }


def get_portfolio_analytics(db: Session, portfolio_id: int):
    from datetime import date, timedelta
    from app.models.performance_snapshot import PerformanceSnapshot

    live_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    current_value = live_metrics["total_value"]

    history = (
        db.query(PerformanceSnapshot)
        .filter(PerformanceSnapshot.portfolio_id == portfolio_id)
        .order_by(PerformanceSnapshot.date.asc())
        .all()
    )

    def get_snapshot_days_ago(days):
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
        "cagr": round(cagr, 2)
    }
