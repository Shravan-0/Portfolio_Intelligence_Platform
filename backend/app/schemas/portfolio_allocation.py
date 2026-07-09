from pydantic import BaseModel

class AllocationItem(BaseModel):
    asset_type: str
    total_allocation: float
