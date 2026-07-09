import numpy as np

def run_monte_carlo(
    initial_amount: float,
    monthly_contribution: float,
    expected_return: float,
    volatility: float,
    years: int,
    simulations: int = 1000
):
    # Convert percentages to decimals
    annual_return = expected_return / 100
    annual_volatility = volatility / 100

    # Total investment period in months
    months = years * 12

    # Store final portfolio value from each simulation
    final_values = []

    # Run simulations
    for _ in range(simulations):

        portfolio_value = initial_amount

        # Simulate month-by-month growth
        for _ in range(months):

            monthly_return = np.random.normal(
                annual_return / 12,
                annual_volatility / np.sqrt(12)
            )

            # Add monthly SIP contribution
            portfolio_value += monthly_contribution

            # Apply portfolio growth
            portfolio_value *= (1 + monthly_return)

        # Save only the final portfolio value
        final_values.append(portfolio_value)

    # Calculate summary statistics
    median_value = float(np.median(final_values))

    best_case = float(np.percentile(final_values, 90))

    worst_case = float(np.percentile(final_values, 10))

    return {
        "median_value": round(median_value, 2),
        "best_case": round(best_case, 2),
        "worst_case": round(worst_case, 2),
        "final_values": final_values
    }