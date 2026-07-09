from fastapi import HTTPException
from sqlalchemy.orm import Session

from .crud import (
    create_asset,
    get_asset_by_id,
    get_assets_by_portfolio,
    update_asset,
    delete_asset,
)

ALLOCATION_EXCEEDED_MSG = (
    "Total portfolio allocation cannot exceed 100%."
)


def validate_portfolio_allocation(
    db: Session,
    portfolio_id: int,
    allocation_percent: float,
    exclude_asset_id: int | None = None,
):
    existing_assets = get_assets_by_portfolio(db, portfolio_id)

    current_allocation = sum(
        existing_asset.allocation_percent
        for existing_asset in existing_assets
        if existing_asset.id != exclude_asset_id
    )

    if current_allocation + allocation_percent > 100:
        raise HTTPException(
            status_code=400,
            detail=ALLOCATION_EXCEEDED_MSG,
        )


def add_asset(db, asset_data):
    validate_portfolio_allocation(
        db,
        asset_data.portfolio_id,
        asset_data.allocation_percent,
    )
    return create_asset(db, asset_data)


def fetch_assets(db, portfolio_id):
    return get_assets_by_portfolio(
        db,
        portfolio_id
    )


def modify_asset(
    db,
    asset_id,
    asset_data
):
    asset = get_asset_by_id(db, asset_id)

    if asset is None:
        return None

    validate_portfolio_allocation(
        db,
        asset.portfolio_id,
        asset_data.allocation_percent,
        exclude_asset_id=asset_id,
    )

    return update_asset(
        db,
        asset_id,
        asset_data
    )


def remove_asset(db, asset_id):
    return delete_asset(
        db,
        asset_id
    )
