from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session



from app.auth.dependencies import (

    get_current_user,

    get_owned_asset,

    get_owned_portfolio,

)

from app.database.dependencies import get_db

from app.models.user import User



from app.asset.schemas import (

    AssetCreate,

    AssetUpdate,

    AssetResponse

)



from app.asset.service import (

    add_asset,

    fetch_assets,

    modify_asset,

    remove_asset

)



router = APIRouter(

    prefix="/assets",

    tags=["Assets"]

)





@router.post(

    "/",

    response_model=AssetResponse

)

def create_new_asset(

    asset: AssetCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    get_owned_portfolio(db, asset.portfolio_id, current_user)

    return add_asset(db, asset)





@router.get(

    "/portfolio/{portfolio_id}",

    response_model=list[AssetResponse]

)

def get_portfolio_assets(

    portfolio_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    get_owned_portfolio(db, portfolio_id, current_user)

    return fetch_assets(

        db,

        portfolio_id

    )





@router.put(

    "/{asset_id}",

    response_model=AssetResponse

)

def update_existing_asset(

    asset_id: int,

    asset: AssetUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    get_owned_asset(db, asset_id, current_user)

    updated = modify_asset(

        db,

        asset_id,

        asset

    )



    if updated is None:

        raise HTTPException(

            status_code=404,

            detail="Asset not found",

        )



    return updated





@router.delete("/{asset_id}")

def delete_existing_asset(

    asset_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    get_owned_asset(db, asset_id, current_user)

    remove_asset(

        db,

        asset_id

    )



    return {

        "message": "Asset deleted successfully"

    }

