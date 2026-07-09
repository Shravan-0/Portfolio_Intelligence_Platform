# Database Design

## Overview

The StratFolio database is designed to support portfolio management, risk analytics, simulations, stress testing, and factor exposure analysis.

The database follows a relational design using PostgreSQL and is organized around users, portfolios, assets, portfolio holdings, analytics results, and simulation outputs.

---

# Database Objectives

The database must support:

* User profile management
* Investor risk profiling
* Portfolio storage
* Asset allocation tracking
* Risk metric storage
* Stress test results
* Simulation outputs
* Factor exposure analytics

---

# Entity Relationship Overview

User
│
├── InvestorProfile
│
└── Portfolio
│
├── PortfolioHolding
│         │
│         └── Asset
│
├── RiskMetric
│
├── Simulation
│
├── StressTest
│
└── FactorExposure

---

# Table Design

## 1. Users

### Purpose

Stores registered platform users.

### Columns

* id
* name
* email
* created_at

### Relationships

* One User can have one Investor Profile
* One User can own multiple Portfolios

---

## 2. Investor Profiles

### Purpose

Stores investor characteristics used for risk classification and portfolio recommendations.

### Columns

* id
* user_id
* age
* annual_income
* investment_horizon
* target_amount
* risk_tolerance
* created_at

### Relationships

* Belongs to one User

---

## 3. Assets

### Purpose

Stores securities and investment instruments available for portfolio construction.

### Columns

* id
* ticker
* asset_name
* asset_type
* sector

### Example Assets

* AAPL
* MSFT
* SPY
* GLD
* AGG

### Relationships

* One Asset can exist in multiple Portfolio Holdings

---

## 4. Portfolios

### Purpose

Stores user portfolios.

### Columns

* id
* user_id
* portfolio_name
* created_at

### Relationships

* Belongs to one User
* Contains multiple Portfolio Holdings
* Has Risk Metrics
* Has Simulations
* Has Stress Tests
* Has Factor Exposure Records

---

## 5. Portfolio Holdings

### Purpose

Stores asset allocations within portfolios.

### Columns

* id
* portfolio_id
* asset_id
* weight

### Example

Portfolio A

* SPY → 50%
* AGG → 30%
* GLD → 20%

### Relationships

* Belongs to one Portfolio
* References one Asset

---

## 6. Risk Metrics

### Purpose

Stores calculated risk statistics.

### Columns

* id
* portfolio_id
* volatility
* sharpe_ratio
* sortino_ratio
* beta
* var_95
* cvar_95
* max_drawdown
* created_at

### Relationships

* Belongs to one Portfolio

---

## 7. Simulations

### Purpose

Stores simulation outputs.

### Supported Types

* Monte Carlo
* Backtesting
* Goal Probability

### Columns

* id
* portfolio_id
* simulation_type
* result_json
* created_at

### Relationships

* Belongs to one Portfolio

---

## 8. Stress Tests

### Purpose

Stores stress testing results.

### Supported Scenarios

* 2008 Financial Crisis
* COVID Market Crash
* Interest Rate Shock
* Inflation Shock

### Columns

* id
* portfolio_id
* scenario_name
* portfolio_loss
* result_json
* created_at

### Relationships

* Belongs to one Portfolio

---

## 9. Factor Exposure

### Purpose

Stores Fama-French factor analysis results.

### Factors

* Market Factor (MKT)
* SMB (Small Minus Big)
* HML (High Minus Low)

### Columns

* id
* portfolio_id
* market_beta
* smb_exposure
* hml_exposure
* r_squared
* created_at

### Relationships

* Belongs to one Portfolio

---

# Data Flow

Market Data
↓
Asset Universe
↓
Portfolio Construction
↓
Portfolio Holdings
↓
Risk Calculations
↓
Simulation Engine
↓
Analytics Storage

---

# Database Design Principles

The database is designed to:

* Maintain normalized relationships
* Avoid duplicate portfolio records
* Store historical analytics results
* Support future scalability
* Enable efficient querying for portfolio analytics dashboards

---

# Future Enhancements

Potential future tables:

* Transactions
* Portfolio Rebalancing History
* Benchmark Performance
* Watchlists
* Audit Logs
* User Authentication & Roles
* Portfolio Performance Snapshots

These enhancements are outside the current MVP scope and may be added in future versions.
