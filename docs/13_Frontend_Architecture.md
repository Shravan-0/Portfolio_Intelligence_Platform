# Frontend Architecture

## Objective

The frontend provides portfolio visualization, risk dashboards, simulation outputs, and analytics reports.

The architecture follows a component-based design using React.

---

# Technology Stack

* React
* Tailwind CSS
* Recharts

---

# Page Structure

## Dashboard

Purpose:

Application landing page.

Displays:

* Portfolio summary
* Risk overview
* Performance metrics

---

## Portfolio Builder

Purpose:

Create and manage portfolios.

Features:

* Asset selection
* Weight allocation
* Portfolio optimization

---

## Risk Analytics

Purpose:

Display risk metrics.

Features:

* Volatility
* Sharpe Ratio
* Sortino Ratio
* Beta
* VaR
* CVaR

---

## Simulations

Purpose:

Display advanced analytics.

Features:

* Monte Carlo
* Backtesting
* Goal Probability

---

## Factor Analysis

Purpose:

Display factor exposures.

Features:

* Market Beta
* SMB
* HML
* R²

---

# Component Structure

components/

dashboard/
portfolio/
risk/
simulation/
analytics/

---

# Shared Components

* Navbar
* Sidebar
* Metric Card
* Data Table
* Loading Spinner
* Error Component

---

# Visualization Components

* Portfolio Allocation Chart
* Correlation Heatmap
* Monte Carlo Chart
* Efficient Frontier Chart
* Factor Exposure Chart

---

# Service Layer

services/

Purpose:

Communicate with backend APIs.

Files:

* api.js
* portfolioApi.js
* riskApi.js
* analyticsApi.js

---

# State Management

Initial Version:

* React Hooks
* Context API

Future:

* Redux Toolkit
