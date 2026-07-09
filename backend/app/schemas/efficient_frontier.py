from pydantic import BaseModel


class FrontierPoint(BaseModel):
    risk: float
    return_: float


class EfficientFrontierResponse(BaseModel):
    frontier: list[dict]