from pydantic import BaseModel, Field


class MonteCarloRequest(BaseModel):
    initial_amount: float = Field(..., gt=0, le=1_000_000_000)
    monthly_contribution: float = Field(..., ge=0, le=10_000_000)
    years: int = Field(..., gt=0, le=60)
    simulations: int = Field(1000, ge=100, le=5000)


class MonteCarloResponse(BaseModel):
    risk_profile: str

    expected_return: float
    volatility: float

    median_value: float
    best_case: float
    worst_case: float