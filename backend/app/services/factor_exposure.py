from sqlalchemy.orm import Session

from app.models.portfolio_asset import (
    PortfolioAsset
)
from app.performance.service import calculate_live_asset_valuations


def get_factor_exposure(
    portfolio_id: int,
    db: Session
):
    assets = (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id
            == portfolio_id
        )
        .all()
    )

    valuations = calculate_live_asset_valuations(db, portfolio_id)
    total_value = sum(item["market_value"] for item in valuations)
    exposure_map = {}

    for valuation in valuations:
        asset = valuation["asset"]

        exposure_map.setdefault(
            asset.asset_type,
            0
        )

        exposure_map[
            asset.asset_type
        ] += (
            (valuation["market_value"] / total_value) * 100
            if total_value > 0
            else 0.0
        )

    return [
        {
            "factor": factor,
            "exposure": exposure
        }
        for factor, exposure
        in exposure_map.items()
    ]
