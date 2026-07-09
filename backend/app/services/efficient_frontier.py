import logging

import numpy as np
from scipy.optimize import minimize

from app.finance.asset_statistics import ASSET_STATISTICS

logger = logging.getLogger(__name__)

# Simple fallback stats by asset class, used only when a ticker isn't
# found in ASSET_STATISTICS. These are intentionally rough, student-level
# assumptions (not derived from live market data).
ASSET_TYPE_FALLBACK = {
    "equity": {"expected_return": 0.12, "volatility": 0.20},
    "stock": {"expected_return": 0.12, "volatility": 0.20},
    "etf": {"expected_return": 0.10, "volatility": 0.16},
    "debt": {"expected_return": 0.06, "volatility": 0.06},
    "bond": {"expected_return": 0.06, "volatility": 0.06},
    "fixed income": {"expected_return": 0.06, "volatility": 0.06},
    "cash": {"expected_return": 0.03, "volatility": 0.01},
    "crypto": {"expected_return": 0.30, "volatility": 0.65},
    "commodity": {"expected_return": 0.08, "volatility": 0.18},
}

DEFAULT_FALLBACK = {"expected_return": 0.10, "volatility": 0.18}


def _get_asset_stats(ticker: str, asset_type: str) -> dict:
    """
    Look up expected return / volatility for an asset.
    Prefers the known per-ticker table, falls back to an asset-class
    average, and finally to a generic default.
    """
    ticker_key = (ticker or "").upper()

    if ticker_key in ASSET_STATISTICS:
        return ASSET_STATISTICS[ticker_key]

    type_key = (asset_type or "").strip().lower()

    for keyword, stats in ASSET_TYPE_FALLBACK.items():
        if keyword in type_key:
            return stats

    return DEFAULT_FALLBACK


def _build_covariance_matrix(
    volatilities: np.ndarray,
    asset_types: list[str],
) -> np.ndarray:
    """
    Simple, student-level covariance estimate.

    We don't have a historical price series wired up for correlation
    calculation, so we assume a constant correlation structure:
    assets in the same class move together more than assets in
    different classes. This is a simplification, not a real
    statistical estimate.
    """
    n = len(volatilities)
    correlation = np.identity(n)

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            same_class = asset_types[i] == asset_types[j]
            correlation[i][j] = 0.6 if same_class else 0.25

    return np.outer(volatilities, volatilities) * correlation


def generate_efficient_frontier(assets: list) -> list[dict]:
    """
    Build an efficient frontier from the user's actual portfolio assets.

    `assets` is a list of PortfolioAsset rows. Returns a list of
    {"risk": float, "return": float} points, or [] if a frontier
    cannot be computed (no assets, or optimizer failure).
    """
    try:
        if not assets:
            return []

        tickers = [asset.ticker for asset in assets]
        asset_types = [
            (asset.asset_type or "").strip().lower()
            for asset in assets
        ]

        stats = [
            _get_asset_stats(ticker, asset_type)
            for ticker, asset_type in zip(tickers, asset_types)
        ]

        returns = np.array([s["expected_return"] for s in stats])
        volatilities = np.array([s["volatility"] for s in stats])

        if len(returns) == 1:
            # A single-asset portfolio has no frontier to trace,
            # just return its own risk/return point.
            return [
                {
                    "risk": round(float(volatilities[0]), 4),
                    "return": round(float(returns[0]), 4),
                }
            ]

        cov_matrix = _build_covariance_matrix(volatilities, asset_types)

        def portfolio_return(weights):
            return np.sum(weights * returns)

        def portfolio_risk(weights):
            return np.sqrt(
                np.dot(weights.T, np.dot(cov_matrix, weights))
            )

        constraints = (
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
        )

        bounds = tuple((0, 1) for _ in range(len(returns)))
        initial_weights = np.array([1 / len(returns)] * len(returns))

        frontier_points = []
        target_returns = np.linspace(min(returns), max(returns), 50)

        for target_return in target_returns:
            target_constraint = (
                {
                    "type": "eq",
                    "fun": lambda w, tr=target_return:
                        portfolio_return(w) - tr,
                },
            )

            result = minimize(
                portfolio_risk,
                initial_weights,
                method="SLSQP",
                bounds=bounds,
                constraints=constraints + target_constraint,
            )

            if result.success:
                risk = portfolio_risk(result.x)
                frontier_points.append(
                    {
                        "risk": round(float(risk), 4),
                        "return": round(float(target_return), 4),
                    }
                )

        # Highlight the point with the best Return/Risk ratio
        if frontier_points:
         optimal_point = max(
           frontier_points,
             key=lambda p: (
             p["return"] / p["risk"]
            if p["risk"] > 0
            else 0
           ),
          )
         for point in frontier_points:
            point["optimal"] = (
            point is optimal_point
         ) 
        return frontier_points

    except Exception:
        logger.exception("Failed to generate efficient frontier")
        return []