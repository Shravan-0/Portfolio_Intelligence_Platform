from pydantic import BaseModel, Field


class AssetCreate(BaseModel):
    portfolio_id: int
    ticker: str = Field(..., min_length=1)
    asset_type: str = Field(..., min_length=1)
    allocation_percent: float = Field(..., ge=0, le=100)
    amount_invested: float = Field(..., ge=0)


class AssetUpdate(BaseModel):
    ticker: str = Field(..., min_length=1)
    asset_type: str = Field(..., min_length=1)
    allocation_percent: float = Field(..., ge=0, le=100)
    amount_invested: float = Field(..., ge=0)


class AssetResponse(BaseModel):
    id: int
    portfolio_id: int
    ticker: str
    asset_type: str
    allocation_percent: float
    amount_invested: float

    class Config:
        from_attributes = True