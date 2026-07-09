from app.services.monte_carlo import run_monte_carlo


def calculate_goal_probability(
    initial_amount: float,
    monthly_contribution: float,
    expected_return: float,
    volatility: float,
    years: int,
    target_amount: float,
    simulations: int = 1000
):
    result = run_monte_carlo(
        initial_amount=initial_amount,
        monthly_contribution=monthly_contribution,
        expected_return=expected_return,
        volatility=volatility,
        years=years,
        simulations=simulations
    )

    final_values = result["final_values"]

    successful_runs = sum(
        1 for value in final_values
        if value >= target_amount
    )

    probability = (
        successful_runs / len(final_values)
    ) * 100

    return round(probability, 2)


def populate_goal_metrics(db, goal):
    from datetime import date
    from app.models.portfolio import Portfolio
    from app.models.portfolio_asset import PortfolioAsset
    from app.models.investor_profile import InvestorProfile
    from app.risk.service import calculate_asset_allocation, calculate_allocation_risk_metrics
    from app.optimization.service import determine_risk_profile

    target_amount = goal.target_amount
    current_amount = goal.current_amount
    monthly_contribution = goal.monthly_contribution

    # 1. Remaining Amount & Progress %
    remaining_amount = max(0.0, target_amount - current_amount)
    progress_percent = min(100.0, (current_amount / target_amount) * 100.0) if target_amount > 0 else 0.0

    # 2. Determine Expected Return & Volatility
    expected_return = 12.0
    volatility = 15.0

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == goal.user_id).first()
    if portfolio:
        assets = db.query(PortfolioAsset).filter(PortfolioAsset.portfolio_id == portfolio.id).all()
        if assets:
            allocation = calculate_asset_allocation(assets)
            metrics = calculate_allocation_risk_metrics(allocation)
            expected_return = metrics.get("expected_return", expected_return)
            volatility = metrics.get("volatility", volatility)
        else:
            profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == goal.user_id).first()
            if profile:
                risk_profile = determine_risk_profile(profile)
                metrics = {
                    "Conservative": {"expected_return": 8.0, "volatility": 8.0},
                    "Moderate": {"expected_return": 10.0, "volatility": 12.0},
                    "Growth": {"expected_return": 12.0, "volatility": 15.0},
                    "Aggressive": {"expected_return": 14.0, "volatility": 18.0},
                }.get(risk_profile, {"expected_return": 12.0, "volatility": 15.0})
                expected_return = metrics["expected_return"]
                volatility = metrics["volatility"]
    else:
        profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == goal.user_id).first()
        if profile:
            risk_profile = determine_risk_profile(profile)
            metrics = {
                "Conservative": {"expected_return": 8.0, "volatility": 8.0},
                "Moderate": {"expected_return": 10.0, "volatility": 12.0},
                "Growth": {"expected_return": 12.0, "volatility": 15.0},
                "Aggressive": {"expected_return": 14.0, "volatility": 18.0},
            }.get(risk_profile, {"expected_return": 12.0, "volatility": 15.0})
            expected_return = metrics["expected_return"]
            volatility = metrics["volatility"]

    # 3. Calculate Years remaining
    today = date.today()
    years = max(1, goal.target_date.year - today.year)

    # 4. Monte Carlo Probability
    prob = calculate_goal_probability(
        initial_amount=max(0.0, current_amount),
        monthly_contribution=max(0.0, monthly_contribution),
        expected_return=expected_return,
        volatility=volatility,
        years=years,
        target_amount=target_amount,
        simulations=1000
    )

    # 5. Estimated Future Value (Median value)
    result = run_monte_carlo(
        initial_amount=max(0.0, current_amount),
        monthly_contribution=max(0.0, monthly_contribution),
        expected_return=expected_return,
        volatility=volatility,
        years=years,
        simulations=1000
    )
    estimated_future_value = result["median_value"]
    remaining_gap = max(0.0, target_amount - estimated_future_value)

    return {
        "remaining_amount": round(remaining_amount, 2),
        "progress_percent": round(progress_percent, 2),
        "success_probability": prob,
        "estimated_future_value": estimated_future_value,
        "remaining_gap": round(remaining_gap, 2)
    }