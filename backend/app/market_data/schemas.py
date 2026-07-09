from pydantic import BaseModel


class MarketPriceResponse(BaseModel):
    ticker: str
    price: float
    currency: str
    previous_close: float | None = None
