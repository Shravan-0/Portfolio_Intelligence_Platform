# Backend Folder Structure

## Objective

The backend is organized using a layered architecture to separate API handling, business logic, data access, and infrastructure concerns.

This structure improves maintainability, scalability, and testing.

---

# Folder Overview

backend/

├── app/

├── api/

├── core/

├── database/

├── models/

├── schemas/

├── repositories/

├── services/

├── utils/

└── main.py

---

# API Layer

Folder:

api/

Purpose:

Defines HTTP endpoints and request routing.

Responsibilities:

* Receive requests
* Validate input
* Call services
* Return responses

Example Files:

* profiles.py
* portfolios.py
* risk.py
* simulations.py
* analytics.py

---

# Service Layer

Folder:

services/

Purpose:

Contains business logic and financial calculations.

Responsibilities:

* Portfolio construction
* Risk analytics
* Simulations
* Factor analysis

Example Files:

* investor_service.py
* portfolio_service.py
* risk_service.py
* monte_carlo_service.py
* factor_service.py

---

# Repository Layer

Folder:

repositories/

Purpose:

Handles database operations.

Responsibilities:

* Create records
* Read records
* Update records
* Delete records

Example Files:

* portfolio_repository.py
* profile_repository.py

---

# Database Models

Folder:

models/

Purpose:

Represents database entities.

Example Files:

* user.py
* investor_profile.py
* portfolio.py
* asset.py
* holding.py

---

# Schemas

Folder:

schemas/

Purpose:

Request and response validation.

Example Files:

* profile_schema.py
* portfolio_schema.py
* risk_schema.py

---

# Database Layer

Folder:

database/

Purpose:

Database configuration and connectivity.

Example Files:

* connection.py
* base.py

---

# Core Layer

Folder:

core/

Purpose:

Application configuration.

Example Files:

* config.py
* settings.py

---

# Utilities

Folder:

utils/

Purpose:

Reusable helper functions.

Example Files:

* returns.py
* statistics.py
* date_utils.py
