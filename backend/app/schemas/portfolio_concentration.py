from pydantic import BaseModel

class PortfolioConcentrationResponse(BaseModel):
    hhi_score: float
    concentration_level: str