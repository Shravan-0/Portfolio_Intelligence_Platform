from fastapi import HTTPException    
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.auth.dependencies import (
    get_current_user,
    get_owned_profile,
    verify_user_ownership,
)
from app.database.dependencies import get_db
from app.models.user import User

from app.schemas.investor_profile_schema import (
    InvestorProfileCreate,
    InvestorProfileResponse
)

from app.services.investor_profile_service import (
    create_investor_profile,
    get_investor_profile,
    get_profiles,
    update_investor_profile
)

router = APIRouter(
    prefix="/profiles",
    tags=["Investor Profiles"]
)

@router.post(
    "/",
    response_model=InvestorProfileResponse
)
def create_profile(
    profile: InvestorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_user_ownership(profile.user_id, current_user)
    return create_investor_profile(db, profile)


@router.get("/{profile_id}", response_model=InvestorProfileResponse)
def get_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_profile(db, profile_id, current_user)
    profile = get_investor_profile(db, profile_id)

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile

@router.get(
    "/",
    response_model=List[InvestorProfileResponse]
)
def get_all_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profiles = get_profiles(db)
    return [
        profile
        for profile in profiles
        if profile.user_id == current_user.id
    ]

@router.put(
    "/{profile_id}",
    response_model=InvestorProfileResponse
)
def update_profile_endpoint(
    profile_id: int,
    profile: InvestorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_profile(db, profile_id, current_user)
    verify_user_ownership(profile.user_id, current_user)

    updated_profile = (
        update_investor_profile(
            db,
            profile_id,
            profile
        )
    )

    if updated_profile is None:

        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return updated_profile
