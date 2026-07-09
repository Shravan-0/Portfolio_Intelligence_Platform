from pydantic import BaseModel


class FactorExposureItem(BaseModel):
    factor: str
    exposure: float


class FactorExposureResponse(BaseModel):
    exposures: list[FactorExposureItem]