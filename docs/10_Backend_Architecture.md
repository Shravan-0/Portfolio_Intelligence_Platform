# Backend Design & Service Architecture

## Objective

This document defines the internal structure of the StratFolio backend.

The backend follows a layered architecture to ensure separation of concerns, maintainability, scalability, and testability.

---

# Architectural Style

The backend uses a layered service-based architecture.

Layers:

1. API Layer
2. Service Layer
3. Repository Layer
4. Database Layer

---

# Backend Flow

Client Request
↓
API Layer
↓
Service Layer
↓
Repository Layer
↓
Database
↓
Response

---

# API Layer

## Responsibility

Handle HTTP requests and responses.

The API layer should:

* Validate requests
* Call services
* Return standardized responses

The API layer should NOT:

* Contain business logic
* Execute calculations
* Query databases directly

---

# Service Layer

## Responsibility

Contains business logic.

Services coordinate:

* Portfolio calculations
* Risk analytics
* Simulations
* Factor analysis

The service layer is the core of the application.

---

# Repository Layer

## Responsibility

Provide database access.

Repositories handle:

* Create operations
* Read operations
* Update operations
* Delete operations

Repositories isolate database logic from business logic.

---

# Database Layer

## Responsibility

Persistent data storage.

Database entities include:

* Users
* Investor Profiles
* Portfolios
* Holdings
* Risk Metrics
* Simulations
* Stress Tests
* Factor Exposures

---

# Service Modules

## Investor Profiling Service

Responsibilities:

* Risk classification
* Investor profile management

Inputs:

* Age
* Income
* Horizon

Outputs:

* Risk category

---

## Market Data Service

Responsibilities:

* Historical prices
* Benchmark data
* Asset metadata

Data Source:

* yfinance

---

## Portfolio Construction Service

Responsibilities:

* Portfolio creation
* Weight validation
* Allocation management

---

## Risk Engine Service

Responsibilities:

* Volatility
* Sharpe Ratio
* Sortino Ratio
* Beta
* VaR
* CVaR
* Maximum Drawdown

---

## Correlation Analytics Service

Responsibilities:

* Correlation matrix
* Diversification score

---

## Stress Testing Service

Responsibilities:

* Historical scenario analysis
* Portfolio shock testing

Supported Scenarios:

* 2008 Crisis
* COVID Crash
* Interest Rate Shock
* Inflation Shock

---

## Monte Carlo Service

Responsibilities:

* Future portfolio simulations
* Outcome distribution analysis

---

## Goal Probability Service

Responsibilities:

* Probability of achieving target wealth

Inputs:

* Initial investment
* Expected return
* Investment horizon
* Target amount

Outputs:

* Success probability

---

## Efficient Frontier Service

Responsibilities:

* Portfolio optimization
* Risk-return analysis

Outputs:

* Efficient frontier points
* Maximum Sharpe portfolio
* Minimum volatility portfolio

---

## Factor Analysis Service

Responsibilities:

* Fama-French regression
* Exposure calculation

Outputs:

* Market Beta
* SMB Exposure
* HML Exposure
* R²

---

# Error Handling Strategy

Standardized API responses should be used.

Examples:

* Validation Error
* Not Found Error
* Internal Server Error
* Analytics Calculation Error

---

# Logging Strategy

Log:

* API requests
* Portfolio calculations
* Simulation execution
* Errors

Purpose:

* Debugging
* Monitoring
* Auditability

---

# Future Enhancements

Potential future backend additions:

* Authentication
* Role-Based Access Control
* Redis Caching
* Background Jobs
* Portfolio Rebalancing
* Live Market Data
* Cloud Deployment
