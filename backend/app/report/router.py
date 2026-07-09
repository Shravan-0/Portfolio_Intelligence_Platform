from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    get_owned_portfolio,
)
from app.database.connection import get_db
from app.models.user import User

from .schemas import (
    ReportActivityResponse,
    ReportHistoryResponse,
    ReportResponse,
    ReportSummaryResponse,
)
from .service import (
    generate_report,
    get_latest_report,
    get_recent_report_activity,
    get_report_details,
    get_report_history,
    get_report_summary,
    mark_report_downloaded,
)

router = APIRouter(
    prefix="/report",
    tags=["Reports"],
)


@router.get(
    "/portfolio/{portfolio_id}",
    response_model=ReportResponse,
)
def portfolio_report(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    return generate_report(
        portfolio_id,
        db,
        current_user.id,
    )


@router.get(
    "/portfolio/{portfolio_id}/summary",
    response_model=ReportSummaryResponse,
)
def portfolio_report_summary(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    return get_report_summary(
        db,
        portfolio_id,
    )


@router.get(
    "/portfolio/{portfolio_id}/latest",
    response_model=ReportHistoryResponse | None,
)
def latest_portfolio_report(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    return get_latest_report(
        db,
        portfolio_id,
        "portfolio",
    )


@router.get(
    "/portfolio/{portfolio_id}/history",
    response_model=list[ReportHistoryResponse],
)
def portfolio_report_history(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    return get_report_history(
        db,
        portfolio_id,
    )


@router.get(
    "/portfolio/{portfolio_id}/activity",
    response_model=list[ReportActivityResponse],
)
def portfolio_report_activity(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    return get_recent_report_activity(
        db,
        portfolio_id,
    )


@router.get(
    "/details/{report_id}",
    response_model=ReportHistoryResponse,
)
def report_details(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = get_report_details(
        db,
        report_id,
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    get_owned_portfolio(db, report.portfolio_id, current_user)

    return report


@router.get(
    "/download/{portfolio_id}",
)
def download_report(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_portfolio(db, portfolio_id, current_user)

    report = get_latest_report(
        db,
        portfolio_id,
        "portfolio",
    )

    if not report:
        generate_report(
            portfolio_id,
            db,
            current_user.id,
        )
        report = get_latest_report(
            db,
            portfolio_id,
            "portfolio",
        )

    if not report or not Path(report.file_path).exists():
        raise HTTPException(
            status_code=500,
            detail="Failed to generate report",
        )

    mark_report_downloaded(
        db,
        report,
    )

    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/pdf",
    )


@router.get(
    "/download/report/{report_id}",
)
def download_report_version(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = get_report_details(
        db,
        report_id,
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    get_owned_portfolio(db, report.portfolio_id, current_user)

    if not Path(report.file_path).exists():
        raise HTTPException(
            status_code=404,
            detail="Report file not found",
        )

    mark_report_downloaded(
        db,
        report,
    )

    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/pdf",
    )
