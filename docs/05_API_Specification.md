# API Specification

## Overview

The StratFolio API follows REST architecture and serves as the communication layer between the React frontend and FastAPI backend.

Base URL:

/api/v1

---

# Investor Profile APIs

## Create Investor Profile

POST /profiles

### Purpose

Create investor profile information.

### Request

* age
* annual_income
* investment_horizon
* target_amount

### Response

* profile_id
* risk_tolerance

---

## Get Investor Profile

GET /profiles/{profile_id}

### Purpose

Retrieve profile details.

---

# Portfolio APIs

## Create Portfolio

POST /portfolios

### Purpose

Create a new portfolio.

### Request

* portfolio_name
* assets
* weights

### Response

* portfolio_id

---

## Get Portfolio

GET /portfolios/{portfolio_id}

### Purpose

Retrieve portfolio details.

---

## Optimize Portfolio

POST /portfolios/{portfolio_id}/optimize

### Purpose

Generate optimized portfolio weights.

### Response

* optimized_weights
* expected_return
* expected_volatility
* sharpe_ratio

---

# Risk Analytics APIs

## Calculate Risk Metrics

POST /risk/calculate

### Purpose

Calculate portfolio risk measures.

### Response

* volatility
* sharpe_ratio
* sortino_ratio
* beta
* var_95
* cvar_95
* max_drawdown

---

# Correlation Analytics APIs

## Generate Correlation Matrix

POST /correlation/matrix

### Purpose

Calculate asset correlations.

### Response

* correlation_matrix

---

# Stress Testing APIs

## Run Stress Test

POST /stress-test

### Supported Scenarios

* Financial Crisis 2008
* COVID Crash
* Interest Rate Shock
* Inflation Shock

### Response

* scenario_name
* portfolio_loss
* portfolio_return

---

# Simulation APIs

## Monte Carlo Simulation

POST /simulation/monte-carlo

### Response

* simulation_paths
* probability_distribution

---

## Goal Success Probability

POST /simulation/goal-probability

### Response

* target_amount
* probability_of_success

---

## Backtesting

POST /simulation/backtest

### Response

* cumulative_return
* annual_return
* drawdown

---

# Optimization APIs

## Efficient Frontier

POST /optimization/efficient-frontier

### Response

* frontier_points
* max_sharpe_portfolio
* minimum_volatility_portfolio

---

# Factor Analysis APIs

## Fama-French Analysis

POST /factor-analysis

### Response

* market_beta
* smb_exposure
* hml_exposure
* r_squared

---

# Future APIs

* Authentication
* User Roles
* Portfolio Rebalancing
* Benchmark Comparison
* Watchlists
