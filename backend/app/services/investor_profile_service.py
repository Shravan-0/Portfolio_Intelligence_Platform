from app.repositories.investor_profile_repository import (
    create_profile,
    get_profile_by_id,
    get_all_profiles,
    update_profile
)
def create_investor_profile(db, profile_data):
    return create_profile(db, profile_data)


def get_investor_profile(db, profile_id):
    return get_profile_by_id(db, profile_id)


def get_profiles(db):
    return get_all_profiles(db)

def update_investor_profile(
    db,
    profile_id,
    profile_data
):
    
    return update_profile(
        db,
        profile_id,
        profile_data
    )