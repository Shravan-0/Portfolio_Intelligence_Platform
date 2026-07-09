from pydantic import BaseModel
from app.schemas.portfolio_intelligence import PortfolioIntelligenceResponse
from app.schemas.portfolio_allocation import AllocationItem as PortfolioAllocationItem
from app.schemas.factor_exposure import FactorExposureItem
from app.schemas.goal import GoalProbabilityResponse

class AllocationItem(BaseModel):
    symbol: str
    value: float
    percentage: float

class PortfolioAnalytics(BaseModel):
    total_value: float
    diversification_score: float
    risk_score: float
    allocation: list[AllocationItem]

class AnalyticsDashboardResponse(BaseModel):
    portfolio: PortfolioIntelligenceResponse
    allocation: list[PortfolioAllocationItem]
    factor_exposure: list[FactorExposureItem]
    goal_probability: GoalProbabilityResponse


class BenchmarkResponse(BaseModel):
    portfolio_return: float
    benchmark: str
    benchmark_return: float
    alpha: float
    status: str

from typing import Dict

class CorrelationMatrixResponse(BaseModel):
    matrix: Dict[str, Dict[str, float]]