# Factor Exposure Analysis Design

## Objective

The Factor Exposure Analysis module evaluates how a portfolio's returns are influenced by common market factors.

Rather than only measuring returns and risk, factor analysis explains the sources of portfolio performance.

The implementation will use the Fama-French Three-Factor Model.

---

# Why Factor Analysis?

Traditional portfolio metrics answer:

* How much return?
* How much risk?

Factor analysis answers:

* Why did the portfolio perform this way?

This provides explainability for portfolio behavior.

---

# Fama-French Three-Factor Model

The model explains portfolio returns using three systematic risk factors.

# Portfolio Return

Market Factor
+
SMB Factor
+
HML Factor
+
Residual Error

---

# Factor Definitions

## Market Factor (MKT-RF)

Measures sensitivity to overall market movements.

Interpretation:

* Beta > 1 → More aggressive than market
* Beta < 1 → More defensive than market

---

## SMB (Small Minus Big)

Measures exposure to small-cap stocks.

Interpretation:

* Positive SMB → Tilt toward smaller companies
* Negative SMB → Tilt toward larger companies

---

## HML (High Minus Low)

Measures exposure to value stocks.

Interpretation:

* Positive HML → Value orientation
* Negative HML → Growth orientation

---

# Inputs

The analysis requires:

* Portfolio Holdings
* Asset Weights
* Historical Asset Returns
* Fama-French Factor Dataset

---

# Processing Flow

Portfolio Holdings
↓
Historical Returns
↓
Portfolio Return Series
↓
Merge Factor Data
↓
Regression Analysis
↓
Factor Exposures

---

# Statistical Model

Method:

Linear Regression

Library:

StatsModels

Purpose:

Estimate exposure coefficients for each factor.

---

# Outputs

## Market Beta

Measures market sensitivity.

---

## SMB Exposure

Measures small-cap exposure.

---

## HML Exposure

Measures value exposure.

---

## R-Squared

Measures how well factors explain portfolio performance.

---

# Example Output

Market Beta: 1.12

SMB Exposure: 0.34

HML Exposure: -0.27

R²: 0.81

Interpretation:

The portfolio behaves slightly more aggressively than the market, has moderate small-cap exposure, and is tilted toward growth stocks.

---

# Dashboard Visualizations

## Factor Exposure Cards

* Market Beta
* SMB
* HML
* R²

---

## Exposure Bar Chart

Visual comparison of factor loadings.

---

## Factor Contribution Chart

Shows contribution of each factor to portfolio performance.

---

# Business Value

Provides institutional-style analytics commonly used by:

* Asset Managers
* Portfolio Managers
* Risk Analysts
* Investment Research Teams

---

# Future Enhancements

* Fama-French Five-Factor Model
* Momentum Factor
* Sector Factor Analysis
* Multi-Factor Attribution
