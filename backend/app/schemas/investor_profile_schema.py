from pydantic import BaseModel, Field


class InvestorProfileCreate(BaseModel):
    user_id: int

    age: int = Field(
        ...,
        ge=18,
        le=100
    )

    annual_income: float = Field(
        ...,
        gt=0
    )

    investment_horizon: int = Field(
        ...,
        gt=0,
        le=50
    )

    target_amount: float = Field(
        ...,
        gt=0
    )

    risk_tolerance: str


class InvestorProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    annual_income: float
    investment_horizon: int
    target_amount: float
    risk_tolerance: str

    class Config:
        from_attributes = True