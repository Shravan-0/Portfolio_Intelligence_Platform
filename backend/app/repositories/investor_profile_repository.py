from fastapi import HTTPException

from app.models.investor_profile import (
    InvestorProfile
)


def create_profile(
    db,
    profile_data
):
    try:

        existing_profile = (
            db.query(InvestorProfile)
            .filter(
                InvestorProfile.user_id
                == profile_data.user_id
            )
            .first()
        )

        if existing_profile:

            existing_profile.age = (
                profile_data.age
            )

            existing_profile.annual_income = (
                profile_data.annual_income
            )

            existing_profile.investment_horizon = (
                profile_data.investment_horizon
            )

            existing_profile.target_amount = (
                profile_data.target_amount
            )

            existing_profile.risk_tolerance = (
                profile_data.risk_tolerance
            )

            db.commit()

            db.refresh(
                existing_profile
            )

            return existing_profile

        profile = InvestorProfile(
            user_id=profile_data.user_id,
            age=profile_data.age,
            annual_income=profile_data.annual_income,
            investment_horizon=profile_data.investment_horizon,
            target_amount=profile_data.target_amount,
            risk_tolerance=profile_data.risk_tolerance
        )

        db.add(profile)

        db.commit()

        db.refresh(profile)

        return profile

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

def get_profile_by_id(
    db,
    profile_id
):
    try:

        return (
            db.query(InvestorProfile)
            .filter(
                InvestorProfile.id
                == profile_id
            )
            .first()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


def get_all_profiles(db):
    try:

        return (
            db.query(
                InvestorProfile
            ).all()
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


def update_profile(
    db,
    profile_id,
    profile_data
):
    try:

        profile = (
            db.query(InvestorProfile)
            .filter(
                InvestorProfile.id
                == profile_id
            )
            .first()
        )

        if not profile:
            return None

        profile.user_id = (
            profile_data.user_id
        )

        profile.age = (
            profile_data.age
        )

        profile.annual_income = (
            profile_data.annual_income
        )

        profile.investment_horizon = (
            profile_data.investment_horizon
        )

        profile.target_amount = (
            profile_data.target_amount
        )

        profile.risk_tolerance = (
            profile_data.risk_tolerance
        )

        db.commit()
        db.refresh(profile)

        return profile

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )