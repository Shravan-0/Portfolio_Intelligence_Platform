from pydantic import BaseModel


class HoldingBase(BaseModel):
    portfolio_id: int
    symbol: str
    quantity: float
    purchase_price: float
    current_price: float


class HoldingCreate(HoldingBase):
    pass


class HoldingResponse(HoldingBase):
    id: int

    class Config:
        from_attributes = True