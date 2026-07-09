from pydantic import BaseModel

class PortfolioCreate(BaseModel):
    name: str
    user_id: int

class PortfolioResponse(BaseModel):
    id: int
    name: str
    user_id: int
    total_value: float

    class Config:
        from_attributes = True