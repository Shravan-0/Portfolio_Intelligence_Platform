from pydantic import BaseModel


class PortfolioIntelligenceResponse(
    BaseModel
):
    portfolio_id: int

    total_value: float

    asset_count: int

    diversification_score: float

    health_score: float

    concentration_level: str

    largest_holding: str

    largest_allocation: float