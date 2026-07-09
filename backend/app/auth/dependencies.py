from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import oauth2_scheme, verify_token
from app.database.dependencies import get_db
from app.models.goal import Goal
from app.models.investor_profile import InvestorProfile
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset
from app.models.user import User

UNAUTHORIZED_DETAIL = (
    "You are not authorized to access this resource."
)


def raise_forbidden():
    raise HTTPException(
        status_code=403,
        detail=UNAUTHORIZED_DETAIL,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_token(token)

    user = (
        db.query(User)
        .filter(User.email == payload["sub"])
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    return user


def verify_user_ownership(
    resource_user_id: int,
    current_user: User,
):
    if resource_user_id != current_user.id:
        raise_forbidden()


def get_owned_profile(
    db: Session,
    profile_id: int,
    current_user: User,
) -> InvestorProfile:
    profile = (
        db.query(InvestorProfile)
        .filter(InvestorProfile.id == profile_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    verify_user_ownership(profile.user_id, current_user)

    return profile


def get_owned_portfolio(
    db: Session,
    portfolio_id: int,
    current_user: User,
) -> Portfolio:
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id)
        .first()
    )

    if not portfolio:
        raise HTTPException(
            status_code=404,
            detail="Portfolio not found",
        )

    verify_user_ownership(portfolio.user_id, current_user)

    return portfolio


def get_owned_goal(
    db: Session,
    goal_id: int,
    current_user: User,
) -> Goal:
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id)
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found",
        )

    verify_user_ownership(goal.user_id, current_user)

    return goal


def get_owned_asset(
    db: Session,
    asset_id: int,
    current_user: User,
) -> PortfolioAsset:
    asset = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    get_owned_portfolio(
        db,
        asset.portfolio_id,
        current_user,
    )

    return asset
