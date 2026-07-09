from datetime import date

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)

class GoalProbabilityRequest(BaseModel):
    current_value: float = Field(
        ...,
        ge=0,
        le=1_000_000_000
    )

    monthly_contribution: float = Field(
        ...,
        ge=0,
        le=10_000_000
    )

    expected_return: float = Field(..., ge=-50, le=100)

    volatility: float = Field(..., ge=0, le=100)

    years: int = Field(
        ...,
        gt=0,
        le=60
    )

    target_amount: float = Field(
        ...,
        gt=0,
        le=1_000_000_000
    )

    simulations: int = Field(
        1000,
        ge=100,
        le=5000
    )

class GoalProbabilityResponse(BaseModel):
    probability: float


class GoalBase(BaseModel):

    user_id: int

    goal_type: str

    goal_name: str | None = None

    target_amount: float = Field(
        ...,
        gt=0
    )

    target_date: date

    current_amount: float = Field(
        ...,
        ge=0
    )

    monthly_contribution: float = Field(
        ...,
        ge=0
    )

    annual_income: float = Field(
        ...,
        ge=0
    )

class GoalCreate(GoalBase):

    @field_validator("target_date")
    @classmethod
    def validate_target_date(
        cls,
        value,
    ):
        today = date.today()

        minimum_date = date(
            today.year,
            today.month,
            1
        )

        if value < minimum_date:
            raise ValueError(
                "Target date cannot be before the current month"
            )

        return value


class GoalUpdate(BaseModel):
    goal_type: str | None = None

    goal_name: str | None = None

    target_amount: float | None = Field(
        None,
        gt=0
    )

    target_date: date | None = None

    current_amount: float | None = Field(
        None,
        ge=0
    )

    monthly_contribution: float | None = Field(
        None,
        ge=0
    )

    annual_income: float | None = Field(
        None,
        ge=0
    )

    @field_validator("target_date")
    @classmethod
    def validate_target_date(
        cls,
        value,
    ):
        if value is None:
            return value

        today = date.today()

        minimum_date = date(
            today.year,
            today.month,
            1
        )

        if value < minimum_date:
            raise ValueError(
                "Target date cannot be before the current month"
            )

        return value


class GoalResponse(GoalBase):
    id: int

    remaining_amount: float | None = None
    progress_percent: float | None = None
    success_probability: float | None = None
    estimated_future_value: float | None = None
    remaining_gap: float | None = None

    class Config:
        from_attributes = True