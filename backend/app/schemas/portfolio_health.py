from pydantic import BaseModel

class PortfolioHealthResponse(BaseModel):
    health_score: float
    rating: str
    diversification_score: float
    concentration_penalty: float