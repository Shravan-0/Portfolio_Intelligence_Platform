# StratFolio – Portfolio Intelligence & Risk Analytics Platform
## Product Requirements Document (PRD)

---

### 1. Product Background
In institutional wealth management, global markets and risk analysts require rigorous quantitative tools to optimize returns and manage portfolio downside risk. Standard retail investment trackers are inadequate, failing to capture complex risk measures (e.g., CVaR), style tilts (e.g., Fama-French exposures), or probabilistic multi-asset projections (e.g., Monte Carlo simulations). StratFolio is designed as a enterprise-grade analytics platform, consolidating modern portfolio theory (MPT) optimization, stress testing, and factor analytics into a single responsive web interface. This PRD outlines the requirements for building the platform core and advanced analytical engines.

---

### 2. Product Objectives
* **Unified Quant Workbench**: Provide analysts with a centralized suite for portfolio management, eliminating the need to combine multiple disparate tools.
* **Risk Quantification & Mitigation**: Enable analysts to calculate Value-at-Risk (VaR) and evaluate portfolio drawdowns during historical macro shocks.
* **Automated Asset Allocation**: Utilize modern quantitative techniques to construct optimal portfolios aligned with user-defined constraints.
* **Demystify Complex Analytics**: Deliver an explainability layer that translates abstract statistical outputs (such as factor loadings and variance-covariance matrices) into plain-English summaries.

---

### 3. User Personas

#### Persona 1: Robert (Risk Analyst)
* **Background**: Risk Manager at a large asset management firm.
* **Needs**: Needs to run daily risk checks on portfolios, calculate tail risk under normal and stressed conditions, and ensure portfolio limits are not breached.
* **Pain Points**: Spends too much time downloading historical quotes, running manual scripts, and formatting spreadsheets to calculate VaR/CVaR.

#### Persona 2: Clara (Portfolio Analytics Analyst)
* **Background**: Quant Strategist designing model portfolios for institutional clients.
* **Needs**: Needs to construct optimal asset mixes, check style exposures against indices, and identify unintended factor tilts.
* **Pain Points**: Standard tools only show sector exposures, lacking statistical multi-factor regression models.

---

### 4. Functional Requirements

For each feature implemented in the StratFolio platform, the specification below details inputs, logic, outputs, and business value.

#### 4.1 Investor Profiling
* **Feature Name**: Investor Profiling Engine
* **Description**: Gathers qualitative and quantitative investor characteristics to establish risk boundaries and investment horizons.
* **Inputs**:
  - Investor Age, Investment Horizon (years).
  - Financial Goals (target wealth, target date).
  - Risk Tolerance Level (Low, Medium, High) / Questionnaire Responses.
  - Maximum Drawdown Tolerance (%).
* **Processing Logic**:
  - Process survey answers to calculate a numerical risk score (Scale of 1-100).
  - Map the risk score to target volatility bounds ($\sigma_{target}$) and maximum drawdown limits.
* **Outputs**:
  - Investor Profile Object containing calculated risk score, target volatility, and risk category (Conservative, Moderate, Aggressive).
* **Business Value**: Standardizes the portfolio customization workflow, ensuring all constructed portfolios align with the investor's structural risk tolerances.

#### 4.2 Portfolio Construction Engine
* **Feature Name**: Portfolio Construction Engine
* **Description**: Allows creation, modification, and evaluation of multi-asset portfolios containing global equity and fixed-income assets.
* **Inputs**:
  - List of Asset Tickers (e.g., `["AAPL", "MSFT", "TLT"]`).
  - Allocation Weights (e.g., `[0.40, 0.40, 0.20]`) or transaction histories.
  - Date Range for historical baseline.
* **Processing Logic**:
  - Ingest holdings and historical data via the backend market data downloader.
  - Calculate daily historical returns, mean returns, and standard deviations.
* **Outputs**:
  - Initialized portfolio metadata, historical daily price vectors, and aggregated weighted historical return series.
* **Business Value**: Serves as the bedrock data layer for all downstream calculations and risk analytics.

#### 4.3 Constraint Engine
* **Feature Name**: Constraint Engine
* **Description**: Enforces allocation rules and boundary conditions during portfolio construction and mathematical optimization.
* **Inputs**:
  - Optimization bounds (e.g., asset weight limits $0.05 \le w_i \le 0.50$).
  - Target exposure restrictions (e.g., Maximum Sector Weight: Tech $\le$ 30%).
  - Budget constraints (e.g., sum of weights must equal 100%).
* **Processing Logic**:
  - Formulate mathematical boundaries as inequality and equality constraints ($G w \le h$ and $A w = b$) to feed into the optimization solver.
  - Validate portfolios against constraints, outputting warning flags for any violations.
* **Outputs**:
  - Constraint status validation report (Passed/Failed with violation details).
  - Bound matrix inputs for mathematical solvers.
* **Business Value**: Prevents compliance breaches and ensures portfolios conform to institutional mandate rules.

#### 4.4 Risk Engine
* **Feature Name**: Core Risk Engine
* **Description**: Computes key volatility and tail-risk metrics based on historical returns data.
* **Inputs**:
  - Portfolio returns series.
  - Risk-free rate ($R_f$) (defaulting to 3-month US Treasury yield).
  - Target confidence interval $\alpha$ for VaR/CVaR (e.g., 95%, 99%).
* **Processing Logic**:
  - Compute annualized return, annualized volatility, Sharpe Ratio, Sortino Ratio (using downside deviation), and Max Drawdown.
  - Compute Parametric VaR (normal distribution assumption) and Historical Simulation VaR.
  - Compute Historical Conditional VaR (CVaR) as the mean of returns below the historical VaR cutoff.
* **Outputs**:
  - JSON structure containing metrics: Annual Return, Volatility, Sharpe, Sortino, Max Drawdown, 95%/99% VaR, and 95%/99% CVaR.
* **Business Value**: Quantifies downside risk and tail risk exposure, protecting capital from extreme market drawdowns.

#### 4.5 Stress Testing
* **Feature Name**: Stress Testing Module
* **Description**: Simulates portfolio performance under historical crisis scenarios and hypothetical market shocks.
* **Inputs**:
  - Portfolio weights and historical asset returns.
  - Stress scenario identifier (e.g., `2008_LEHMAN`, `2020_COVID`).
  - User-defined hypothetical shocks (e.g., "Equity Market drops 20%").
* **Processing Logic**:
  - **Historical Replay**: Slice the exact date ranges of past crises (e.g., Sept 2008 to Mar 2009) to compute the portfolio's cumulative drawdown.
  - **Factor Shock**: Use historical beta relationships to estimate portfolio impact when the benchmark index drops by a user-defined magnitude.
* **Outputs**:
  - Portfolio performance metrics during the stress period compared to a market benchmark.
* **Business Value**: Helps analysts visualize how a portfolio behaves in high-stress, low-liquidity environments before allocating capital.

#### 4.6 Explainability Layer
* **Feature Name**: Explainability Layer
* **Description**: Automatically translates complex statistical risk metrics and optimization allocations into intuitive, readable narratives.
* **Inputs**:
  - Raw outputs from Risk Engine, Optimizer, and Factor Regression modules.
* **Processing Logic**:
  - Parse quantitative outputs using threshold logic (e.g., R-squared > 0.85 means "highly explained by standard factors").
  - Generate structured natural language strings highlighting core risks, performance drivers, and optimization rationale.
* **Outputs**:
  - Textual narrative summarizing portfolio status, risk exposures, and recommendations.
* **Business Value**: Bridges the gap between complex quantitative modeling and client-facing advisory conversations.

#### 4.7 Backtesting
* **Feature Name**: Historical Portfolio Backtesting Engine
* **Description**: Evaluates the historical growth of a portfolio over time based on initial assets, weights, and rebalancing parameters.
* **Inputs**:
  - Tickers, weights, start/end dates, initial capital (e.g., $10,000).
  - Rebalancing frequency (e.g., Monthly, Quarterly, None).
* **Processing Logic**:
  - Calculate daily index values by compounding returns daily.
  - On rebalancing dates, adjust holdings back to target weights, accounting for differences in individual asset growth rates.
* **Outputs**:
  - Time series of portfolio value over the backtest window.
  - Metrics comparison: Backtested portfolio vs. Benchmark Index.
* **Business Value**: Provides empirical proof of concept, showing how an investment strategy would have performed historically.

#### 4.8 Monte Carlo Simulation
* **Feature Name**: Monte Carlo Simulation Engine
* **Description**: Simulates future asset paths to project the distribution of portfolio values.
* **Inputs**:
  - Portfolio asset weights, expected asset returns, and covariance matrix.
  - Initial wealth, simulation horizon (years), and number of paths (e.g., 10,000).
* **Processing Logic**:
  - Apply Cholesky decomposition on the covariance matrix.
  - Generate correlated standard normal variables.
  - Simulates daily/monthly returns using Geometric Brownian Motion (GBM).
  - Compile the asset price paths to construct portfolio wealth paths.
* **Outputs**:
  - Matrix of portfolio values across all simulation paths over the timeline.
  - Percentile paths (10th, 50th, 90th percentiles).
* **Business Value**: Establishes a probabilistic framework for future wealth, helping users plan around range outcomes rather than single averages.

#### 4.9 Goal Success Probability
* **Feature Name**: Goal Success Probability Calculator
* **Description**: Estimates the likelihood of achieving target wealth goals within a specific timeframe.
* **Inputs**:
  - Target Wealth (e.g., $1,000,000), Target Horizon (years).
  - Initial wealth, periodic contributions (monthly/annual).
  - Output matrix from the Monte Carlo simulation engine.
* **Processing Logic**:
  - For each simulated path, calculate the ending wealth, accounting for compounding returns and periodic contributions.
  - Compute the fraction of paths where the ending wealth exceeds the target wealth goal.
* **Outputs**:
  - Percentage probability of success ($0\%$ to $100\%$).
* **Business Value**: Gives advisors an actionable metric to align client savings behaviors and portfolio risk limits with their ultimate targets.

#### 4.10 Efficient Frontier
* **Feature Name**: Markowitz Efficient Frontier Generator
* **Description**: Calculates the optimal set of portfolios offering the highest return for a given level of risk.
* **Inputs**:
  - Selected asset tickers, date range.
  - Constraint bounds (e.g., long-only).
* **Processing Logic**:
  - Estimate historical mean returns and covariance matrix.
  - Solve quadratic optimization problems to find the weights that minimize variance for target returns.
  - Isolate the Maximum Sharpe Ratio portfolio and the Minimum Volatility portfolio.
* **Outputs**:
  - Coordinates (volatility, return) of portfolios along the frontier curve.
  - Ticker weights for optimal portfolios.
* **Business Value**: Enables asset managers to maximize diversification benefits and construct mathematically optimal portfolios.

#### 4.11 Factor Exposure Analysis (Fama-French)
* **Feature Name**: Fama-French Multi-Factor Regression Engine
* **Description**: Performs statistical attribution of portfolio returns against systematic style factors.
* **Inputs**:
  - Historical portfolio returns.
  - Fama-French factor returns (Mkt-RF, SMB, HML, RF).
* **Processing Logic**:
  - Align date indexes of factor datasets with portfolio returns.
  - Compute excess portfolio returns ($R_p - R_f$).
  - Execute multivariate OLS regression to estimate alpha, market beta, SMB beta, and HML beta.
* **Outputs**:
  - Factor loadings (coefficients), t-statistics, p-values, and R-squared values.
* **Business Value**: Exposes hidden risk exposures, helping analysts ensure the portfolio matches its intended style tilt (e.g. avoiding unintended growth/value tilts).

#### 4.12 Asset Correlation Matrix
* **Feature Name**: Interactive Asset Correlation Engine
* **Description**: Calculates and visualizes the linear correlation between portfolio assets.
* **Inputs**:
  - Historical daily prices for portfolio assets over a designated window.
* **Processing Logic**:
  - Compute daily asset returns.
  - Calculate Pearson correlation coefficients:
    $$\rho_{X,Y} = \frac{Cov(X,Y)}{\sigma_X \sigma_Y}$$
* **Outputs**:
  - $N \times N$ correlation matrix showing coefficients between $-1.0$ and $+1.0$.
* **Business Value**: Allows analysts to quickly assess portfolio diversification, identifying assets that are highly correlated and could amplify risk.

---

### 5. Non-Functional Requirements

* **Performance & Latency**:
  - Core risk metrics must calculate in < 500ms.
  - Monte Carlo simulations (10,000 iterations, 10-year horizon) must complete in < 4.0 seconds.
* **Scalability**:
  - The API must handle simultaneous optimization tasks asynchronously.
  - Relational queries (portfolios retrieval) must resolve in < 100ms.
* **Reliability & Cache**:
  - Market quotes from yfinance must be cached in Redis with a 24-hour expiration window.
* **Security & Compliance**:
  - JWT tokens must have a 1-hour expiration window.
  - Relational database connections must be pooled and encrypted.

---

### 6. User Stories

* **US-1**: As a Portfolio Manager, I want to define asset weight bounds (e.g. maximum 10% in any individual stock) so that the optimization engine respects our fund limits.
* **US-2**: As a Risk Analyst, I want to calculate 1-day 99% Value-at-Risk so that I can monitor compliance with our internal tail-risk limits.
* **US-3**: As a Wealth Advisor, I want to input my client's retirement target ($2M in 25 years) and see the exact probability of achieving it based on their portfolio allocation.

---

### 7. Acceptance Criteria

* **AC-1 (Optimization)**: The optimizer must output weights that sum to 100% and strictly respect all bounds defined in the Constraint Engine.
* **AC-2 (Simulations)**: The Monte Carlo simulator must incorporate the correlation structure defined by the Cholesky decomposition of the asset covariance matrix.
* **AC-3 (Factor Analysis)**: Factor exposure calculations must return the regression $R^2$, and p-values for all regression coefficients.

---

### 8. Business Rules
* **Sum of Weights**: A portfolio's asset allocations must sum to exactly 1.0 (100%) prior to performing risk engine or backtesting calculations.
* **Asset Minimum**: A portfolio must consist of at least two assets to calculate correlation matrices, efficient frontiers, or optimized allocations.
* **Date Range Matching**: Historical computations require at least 126 trading days (approx. 6 months) of aligned historical price data.

---

### 9. Success Metrics
* **Core Latency**: Average API response time for core analytics remains under 1 second.
* **Model Precision**: Backtest results match historical asset performances with zero drift.
* **User Engagement**: Front-office analysts require less than 2 minutes to generate a comprehensive risk and goal simulation report.

---

### 10. Assumptions
* **Data Availability**: Upstream daily historical prices are continuously accessible through the market data API (e.g., yfinance).
* **Normality in Parametric VaR**: Parametric VaR assumes asset returns follow a standard normal distribution, which is used as a baseline approximation.
* **Constant Weights**: Goal probability simulations assume portfolio asset allocations are held constant or rebalanced back to target weights periodically.

---

### 11. Constraints
* **Upstream Rate Limiting**: The platform is dependent on external provider APIs (yfinance), necessitating a robust local caching system to prevent IP rate-limiting.
* **Single Thread Execution**: High-iteration Monte Carlo simulations can block CPU event loops; backend execution must run in separate worker processes or thread pools.

---

### 12. Future Enhancements
* **Copula Simulations**: Implement Student-t Copulas to capture heavy tail risks in Monte Carlo simulations, moving beyond standard Gaussian limits.
* **Multi-asset Derivative Pricing**: Include options and structured products within the portfolio construction engine, modeling non-linear risk profiles.
* **Transaction Costs & Slippage**: Incorporate execution slippage and trade commissions into the historical backtesting engine.
