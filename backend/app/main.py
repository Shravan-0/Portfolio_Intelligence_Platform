import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from app.database.base import Base
from app.database.connection import engine

import app.models

from app.api.investor_profiles import router as profile_router
from app.routes.portfolio import router as portfolio_router
from app.routes.goals import router as goals_router
from app.routes.monte_carlo import router as monte_carlo_router
from app.routes.efficient_frontier import (
    router as efficient_frontier_router
)
from app.routes.factor_exposure import (
    router as factor_exposure_router
)

from app.routes import analytics

from app.risk.router import router as risk_router

from app.optimization.router import (
    router as optimization_router
)



from app.report.router import (
    router as report_router
)

from app.auth.router import (
    router as auth_router
)
from app.asset.router import router as asset_router
from app.market_data.router import (
    router as market_data_router
)
from app.performance.router import (
    router as performance_router
)

#from app.investor_profile.router import (
#    router as investor_profile_router
#)


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portfolio_Intelligence_Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://portfolio-intelligence-platform.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(profile_router)
app.include_router(portfolio_router)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)


app.include_router(
    goals_router,
    tags=["Goals"]
)

app.include_router(
    monte_carlo_router,
    prefix="/analytics",
    tags=["Monte Carlo"]
)

app.include_router(
    efficient_frontier_router,
    prefix="/analytics",
    tags=["Efficient Frontier"]
)

app.include_router(
    factor_exposure_router,
    prefix="/analytics",
    tags=["Factor Exposure"]
)

app.include_router(risk_router)

app.include_router(
    optimization_router
)



app.include_router(
    report_router
)

app.include_router(
    auth_router
)
app.include_router(
    asset_router
)
app.include_router(
    market_data_router
)
app.include_router(
    performance_router
)
#app.include_router(   investor_profile_router )


@app.get("/")
def root():
    return {
        "message": "Welcome to Portfolio_Intelligence_Platform API"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get("/db-test")
def db_test():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        return {
            "database": "connected"
        }
