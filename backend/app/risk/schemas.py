from pydantic import BaseModel


class PortfolioRiskResponse(BaseModel):
    portfolio_id: int
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    beta: float


class AssetAllocationResponse(BaseModel):
    equity: float
    debt: float
    cash: float


class DiversificationResponse(BaseModel):
    score: int
    rating: str


class RiskProfileResponse(BaseModel):
    risk_score: int
    risk_profile: str