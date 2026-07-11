from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.portfolio_asset import PortfolioAsset
from app.models.portfolio import Portfolio
from app.performance.service import calculate_live_asset_valuations
import logging

logger = logging.getLogger(__name__)


def _live_valuations(db: Session, portfolio_id: int):
    valuations = calculate_live_asset_valuations(db, portfolio_id)
    total_value = sum(item["market_value"] for item in valuations)
    return valuations, total_value


def _portfolio_weight(valuation, total_value: float) -> float:
    return (valuation["market_value"] / total_value) * 100 if total_value > 0 else 0.0


def calculate_summary(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return {
                "portfolio_id": portfolio_id,
                "asset_count": 0,
                "total_value": 0.0,
                "largest_holding": "None",
                "largest_allocation": 0.0
            }
        
        valuations, total_value = _live_valuations(db, portfolio_id)
        asset_count = len(assets)
        largest_valuation = max(valuations, key=lambda item: item["market_value"])
        
        return {
            "portfolio_id": portfolio_id,
            "asset_count": asset_count,
            "total_value": total_value,
            "largest_holding": largest_valuation["asset"].ticker,
            "largest_allocation": _portfolio_weight(largest_valuation, total_value)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_dashboard(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return {
                "portfolio_id": portfolio_id,
                "asset_count": 0,
                "total_value": 0.0,
                "largest_holding": "None",
                "largest_allocation": 0.0,
                "average_allocation": 0.0
            }
        
        valuations, total_value = _live_valuations(db, portfolio_id)
        asset_count = len(assets)
        largest_valuation = max(valuations, key=lambda item: item["market_value"])
        average_allocation = sum(
            _portfolio_weight(valuation, total_value) for valuation in valuations
        ) / asset_count
        
        return {
            "portfolio_id": portfolio_id,
            "asset_count": asset_count,
            "total_value": total_value,
            "largest_holding": largest_valuation["asset"].ticker,
            "largest_allocation": _portfolio_weight(largest_valuation, total_value),
            "average_allocation": round(average_allocation, 2)
        }
    except Exception:
     logger.exception("Failed to calculate portfolio analytics")

     raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )


def calculate_allocation_breakdown(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return []
        
        valuations, total_value = _live_valuations(db, portfolio_id)
        allocation_map = {}
        for valuation in valuations:
            asset = valuation["asset"]
            allocation_map.setdefault(asset.asset_type, 0.0)
            allocation_map[asset.asset_type] += _portfolio_weight(valuation, total_value)
            
        return [
            {
                "asset_type": asset_type,
                "total_allocation": allocation
            }
            for asset_type, allocation in allocation_map.items()
        ]
    except Exception:
      logger.exception("Failed to calculate portfolio analytics")

      raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )

def calculate_risk_metrics(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return {
                "diversification_score": 0.0,
                "concentration_risk": "Low",
                "largest_position": "None",
                "largest_position_weight": 0.0
            }
            
        valuations, total_value = _live_valuations(db, portfolio_id)
        largest_valuation = max(valuations, key=lambda item: item["market_value"])
        from app.risk.service import calculate_diversification
        div_result = calculate_diversification(assets)
        diversification_score = float(div_result.get("score", 0.0))
        largest_weight = _portfolio_weight(largest_valuation, total_value)
        
        if largest_weight >= 50:
            risk = "High"
        elif largest_weight >= 30:
            risk = "Medium"
        else:
            risk = "Low"
            
        return {
            "diversification_score": diversification_score,
            "concentration_risk": risk,
            "largest_position": largest_valuation["asset"].ticker,
            "largest_position_weight": largest_weight
        }
    except Exception:
       logger.exception("Failed to calculate portfolio analytics")

       raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )


def calculate_hhi(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return {
                "hhi_score": 0.0,
                "concentration_level": "N/A"
            }
            
        hhi_score = sum((asset.allocation_percent / 100.0) ** 2 for asset in assets) * 10000.0
        
        if hhi_score < 1500:
            level = "Diversified"
        elif hhi_score < 2500:
            level = "Moderate"
        else:
            level = "Concentrated"
            
        return {
            "hhi_score": round(hhi_score, 2),
            "concentration_level": level
        }
    except Exception:
       logger.exception("Failed to calculate portfolio analytics")

       raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )

def calculate_exposure(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return []
            
        valuations, total_value = _live_valuations(db, portfolio_id)
        exposure_map = {}
        for valuation in valuations:
            asset = valuation["asset"]
            exposure_map.setdefault(asset.asset_type, 0.0)
            exposure_map[asset.asset_type] += _portfolio_weight(valuation, total_value)
            
        risk_table = {
            "Stock": "Medium",
            "ETF": "Low",
            "Bond": "Low",
            "Crypto": "High",
            "Commodity": "Medium"
        }
        
        return [
            {
                "asset_type": asset_type,
                "allocation": allocation,
                "risk_weight": risk_table.get(asset_type, "Unknown")
            }
            for asset_type, allocation in exposure_map.items()
        ]
    except Exception:
       logger.exception("Failed to calculate portfolio analytics")

       raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )
