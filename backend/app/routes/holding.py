from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.holding import Holding
from app.schemas.holding import HoldingCreate, HoldingResponse

router = APIRouter(
    prefix="/holdings",
    tags=["Holdings"]
)


@router.post("/", response_model=HoldingResponse)
def create_holding(
    holding: HoldingCreate,
    db: Session = Depends(get_db)
):
    db_holding = Holding(**holding.model_dump())

    db.add(db_holding)
    db.commit()
    db.refresh(db_holding)

    return db_holding


@router.get("/", response_model=list[HoldingResponse])
def get_all_holdings(
    db: Session = Depends(get_db)
):
    return db.query(Holding).all()


@router.get("/{portfolio_id}",
            response_model=list[HoldingResponse])
def get_portfolio_holdings(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(Holding)
        .filter(Holding.portfolio_id == portfolio_id)
        .all()
    )