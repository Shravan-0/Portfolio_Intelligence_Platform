from pydantic import BaseModel

class PortfolioRiskResponse(BaseModel):
    diversification_score: float
    concentration_risk: str
    largest_position: str
    largest_position_weight: float
