from pydantic import BaseModel

class PortfolioSummaryResponse(BaseModel):
    portfolio_id: int
    asset_count: int
    total_value: float
    largest_holding: str
    largest_allocation: float