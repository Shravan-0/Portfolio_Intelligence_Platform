from datetime import date

from pydantic import BaseModel


class PerformanceHistoryItem(BaseModel):
    date: date
    portfolio_value: float

    class Config:
        from_attributes = True


class BenchmarkComparisonResponse(BaseModel):
    benchmark: str
    portfolio_return: float
    benchmark_return: float
    alpha: float


class PortfolioScorecardResponse(BaseModel):
    portfolio_health: float
    diversification: float
    risk: str
    performance: float
    goal_success: float
    overall_rating: str
    best_performer: str
    worst_performer: str


class PerformanceAnalyticsResponse(BaseModel):
    total_return_pct: float
    total_profit_loss: float
    daily_return_amt: float
    daily_return_pct: float
    weekly_return_pct: float
    monthly_return_pct: float
    cagr: float
