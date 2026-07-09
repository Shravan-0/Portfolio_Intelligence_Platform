from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
)
from app.database.dependencies import get_db
from app.models.user import User
from app.performance.schemas import (
    BenchmarkComparisonResponse,
    PerformanceHistoryItem,
    PortfolioScorecardResponse,
    PerformanceAnalyticsResponse
)
from app.performance.service import (
    get_benchmark_comparison,
    get_performance_history,
    get_portfolio_scorecard,
    get_portfolio_analytics
)


router = APIRouter(
    prefix="/performance",
    tags=["Performance"]
)


@router.get(
    "/history/{portfolio_id}",
    response_model=list[PerformanceHistoryItem]
)
def read_performance_history(
    portfolio_id: int,
    period: str = "max",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_performance_history(
        db,
        portfolio_id,
        period=period
    )


@router.get(
    "/benchmark/{portfolio_id}",
    response_model=BenchmarkComparisonResponse
)
def read_benchmark_comparison(
    portfolio_id: int,
    benchmark: str = "S&P 500",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_benchmark_comparison(
        db,
        portfolio_id,
        benchmark
    )


@router.get(
    "/scorecard/{portfolio_id}",
    response_model=PortfolioScorecardResponse
)
def read_portfolio_scorecard(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_portfolio_scorecard(
        db,
        portfolio_id
    )


@router.get(
    "/analytics/{portfolio_id}",
    response_model=PerformanceAnalyticsResponse
)
def read_performance_analytics(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)
    return get_portfolio_analytics(db, portfolio_id)
