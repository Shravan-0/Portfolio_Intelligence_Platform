# Backend File Tree

backend/

app/

api/
├── profiles.py
├── portfolios.py
├── risk.py
├── simulations.py
├── analytics.py

services/
├── investor_service.py
├── portfolio_service.py
├── risk_service.py
├── stress_test_service.py
├── monte_carlo_service.py
├── efficient_frontier_service.py
├── factor_service.py
├── correlation_service.py

repositories/
├── profile_repository.py
├── portfolio_repository.py
├── risk_repository.py

models/
├── user.py
├── investor_profile.py
├── asset.py
├── portfolio.py
├── portfolio_holding.py
├── risk_metric.py
├── simulation.py
├── stress_test.py
├── factor_exposure.py

schemas/
├── profile_schema.py
├── portfolio_schema.py
├── risk_schema.py
├── simulation_schema.py

database/
├── base.py
├── connection.py

core/
├── config.py

utils/
├── returns.py
├── statistics.py

main.py

---

# Design Principles

* Clear separation of concerns
* Reusable services
* Independent analytics modules
* Scalable structure for future growth
