from sqlalchemy.orm import Session

from app.models.portfolio_asset import PortfolioAsset


def calculate_total_value(assets):
    return sum(
        float(asset.amount_invested or 0)
        for asset in assets
    )


def calculate_asset_count(assets):
    return len(assets)


def get_largest_asset(assets):
    return max(
        assets,
        key=lambda asset: float(asset.amount_invested or 0)
    )





def calculate_concentration_level(
    largest_weight
):
    if largest_weight >= 50:
        return "High"
    elif largest_weight >= 30:
        return "Medium"
    return "Low"


def calculate_hhi_score(assets):
    return (
        sum(
            (
                asset.allocation_percent / 100
            ) ** 2
            for asset in assets
        ) * 10000
    )





def get_health_rating(
    health_score
):
    if health_score >= 80:
        return "Excellent"
    elif health_score >= 60:
        return "Good"
    elif health_score >= 40:
        return "Fair"
    return "Poor"


CORRELATION_TABLE = {
    ("Stock", "Stock"): 0.80,
    ("Stock", "ETF"): 0.80,
    ("Stock", "Mutual Fund"): 0.75,
    ("Stock", "Bond"): 0.25,
    ("Stock", "Crypto"): 0.20,

    ("ETF", "ETF"): 0.90,
    ("ETF", "Mutual Fund"): 0.85,
    ("ETF", "Bond"): 0.30,
    ("ETF", "Crypto"): 0.20,

    ("Mutual Fund", "Mutual Fund"): 0.85,
    ("Mutual Fund", "Bond"): 0.30,
    ("Mutual Fund", "Crypto"): 0.20,

    ("Bond", "Bond"): 0.90,
    ("Bond", "Crypto"): 0.10,

    ("Crypto", "Crypto"): 0.60,
}


def _get_correlation(type1: str, type2: str):
    if type1 == type2:
        return 1.00

    return CORRELATION_TABLE.get(
        (type1, type2),
        CORRELATION_TABLE.get(
            (type2, type1),
            0.30
        )
    )


def get_correlation_matrix(
    db: Session,
    portfolio_id: int,
):
    assets = (
        db.query(PortfolioAsset)
        .filter(
            PortfolioAsset.portfolio_id == portfolio_id
        )
        .all()
    )

    if len(assets) < 2:
        return {
            "matrix": {}
        }

    asset_types = []

    for asset in assets:
        if asset.asset_type not in asset_types:
            asset_types.append(asset.asset_type)

    matrix = {}

    for type1 in asset_types:

        matrix[type1] = {}

        for type2 in asset_types:

            matrix[type1][type2] = round(
                _get_correlation(
                    type1,
                    type2,
                ),
                2,
            )

    return {
        "matrix": matrix
    }   