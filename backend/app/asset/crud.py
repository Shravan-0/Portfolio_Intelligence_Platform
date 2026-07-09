from app.models.portfolio_asset import PortfolioAsset


def create_asset(db, asset_data):
    asset = PortfolioAsset(**asset_data.model_dump())

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset


def get_assets_by_portfolio(db, portfolio_id):
    return (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id == portfolio_id
        )
        .all()
    )


def get_asset_by_id(db, asset_id):
    return (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.id == asset_id)
        .first()
    )


def update_asset(db, asset_id, asset_data):
    asset = get_asset_by_id(db, asset_id)

    if not asset:
        return None

    asset.ticker = asset_data.ticker
    asset.asset_type = asset_data.asset_type
    asset.allocation_percent = asset_data.allocation_percent
    asset.amount_invested = asset_data.amount_invested

    db.commit()
    db.refresh(asset)

    return asset


def delete_asset(db, asset_id):
    asset = get_asset_by_id(db, asset_id)

    if asset:
        db.delete(asset)
        db.commit()

    return asset