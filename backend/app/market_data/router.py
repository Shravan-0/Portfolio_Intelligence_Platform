from fastapi import APIRouter

from app.market_data.schemas import MarketPriceResponse
from app.market_data.service import (
    get_crypto_price,
    get_stock_price
)


router = APIRouter(
    prefix="/market-data",
    tags=["Market Data"]
)


@router.get(
    "/stock/{ticker}",
    response_model=MarketPriceResponse
)
def get_stock_market_data(ticker: str):
    return get_stock_price(ticker)


@router.get(
    "/crypto/{symbol}",
    response_model=MarketPriceResponse
)
def get_crypto_market_data(symbol: str):
    return get_crypto_price(symbol)
