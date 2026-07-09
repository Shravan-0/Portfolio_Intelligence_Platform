from sqlalchemy.orm import Session

from app.models.portfolio_asset import (
    PortfolioAsset
)


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

    exposure_map = {}

    for asset in assets:

        exposure_map.setdefault(
            asset.asset_type,
            0
        )

        exposure_map[
            asset.asset_type
        ] += asset.allocation_percent

    return [
        {
            "factor": factor,
            "exposure": exposure
        }
        for factor, exposure
        in exposure_map.items()
    ]