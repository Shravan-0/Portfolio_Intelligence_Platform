import json
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import Request
from urllib.request import urlopen

from fastapi import HTTPException

from app.market_data.schemas import MarketPriceResponse


YAHOO_CHART_URL = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
)


def _fetch_yahoo_price(
    symbol: str,
    response_ticker: str
) -> MarketPriceResponse:
    url = YAHOO_CHART_URL.format(
        symbol=quote(symbol.upper())
    )
    request = Request(
        url,
        headers={
            "User-Agent": "StratFolio/1.0"
        }
    )

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(
                response.read().decode("utf-8")
            )
    except (OSError, URLError, TimeoutError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Market data provider unavailable"
        ) from exc

    result = (
        payload
        .get("chart", {})
        .get("result", [])
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Market price not found"
        )

    meta = result[0].get("meta", {})
    price = meta.get("regularMarketPrice")
    currency = meta.get("currency") or "USD"
    previous_close = meta.get(
        "chartPreviousClose"
    ) or meta.get("previousClose")

    if price is None:
        raise HTTPException(
            status_code=404,
            detail="Market price not found"
        )

    return MarketPriceResponse(
        ticker=response_ticker.upper(),
        price=float(price),
        currency=currency,
        previous_close=(
            float(previous_close)
            if previous_close is not None
            else None
        )
    )


def get_stock_price(ticker: str) -> MarketPriceResponse:
    return _fetch_yahoo_price(
        ticker,
        ticker
    )


def get_crypto_price(symbol: str) -> MarketPriceResponse:
    yahoo_symbol = f"{symbol.upper()}-USD"

    return _fetch_yahoo_price(
        yahoo_symbol,
        symbol
    )
