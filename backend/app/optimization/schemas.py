from pydantic import BaseModel


class PortfolioHealthResponse(BaseModel):
    portfolio_id: int
    health_score: int
    rating: str


class RebalanceResponse(BaseModel):
    risk_profile: str

    current_equity: float
    recommended_equity: float

    current_debt: float
    recommended_debt: float

    current_cash: float
    recommended_cash: float

    action: str


class RecommendationResponse(BaseModel):
    risk_profile: str
    recommendations: list[str]