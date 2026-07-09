from pydantic import BaseModel

class AssetExposureItem(BaseModel):
    asset_type: str
    allocation: float
    risk_weight: str