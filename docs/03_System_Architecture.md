# System Architecture

## Overview

StratFolio follows a modern three-tier architecture consisting of:

1. Presentation Layer (Frontend)
2. Application Layer (Backend Services)
3. Data Layer (Database)

The platform is designed to separate user interaction, business logic, financial analytics, and data storage for maintainability and scalability.

---

## High-Level Architecture

```text
+--------------------------------------------------+
|                  React Frontend                  |
|--------------------------------------------------|
| Dashboard                                        |
| Portfolio Builder                               |
| Risk Analytics                                  |
| Simulations                                     |
| Reports & Visualizations                        |
+-----------------------+--------------------------+
                        |
                        | REST API
                        v
+--------------------------------------------------+
|                FastAPI Backend                   |
+-----------------------+--------------------------+
                        |
        +---------------+----------------+
        |               |                |
        v               v                v

+---------------+ +---------------+ +----------------+
| Market Data   | | Portfolio     | | Analytics      |
| Service       | | Engine        | | Engine         |
+---------------+ +---------------+ +----------------+
                                        |
                                        |
                                        v

+--------------------------------------------------+
|               Quantitative Modules               |
|--------------------------------------------------|
| Risk Engine                                      |
| Stress Testing                                   |
| Monte Carlo Simulation                           |
| Efficient Frontier                               |
| Goal Success Probability                         |
| Factor Exposure Analysis                         |
| Correlation Analysis                             |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|                PostgreSQL Database               |
+--------------------------------------------------+
```

---

## Frontend Layer

Responsibilities:

- User interaction
- Portfolio creation
- Data visualization
- Risk dashboards
- Analytics reports

Technology:

- React
- Tailwind CSS
- Recharts

---

## Backend Layer

Responsibilities:

- API management
- Portfolio calculations
- Risk calculations
- Simulation execution
- Data aggregation

Technology:

- FastAPI
- Python

---

## Market Data Service

Responsibilities:

- Fetch historical prices
- Fetch benchmark data
- Normalize market datasets

Library:

- yfinance

---

## Portfolio Engine

Responsibilities:

- Portfolio allocation
- Portfolio optimization
- Constraint validation

Library:

- PyPortfolioOpt

---

## Risk Engine

Responsibilities:

- Volatility
- Sharpe Ratio
- Sortino Ratio
- Beta
- VaR
- CVaR
- Maximum Drawdown

---

## Analytics Engine

Responsibilities:

- Monte Carlo Simulation
- Efficient Frontier
- Goal Success Probability
- Factor Exposure Analysis
- Correlation Matrix

Libraries:

- NumPy
- Pandas
- StatsModels

---

## Data Layer

Database:

- PostgreSQL

Responsibilities:

- Store users
- Store portfolios
- Store holdings
- Store simulations
- Store risk metrics
- Store factor exposure results

---

## Deployment Architecture

```text
Docker Container
        |
        +-- React Frontend
        |
        +-- FastAPI Backend
        |
        +-- PostgreSQL Database
```

---

## Future Scalability

Future enhancements may include:

- Redis caching
- Celery background jobs
- Live market data feeds
- Multi-user authentication
- Cloud deployment
- Portfolio rebalancing automation