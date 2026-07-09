from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from .schemas import ReportActivityResponse, ReportResponse, ReportSummaryResponse

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)

from reportlab.lib.styles import (
    getSampleStyleSheet,
)
from app.optimization.service import (
    get_portfolio_health,
    get_rebalance_recommendation,
    get_recommendations,
)

from app.performance.service import (
    get_benchmark_comparison,
)

from app.models.portfolio import Portfolio
from app.models.investor_profile import InvestorProfile
from app.models.portfolio_asset import PortfolioAsset
from app.models.report_history import ReportHistory
from app.services.analytics_service import calculate_total_value

REPORT_TYPE_PORTFOLIO = "portfolio"
REPORT_STATUS_GENERATED = "Generated"
REPORT_STATUS_DOWNLOADED = "Downloaded"
REPORT_STATUS_FAILED = "Failed"


def _next_report_version(
    portfolio_id: int,
    db: Session,
    report_type: str,
) -> int:
    latest_report = (
        db.query(ReportHistory)
        .filter(
            ReportHistory.portfolio_id == portfolio_id,
            ReportHistory.report_type == report_type,
        )
        .order_by(ReportHistory.version.desc())
        .first()
    )

    if not latest_report:
        return 1

    return latest_report.version + 1


def _build_portfolio_pdf(
    portfolio_id: int,
    db: Session,
    pdf_path: Path,
):

    health = get_portfolio_health(
        portfolio_id
    )

    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id)
        .first()
    )

    profile = None
    if portfolio:
        profile = (
            db.query(InvestorProfile)
            .filter(
                InvestorProfile.user_id == portfolio.user_id
            )
            .first()
        )

    # Fetch rebalance and optimization recommendations
    if profile:
        rebalance = get_rebalance_recommendation(profile)
        opt_recommendations = get_recommendations(profile).recommendations
    else:
        rebalance = None
        opt_recommendations = [
            "Create an investor profile to receive optimization recommendations."
        ]

    benchmark = get_benchmark_comparison(
        db,
        portfolio_id,
    )
    benchmark["status"] = (
        "Outperforming"
        if benchmark["alpha"] >= 0
        else "Underperforming"
    )

    assets = (
        db.query(PortfolioAsset)
        .filter(PortfolioAsset.portfolio_id == portfolio_id)
        .all()
    )
    total_value = calculate_total_value(assets)

    doc = SimpleDocTemplate(
        str(pdf_path)
    )

    styles = getSampleStyleSheet()

    content = [
        Paragraph(
            "StratFolio Portfolio Report",
            styles["Title"],
        ),

        Spacer(1, 20),

        Paragraph(
            "Portfolio Summary",
            styles["Heading2"],
        ),

        Paragraph(
            f"Portfolio ID: {portfolio_id}",
            styles["Normal"],
        ),

        Paragraph(
            f"Portfolio Name: {portfolio.name if portfolio else 'N/A'}",
            styles["Normal"],
        ),

        Paragraph(
            f"Total Value: USD {total_value:,.2f}",
            styles["Normal"],
        ),

        Spacer(1, 10),

        Paragraph(
            "Portfolio Health",
            styles["Heading2"],
        ),

        Paragraph(
            f"Health Score: {health.health_score}",
            styles["Normal"],
        ),

        Paragraph(
            f"Rating: {health.rating}",
            styles["Normal"],
        ),

        Spacer(1, 10),

        Paragraph(
            "Asset Allocation Breakdown",
            styles["Heading2"],
        ),
    ]

    if rebalance:
        content.extend([
            Paragraph(
                f"Current Allocation: Equity {rebalance.current_equity}%, Debt {rebalance.current_debt}%, Cash {rebalance.current_cash}%",
                styles["Normal"],
            ),
            Paragraph(
                f"Recommended Allocation: Equity {rebalance.recommended_equity}%, Debt {rebalance.recommended_debt}%, Cash {rebalance.recommended_cash}%",
                styles["Normal"],
            ),
            Paragraph(
                f"Rebalancing Action: {rebalance.action}",
                styles["Normal"],
            ),
        ])
    else:
        content.append(
            Paragraph(
                "No investor profile found. Create an investor profile to see asset allocation recommendations.",
                styles["Normal"],
            )
        )

    content.extend([
        Spacer(1, 10),

        Paragraph(
            "Benchmark Analysis",
            styles["Heading2"],
        ),

        Paragraph(
            f"Benchmark: {benchmark['benchmark']}",
            styles["Normal"],
        ),

        Paragraph(
            f"Benchmark Return: {benchmark['benchmark_return']}%",
            styles["Normal"],
        ),

        Paragraph(
            f"Portfolio Return: {benchmark['portfolio_return']}%",
            styles["Normal"],
        ),

        Paragraph(
            f"Alpha: {benchmark['alpha']}%",
            styles["Normal"],
        ),

        Paragraph(
            f"Status: {benchmark['status']}",
            styles["Normal"],
        ),

        Spacer(1, 10),

        Paragraph(
            "Optimization Recommendations",
            styles["Heading2"],
        ),
    ])

    for recommendation in opt_recommendations:
        content.append(
            Paragraph(
                f"• {recommendation}",
                styles["Normal"],
            )
        )

    doc.build(content)


def get_latest_report(
    db: Session,
    portfolio_id: int,
    report_type: str | None = None,
) -> ReportHistory | None:
    query = (
        db.query(ReportHistory)
        .filter(ReportHistory.portfolio_id == portfolio_id)
    )

    if report_type:
        query = query.filter(ReportHistory.report_type == report_type)

    return (
        query
        .order_by(
            ReportHistory.generated_at.desc(),
            ReportHistory.version.desc(),
        )
        .first()
    )


def get_report_history(
    db: Session,
    portfolio_id: int,
) -> list[ReportHistory]:
    return (
        db.query(ReportHistory)
        .filter(ReportHistory.portfolio_id == portfolio_id)
        .order_by(
            ReportHistory.generated_at.desc(),
            ReportHistory.version.desc(),
        )
        .all()
    )


def get_report_details(
    db: Session,
    report_id: int,
) -> ReportHistory | None:
    return (
        db.query(ReportHistory)
        .filter(ReportHistory.id == report_id)
        .first()
    )


def generate_report(
    portfolio_id: int,
    db: Session,
    user_id: int | None = None,
    report_type: str = REPORT_TYPE_PORTFOLIO,
) -> ReportResponse:
    BASE_DIR = Path(__file__).resolve().parent.parent
    reports_dir = BASE_DIR / "reports"
    reports_dir.mkdir(exist_ok=True)

    version = _next_report_version(
        portfolio_id,
        db,
        report_type,
    )

    file_name = (
        f"{report_type}_{portfolio_id}_v{version}.pdf"
    )
    pdf_path = reports_dir / file_name
    generated_at = datetime.now(timezone.utc)

    report = ReportHistory(
        portfolio_id=portfolio_id,
        user_id=user_id,
        report_type=report_type,
        report_name="Portfolio Report",
        version=version,
        generated_at=generated_at,
        status=REPORT_STATUS_GENERATED,
        file_name=file_name,
        file_path=str(pdf_path),
    )

    db.add(report)

    try:
        _build_portfolio_pdf(
            portfolio_id,
            db,
            pdf_path,
        )
    except Exception:
        report.status = REPORT_STATUS_FAILED
        db.commit()
        db.refresh(report)
        raise

    db.commit()
    db.refresh(report)

    return ReportResponse(
        message="Portfolio report generated",
        portfolio_id=portfolio_id,
        report=report,
    )


def mark_report_downloaded(
    db: Session,
    report: ReportHistory,
) -> ReportHistory:
    if report.downloaded_at is None:
        report.downloaded_at = datetime.now(timezone.utc)

    if report.status != REPORT_STATUS_DOWNLOADED:
        report.status = REPORT_STATUS_DOWNLOADED

    db.commit()
    db.refresh(report)

    return report


def get_report_summary(
    db: Session,
    portfolio_id: int,
) -> ReportSummaryResponse:
    history = get_report_history(
        db,
        portfolio_id,
    )
    latest_report = history[0] if history else None

    return ReportSummaryResponse(
        available_reports=1,
        generated_reports=len(history),
        latest_report=latest_report,
        last_generated=latest_report.generated_at if latest_report else None,
    )


def get_recent_report_activity(
    db: Session,
    portfolio_id: int,
    limit: int = 10,
) -> list[ReportActivityResponse]:
    history = get_report_history(
        db,
        portfolio_id,
    )
    activities = []

    for report in history:
        activities.append(
            ReportActivityResponse(
                id=f"{report.id}-generated",
                report_id=report.id,
                report_type=report.report_type,
                message=(
                    f"{report.report_name} generated"
                    if report.version == 1
                    else f"New {report.report_name.lower()} version created"
                ),
                occurred_at=report.generated_at,
            )
        )

        if report.downloaded_at:
            activities.append(
                ReportActivityResponse(
                    id=f"{report.id}-downloaded",
                    report_id=report.id,
                    report_type=report.report_type,
                    message=f"{report.report_name} downloaded",
                    occurred_at=report.downloaded_at,
                )
            )

    return sorted(
        activities,
        key=lambda activity: activity.occurred_at,
        reverse=True,
    )[:limit]
