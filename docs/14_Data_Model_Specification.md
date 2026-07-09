# Data Model Specification

## Objective

Define all entities used within the StratFolio platform.

---

# User

Purpose:

Represents a platform user.

Fields:

* id
* name
* email
* created_at

Relationships:

* One Investor Profile
* Many Portfolios

---

# Investor Profile

Purpose:

Stores investor characteristics.

Fields:

* id
* user_id
* age
* annual_income
* investment_horizon
* target_amount
* risk_tolerance

Relationships:

* Belongs to User

---

# Asset

Purpose:

Stores investable securities.

Fields:

* id
* ticker
* asset_name
* asset_type
* sector

Relationships:

* Referenced by Portfolio Holdings

---

# Portfolio

Purpose:

Stores user portfolios.

Fields:

* id
* user_id
* portfolio_name
* created_at

Relationships:

* Belongs to User
* Has Holdings
* Has Risk Metrics
* Has Simulations
* Has Stress Tests
* Has Factor Exposures

---

# Portfolio Holding

Purpose:

Stores portfolio allocations.

Fields:

* id
* portfolio_id
* asset_id
* weight

Relationships:

* References Asset
* Belongs to Portfolio

Constraints:

Total portfolio weights must equal 100%.

---

# Risk Metric

Purpose:

Stores calculated risk measures.

Fields:

* volatility
* sharpe_ratio
* sortino_ratio
* beta
* var_95
* cvar_95
* max_drawdown

Relationships:

* Belongs to Portfolio

---

# Simulation

Purpose:

Stores simulation outputs.

Fields:

* simulation_type
* result_json
* created_at

Relationships:

* Belongs to Portfolio

---

# Stress Test

Purpose:

Stores scenario analysis results.

Fields:

* scenario_name
* portfolio_loss
* result_json

Relationships:

* Belongs to Portfolio

---

# Factor Exposure

Purpose:

Stores Fama-French factor results.

Fields:

* market_beta
* smb_exposure
* hml_exposure
* r_squared

Relationships:

* Belongs to Portfolio

---

# Data Integrity Rules

* Every portfolio must belong to a user.
* Every holding must reference a valid asset.
* Portfolio weights must total 100%.
* Risk calculations require historical market data.
* Factor analysis requires valid return history.
