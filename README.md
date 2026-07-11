# Portfolio Intelligence Platform

A full-stack Portfolio Intelligence & Risk Analytics Platform built with **React**, **FastAPI**, and **PostgreSQL**. The platform enables investors to create portfolios, analyze performance, evaluate risk, optimize asset allocation, simulate future outcomes, and generate portfolio reports through an interactive dashboard.

---

## Features

### Portfolio Management
- User authentication and authorization
- Investor profile management
- Financial goal management
- Portfolio creation and management
- Asset management (CRUD)
- Live portfolio valuation
- Portfolio allocation visualization

### Portfolio Analytics
- Portfolio performance tracking
- Benchmark comparison
- Portfolio health score
- Diversification analysis
- Correlation matrix
- Factor exposure analysis
- Efficient Frontier visualization
- Monte Carlo simulation
- Goal success probability
- Portfolio optimization recommendations

### Risk Analytics
- Volatility
- Sharpe Ratio
- Beta
- Maximum Drawdown
- Risk Score
- Diversification Score
- Asset Allocation Analysis

### Reporting
- Portfolio report generation (PDF)
- Report history
- Version tracking

---

# Tech Stack

## Frontend

- React
- Material UI
- Recharts
- Axios
- Vite

## Backend

- FastAPI
- SQLAlchemy
- Pydantic

## Database

- PostgreSQL

## Financial & Analytics Libraries

- NumPy
- Pandas
- PyPortfolioOpt
- StatsModels
- yfinance
- ReportLab

---

# Project Structure

```text
Portfolio_Intelligence_Platform/
│
├── backend/
├── frontend/
├── database/
├── docker/
├── docs/
├── tests/
│
├── README.md
├── LICENSE
├── .env.example
└── .gitignore
```

---

# Screenshots

> Add screenshots inside the `screenshots/` folder.

- Dashboard
- Portfolio
- Analytics
- Reports
- Profile
- Risk Analysis

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd Portfolio_Intelligence_Platform
```

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend:

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# API Modules

- Authentication
- Investor Profile
- Portfolio
- Asset Management
- Portfolio Intelligence
- Performance Analytics
- Risk Analytics
- Optimization
- Monte Carlo Simulation
- Efficient Frontier
- Factor Exposure
- Reports

---

# Architecture

```
React Frontend
        │
        ▼
FastAPI REST API
        │
        ▼
Business Services
        │
        ▼
SQLAlchemy ORM
        │
        ▼
PostgreSQL
```

---

# Future Improvements

- Live market streaming
- Transaction history
- Portfolio rebalancing automation
- Multi-benchmark comparison
- Advanced stress testing
- Docker deployment
- CI/CD pipeline

---

# License

This project is licensed under the MIT License.