# StratFolio

Portfolio Intelligence & Risk Analytics Platform

## Objective

Build an institutional-grade portfolio analytics platform providing:

- **Portfolio Construction**: Mean-variance optimization, Black-Litterman model, and risk-parity allocation.
- **Risk Analytics**: Volatility, Beta, Sharpe Ratio, Sortino Ratio, Treynor Ratio, Value-at-Risk (VaR), and Conditional VaR (CVaR).
- **Stress Testing**: Historical scenario replay (e.g., 2008 Financial Crisis, 2020 COVID Crash) and hypothetical macroeconomic factor shocks.
- **Monte Carlo Simulation**: Multi-path asset returns forecasting, wealth projection, and probability of achieving financial goals.
- **Efficient Frontier**: Markowitz frontier rendering, capital allocation lines, and optimal portfolio selection.
- **Goal Success Probability**: Time-to-goal success distributions under different savings and asset allocation regimes.
- **Factor Exposure Analysis**: Multi-factor regression model based on Fama-French factors and user-defined indices.

## Tech Stack

### Frontend
- **React**: Modern component-driven UI library
- **TailwindCSS**: Utility-first CSS styling for custom, sleek layouts
- **Recharts**: High-performance charting library for financial graphs

### Backend
- **FastAPI**: Modern, high-performance web framework for APIs in Python

### Database
- **PostgreSQL**: Robust, relational SQL database for portfolio, transaction, and market metadata storage

### Analytics
- **Pandas** & **NumPy**: Data manipulation and high-performance array operations
- **PyPortfolioOpt**: Financial portfolio optimization library (Markowitz, Black-Litterman, etc.)
- **StatsModels**: Statistical modeling and multi-factor regression analysis
- **yfinance**: Market data downloader from Yahoo! Finance

---

## Directory Structure

```text
Strat_folio/
├── frontend/      # React application (UI & Charts)
├── backend/       # FastAPI application (endpoints, calculations, Celery tasks)
├── docs/          # Comprehensive design, architecture, and engine documentation
├── database/      # PostgreSQL migration scripts, schemas, and seeding scripts
├── notebooks/     # Jupyter Notebooks for quant prototyping & analysis
├── docker/        # Containerization configurations (Docker Compose, Dockerfiles)
└── tests/         # Unit and integration test suites for risk & API validation
```
