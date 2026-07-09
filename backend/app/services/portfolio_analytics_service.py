from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.portfolio_asset import PortfolioAsset
from app.models.portfolio import Portfolio
from app.services.analytics_service import calculate_total_value
import logging

logger = logging.getLogger(__name__)
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
        
        total_value = calculate_total_value(assets)
        asset_count = len(assets)
        largest_asset = max(assets, key=lambda asset: asset.allocation_percent)
        
        return {
            "portfolio_id": portfolio_id,
            "asset_count": asset_count,
            "total_value": total_value,
            "largest_holding": largest_asset.ticker,
            "largest_allocation": largest_asset.allocation_percent
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
        
        total_value = calculate_total_value(assets)
        asset_count = len(assets)
        largest_asset = max(assets, key=lambda asset: asset.allocation_percent)
        average_allocation = sum(asset.allocation_percent for asset in assets) / asset_count
        
        return {
            "portfolio_id": portfolio_id,
            "asset_count": asset_count,
            "total_value": total_value,
            "largest_holding": largest_asset.ticker,
            "largest_allocation": largest_asset.allocation_percent,
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
        
        allocation_map = {}
        for asset in assets:
            allocation_map.setdefault(asset.asset_type, 0.0)
            allocation_map[asset.asset_type] += asset.allocation_percent
            
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
            
        largest_asset = max(assets, key=lambda asset: asset.allocation_percent)
        asset_count = len(assets)
        diversification_score = min(asset_count * 20.0, 100.0)
        largest_weight = largest_asset.allocation_percent
        
        if largest_weight >= 50:
            risk = "High"
        elif largest_weight >= 30:
            risk = "Medium"
        else:
            risk = "Low"
            
        return {
            "diversification_score": diversification_score,
            "concentration_risk": risk,
            "largest_position": largest_asset.ticker,
            "largest_position_weight": largest_weight
        }
    except Exception:
       logger.exception("Failed to calculate portfolio analytics")

       raise HTTPException(
        status_code=500,
        detail="Failed to calculate portfolio analytics."
    )


def calculate_health_score(db: Session, portfolio_id: int):
    try:
        assets = (
            db.query(PortfolioAsset)
            .filter(PortfolioAsset.portfolio_id == portfolio_id)
            .all()
        )
        if not assets:
            return {
                "health_score": 0.0,
                "rating": "Poor",
                "diversification_score": 0.0,
                "concentration_penalty": 0.0
            }
            
        asset_count = len(assets)
        diversification_score = min(asset_count * 20.0, 100.0)
        largest_asset = max(assets, key=lambda asset: asset.allocation_percent)
        largest_weight = largest_asset.allocation_percent
        concentration_penalty = largest_weight * 0.5
        health_score = max(diversification_score - concentration_penalty, 0.0)
        
        if health_score >= 80:
            rating = "Excellent"
        elif health_score >= 60:
            rating = "Good"
        elif health_score >= 40:
            rating = "Fair"
        else:
            rating = "Poor"
            
        return {
            "health_score": round(health_score, 2),
            "rating": rating,
            "diversification_score": diversification_score,
            "concentration_penalty": round(concentration_penalty, 2)
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
            
        exposure_map = {}
        for asset in assets:
            exposure_map.setdefault(asset.asset_type, 0.0)
            exposure_map[asset.asset_type] += asset.allocation_percent
            
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