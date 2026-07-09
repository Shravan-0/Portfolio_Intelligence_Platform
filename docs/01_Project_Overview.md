# StratFolio – Portfolio Intelligence & Risk Analytics Platform
## Project Overview

---

### 1. Executive Summary
StratFolio is an institutional-grade, web-based portfolio construction and risk analytics platform. Designed to meet the analytical standards of leading financial institutions such as JPMorgan, Morgan Stanley, Goldman Sachs, and BlackRock, StratFolio bridges the gap between raw financial datasets and sophisticated quantitative decision models. The platform enables multi-asset portfolio customization, tail-risk assessment, macroeconomic stress testing, factor attribution modeling, and goal-based success simulations. By delivering these features through a reactive, containerized interface, StratFolio empowers front-office and middle-office analysts to make data-driven, risk-adjusted investment decisions.

---

### 2. Project Vision
Our vision is to build the premier open-architecture quantitative workbench for portfolio analysts. StratFolio democratizes the high-end mathematical modeling historically confined to proprietary systems like BlackRock Aladdin or MSCI Barra. By combining a modern, low-latency API gateway with robust statistical libraries, StratFolio provides real-time portfolio optimization, comprehensive factor attribution, and forward-looking simulation models in a cohesive, institutional-grade workspace.

---

### 3. Problem Statement
Modern financial analysts face a fragmented ecosystem when performing portfolio management:
* **Tool Fragmentation**: Analysts must often pivot between Excel spreadsheets for basic modeling, Python scripts for advanced statistical checks, and legacy terminals (e.g., Bloomberg) for market data and optimization.
* **Risk Blind Spots**: Standard portfolio trackers fail to quantify downside risks like Conditional Value-at-Risk (CVaR) or systematically evaluate how a portfolio would perform under major historical macroeconomic shocks (e.g., the 2008 Lehman collapse or the 2020 COVID-19 crash).
* **Opaque Style Exposures**: Portfolios are frequently exposed to unintended factor tilts (e.g., small-cap or value factor biases) that are not immediately visible through simple asset class categorization.
* **Uncertainty in Long-Term Projections**: Static linear return projections do not capture the probabilistic variance of multi-asset returns, leading to poor estimation of client goal success rates.

---

### 4. Business Objectives
* **Consolidate Analytics**: Establish a unified quantitative workbench, reducing context-switching and enhancing analyst productivity.
* **Support Risk Management**: Enable proactive risk mitigation by providing daily Value-at-Risk (VaR), drawdown metrics, and multi-factor stress tests.
* **Optimize Capital Allocation**: Implement mathematical optimization models (Mean-Variance, Black-Litterman) to construct portfolios that maximize risk-adjusted yields.
* **Ensure Institutional Compliance**: Develop a containerized, auditable platform structure aligning with enterprise data safety and model governance protocols.

---

### 5. Target Users
The system is built specifically to address the workflows of the following roles in investment management and research:

* **Technology Analyst**: Integrates the platform's analytical APIs with internal order management systems, databases, and upstream market data feeds. Ensures structural stability, containerized performance, and API uptime.
* **Markets Analyst**: Evaluates cross-asset trends, asset price histories, and structural asset class changes. Uses the platform to construct and prototype model portfolios based on macro expectations.
* **Risk Analyst**: Monitors portfolio variance, tail risk, and stress limits. Reviews Value-at-Risk (VaR), Conditional Value-at-Risk (CVaR), and maximum drawdown to generate daily compliance reports.
* **Portfolio Analytics Analyst**: Runs performance attribution, computes style factor exposures (Fama-French), creates the efficient frontier, and determines rebalancing criteria to align portfolios with target profiles.

---

### 6. Key Features
* **Investor Profiling**: Structured questionnaires and financial inputs mapping user objectives to risk tolerance metrics (loss threshold, volatility limit).
* **Portfolio Construction & Constraint Engine**: Flexible setup allowing asset weight allocation with mathematical boundaries (such as long-only, max/min weight constraints, sector caps).
* **Risk & Stress Testing Engines**: Real-time evaluation of volatility, Sharpe/Sortino ratios, parametric/historical VaR, and stress replays simulating historical crises.
* **Advanced Simulation Engine**: Multi-asset Monte Carlo modeling using Cholesky-correlated geometric Brownian motion, generating percentile distribution paths to track goal success probability.
* **Efficient Frontier Engine**: Interactive Markowitz frontier plotting displaying the Maximum Sharpe Ratio and Minimum Volatility portfolios.
* **Fama-French Factor Attribution**: Multivariate OLS regressions mapping portfolio returns to market, size (SMB), and value (HML) factors to identify structural style tilts.

---

### 7. Technology Stack

* **Frontend**:
  * **React.js**: Single Page Application framework utilizing TypeScript for strict type checking.
  * **Tailwind CSS**: Modern styling utility enabling a responsive, dashboard-oriented layout.
  * **Recharts**: D3-backed declarative charting library for rendering frontier scatters, wealth fan charts, and factor regressions.
* **Backend**:
  * **FastAPI**: Asynchronous, ASGI-compliant Python framework for serving high-performance endpoints.
  * **Uvicorn / Gunicorn**: Production ASGI servers.
* **Database**:
  * **PostgreSQL**: Relational database for storing user accounts, portfolios, transactions, and historical analytical caches.
* **Analytics Libraries**:
  * **NumPy & Pandas**: Vectorized matrix calculations, historical data frame manipulation, and statistical transformations.
  * **PyPortfolioOpt**: Modern Portfolio Theory (MPT) and Black-Litterman optimization implementation.
  * **StatsModels**: Advanced statistical modeling used to execute multivariate OLS factor regressions.
  * **yfinance**: Market data ingestion for asset prices, dividends, and fundamental data.
* **Deployment**:
  * **Docker**: Multi-container setup (Frontend, Backend, PostgreSQL) configured via Docker Compose to guarantee environment parity.

---

### 8. Expected Outcomes
* **Reduced Setup Latency**: Reducing the time to construct, optimize, and test a multi-asset portfolio down to under a minute.
* **Precision Risk Estimation**: Delivering analytical risk metrics (VaR, CVaR) based on historical daily windows, providing precise tail-risk coverage.
* **Quantifiable Goal Likelihoods**: Replacing standard linear growth forecasts with a granular probability distribution over thousands of simulated paths.
* **Transparent Style Profiling**: Clear attribution showing exactly which systematic style tilts (e.g., size or value factor loads) are driving active returns.

---

### 9. Future Expansion Opportunities
* **Alternative Asset Support**: Integration of alternative asset classes, including private equity cash flows, real estate valuation models, and digital assets.
* **AI-Driven View Generation**: Using natural language processing (NLP) models to scan macro research reports and automatically generate views for the Black-Litterman optimization engine.
* **Enterprise Integration Pipelines**: Support for FIX (Financial Information eXchange) protocol integrations, allowing automated execution of rebalancing trades directly to institutional brokers.
* **Real-time Order Book Simulation**: Backtesting portfolio allocations against order book depth and market impact models to simulate execution slippage.
