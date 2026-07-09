from datetime import datetime

from pydantic import BaseModel


class ReportHistoryResponse(BaseModel):
    id: int
    portfolio_id: int
    user_id: int | None = None
    report_type: str
    report_name: str
    version: int
    generated_at: datetime
    downloaded_at: datetime | None = None
    status: str
    file_name: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    message: str
    portfolio_id: int
    report: ReportHistoryResponse


class ReportSummaryResponse(BaseModel):
    available_reports: int
    generated_reports: int
    latest_report: ReportHistoryResponse | None = None
    last_generated: datetime | None = None


class ReportActivityResponse(BaseModel):
    id: str
    report_id: int
    report_type: str
    message: str
    occurred_at: datetime
