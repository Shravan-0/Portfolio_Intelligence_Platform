from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_goal,
    verify_user_ownership,
)
from app.database.connection import get_db
from app.models.goal import Goal
from app.models.user import User

from app.schemas.goal import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    GoalProbabilityRequest,
    GoalProbabilityResponse
)

from app.services.goal_probability import (
    calculate_goal_probability,
    populate_goal_metrics
)

router = APIRouter()


@router.post(
    "/goal-probability",
    response_model=GoalProbabilityResponse
)
def get_goal_probability(
    request: GoalProbabilityRequest,
    current_user: User = Depends(get_current_user),
):
    probability = calculate_goal_probability(
        initial_amount=request.current_value,
        monthly_contribution=request.monthly_contribution,
        expected_return=request.expected_return,
        volatility=request.volatility,
        years=request.years,
        target_amount=request.target_amount,
        simulations=request.simulations
    )

    return GoalProbabilityResponse(
        probability=probability
    )


@router.post(
    "/goals",
    response_model=GoalResponse
)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_user_ownership(goal.user_id, current_user)

    existing_goal = (
        db.query(Goal)
        .filter(
            Goal.user_id == goal.user_id
        )
        .first()
    )

    if existing_goal:

        existing_goal.goal_type = goal.goal_type

        existing_goal.goal_name = goal.goal_name

        existing_goal.target_amount = goal.target_amount

        existing_goal.target_date = goal.target_date

        existing_goal.current_amount = goal.current_amount

        existing_goal.monthly_contribution = (
            goal.monthly_contribution
        )

        existing_goal.annual_income = goal.annual_income

        db.commit()

        db.refresh(existing_goal)

        metrics = populate_goal_metrics(db, existing_goal)
        for key, value in metrics.items():
            setattr(existing_goal, key, value)

        return existing_goal

    db_goal = Goal(
        user_id=goal.user_id,
        goal_type=goal.goal_type,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        current_amount=goal.current_amount,
        monthly_contribution=goal.monthly_contribution,
        annual_income=goal.annual_income
    )

    db.add(db_goal)

    db.commit()

    db.refresh(db_goal)

    metrics = populate_goal_metrics(db, db_goal)
    for key, value in metrics.items():
        setattr(db_goal, key, value)

    return db_goal

@router.get(
    "/goals",
    response_model=list[GoalResponse]
)
def get_all_goals(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id is None:
        return []

    verify_user_ownership(user_id, current_user)

    goal = (
        db.query(Goal)
        .filter(
            Goal.user_id == user_id
        )
        .first()
    )

    if not goal:
        return []

    metrics = populate_goal_metrics(db, goal)
    for key, value in metrics.items():
        setattr(goal, key, value)

    return [goal]


@router.get(
    "/goals/{goal_id}",
    response_model=GoalResponse
)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_owned_goal(db, goal_id, current_user)
    metrics = populate_goal_metrics(db, goal)
    for key, value in metrics.items():
        setattr(goal, key, value)
    return goal


@router.put(
    "/goals/{goal_id}",
    response_model=GoalResponse
)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_owned_goal(db, goal_id, current_user)

    for key, value in (
        goal_update
        .model_dump(exclude_unset=True)
        .items()
    ):
        setattr(
            goal,
            key,
            value
        )

    db.commit()

    db.refresh(goal)

    metrics = populate_goal_metrics(db, goal)
    for key, value in metrics.items():
        setattr(goal, key, value)

    return goal


@router.delete(
    "/goals/{goal_id}"
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = get_owned_goal(db, goal_id, current_user)

    db.delete(goal)

    db.commit()

    return {
        "detail": "Goal deleted successfully"
    }
