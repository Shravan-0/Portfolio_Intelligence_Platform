from pydantic import BaseModel, Field

class PortfolioAssetCreate(BaseModel):
    ticker: str = Field(..., min_length=1)
    asset_type: str = Field(..., min_length=1)
    allocation_percent: float = Field(..., ge=0, le=100)
    amount_invested: float = Field(..., ge=0)


class PortfolioAssetResponse(BaseModel):
    id: int
    portfolio_id: int
    ticker: str
    asset_type: str
    allocation_percent: float
    amount_invested: float

    class Config:
        from_attributes = True