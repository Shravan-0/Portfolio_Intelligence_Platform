import logging
import os
import tempfile
from datetime import datetime, timezone, date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas

# Internal Schema & Model Imports
from .schemas import ReportActivityResponse, ReportResponse, ReportSummaryResponse
from app.models.portfolio import Portfolio
from app.models.portfolio_asset import PortfolioAsset
from app.models.investor_profile import InvestorProfile
from app.models.report_history import ReportHistory
from app.models.goal import Goal

# Internal Service Imports
from app.optimization.service import (
    get_portfolio_health,
    get_rebalance_recommendation,
    get_recommendations,
    determine_risk_profile,
)
from app.performance.service import (
    calculate_live_portfolio_value_and_returns,
    calculate_live_asset_valuations,
    get_benchmark_comparison,
    get_performance_history,
)
from app.risk.service import (
    get_portfolio_risk,
    get_asset_allocation,
    get_diversification_score,
    calculate_asset_allocation,
    calculate_allocation_risk_metrics,
)
from app.services.portfolio_analytics_service import (
    calculate_allocation_breakdown,
    calculate_risk_metrics,
    calculate_exposure,
)
from app.services.efficient_frontier import generate_efficient_frontier
from app.services.monte_carlo import run_monte_carlo
from app.services.goal_probability import populate_goal_metrics
from app.services.factor_exposure import get_factor_exposure

logger = logging.getLogger(__name__)

REPORT_TYPE_PORTFOLIO = "portfolio"
REPORT_STATUS_GENERATED = "Generated"
REPORT_STATUS_DOWNLOADED = "Downloaded"
REPORT_STATUS_FAILED = "Failed"

# -------------------------------------------------------------------------
# Theme Colors Inspired by theme.jsx (Dark Blue / Slate / Institutional)
# -------------------------------------------------------------------------
NAVY_HEADER_BG = colors.HexColor("#0A0E17")
SLATE_CARD_BG = colors.HexColor("#12182A")
SLATE_BORDER = colors.HexColor("#1E293B")
PRIMARY_BLUE = colors.HexColor("#3B82F6")
PRIMARY_LIGHT = colors.HexColor("#60A5FA")
PRIMARY_DARK = colors.HexColor("#1D4ED8")
SECONDARY_CYAN = colors.HexColor("#06B6D4")
SUCCESS_GREEN = colors.HexColor("#22C55E")
ERROR_RED = colors.HexColor("#EF4444")
WARNING_AMBER = colors.HexColor("#F59E0B")
TEXT_DARK = colors.HexColor("#0F172A")
TEXT_MUTED = colors.HexColor("#64748B")
TEXT_LIGHT = colors.HexColor("#F8FAFC")
TEXT_SECONDARY_LIGHT = colors.HexColor("#94A3B8")
TABLE_ROW_ALT = colors.HexColor("#F1F5F9")
DIVIDER_COLOR = colors.HexColor("#E2E8F0")

CHART_PALETTE = [
    "#3B82F6", "#06B6D4", "#8B5CF6", "#F59E0B",
    "#22C55E", "#EC4899", "#64748B", "#14B8A6",
    "#3B82F6", "#06B6D4"
]

# Robust Sector / Asset Class Mapping for Holdings
INSTITUTIONAL_SECTOR_MAP = {
    "AAPL": "Information Technology",
    "MSFT": "Information Technology",
    "NVDA": "Information Technology",
    "GOOGL": "Communication Services",
    "META": "Communication Services",
    "AMZN": "Consumer Discretionary",
    "TSLA": "Consumer Discretionary",
    "NFLX": "Communication Services",
    "JPM": "Financials",
    "V": "Financials",
    "SPY": "Broad Market Equities",
    "QQQ": "Technology Equities",
    "GLD": "Precious Metals",
    "VNQ": "Real Estate / REITs",
    "BND": "Fixed Income / Bonds",
    "BTC": "Digital Assets",
    "ETH": "Digital Assets",
}


# -------------------------------------------------------------------------
# Numbered Canvas for Institutional Page Headers & Two-Pass Footer
# -------------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    """
    Two-pass ReportLab canvas that calculates exact total page count,
    suppresses headers/footers on Cover Page (Page 1), and draws crisp
    institutional running headers and footers on all subsequent pages.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_institutional_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_institutional_decorations(self, total_pages: int):
        if self._pageNumber == 1:
            return  # Suppress running header/footer on cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(TEXT_DARK)

        # Running Top Header
        header_y = letter[1] - 36
        self.drawString(54, header_y, "STRATFOLIO | INSTITUTIONAL PORTFOLIO & RISK ANALYTICS")
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawRightString(letter[0] - 54, header_y, "Confidential Client Report")

        self.setStrokeColor(DIVIDER_COLOR)
        self.setLineWidth(0.75)
        self.line(54, header_y - 6, letter[0] - 54, header_y - 6)

        # Running Bottom Footer
        footer_y = 36
        self.line(54, footer_y + 12, letter[0] - 54, footer_y + 12)
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(54, footer_y, f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} | Confidential & Proprietary")
        self.drawRightString(letter[0] - 54, footer_y, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


# -------------------------------------------------------------------------
# Matplotlib Chart Generation Helpers (Headless Institutional Quality)
# -------------------------------------------------------------------------
def _generate_allocation_pie_chart(allocation_data: List[Dict[str, Any]]) -> Optional[str]:
    try:
        if not allocation_data:
            return None

        labels = []
        sizes = []
        for item in allocation_data:
            val = float(item.get("total_allocation", 0.0) or item.get("allocation", 0.0) or 0.0)
            if val > 0:
                labels.append(str(item.get("asset_type", "Unknown")).title())
                sizes.append(val)

        if not sizes or sum(sizes) <= 0:
            return None

        fig, ax = plt.subplots(figsize=(6, 3.8), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        colors_list = CHART_PALETTE[:len(sizes)]
        wedges, texts, autotexts = ax.pie(
            sizes,
            labels=labels,
            autopct="%1.1f%%",
            startangle=140,
            colors=colors_list,
            pctdistance=0.75,
            wedgeprops=dict(width=0.4, edgecolor="#FFFFFF", linewidth=1.5)
        )

        for text in texts:
            text.set_color("#0F172A")
            text.set_fontsize(9)
            text.set_fontweight("bold")
        for autotext in autotexts:
            autotext.set_color("#FFFFFF")
            autotext.set_fontsize(8)
            autotext.set_fontweight("bold")

        ax.set_title("Portfolio Asset Allocation Breakdown", fontsize=11, fontweight="bold", color="#0F172A", pad=12)
        plt.tight_layout()

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_alloc.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate allocation pie chart: {e}")
        return None


def _generate_sector_bar_chart(valuations: List[Dict[str, Any]], total_value: float) -> Optional[str]:
    try:
        if not valuations or total_value <= 0:
            return None

        sector_totals: Dict[str, float] = {}
        for val in valuations:
            asset = val.get("asset")
            if not asset:
                continue
            ticker = (asset.ticker or "").upper()
            asset_type = (asset.asset_type or "").lower()
            mv = float(val.get("market_value", 0.0))

            if ticker in INSTITUTIONAL_SECTOR_MAP:
                sector = INSTITUTIONAL_SECTOR_MAP[ticker]
            elif "crypto" in asset_type:
                sector = "Digital Assets"
            elif any(k in asset_type for k in ["debt", "bond", "fixed"]):
                sector = "Fixed Income"
            elif "etf" in asset_type:
                sector = "Diversified Equities"
            elif "commodity" in asset_type or "gold" in asset_type:
                sector = "Precious Metals"
            elif "cash" in asset_type or "liquid" in asset_type:
                sector = "Cash & Equivalents"
            else:
                sector = "Core Equities"

            sector_totals.setdefault(sector, 0.0)
            sector_totals[sector] += mv

        if not sector_totals:
            return None

        sorted_sectors = sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)
        sectors = [s[0] for s in sorted_sectors]
        pcts = [(s[1] / total_value) * 100.0 for s in sorted_sectors]

        fig, ax = plt.subplots(figsize=(6.2, 3.6), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        y_pos = np.arange(len(sectors))
        bars = ax.barh(y_pos, pcts, color="#3B82F6", height=0.55, edgecolor="#1D4ED8", linewidth=0.8)

        ax.set_yticks(y_pos)
        ax.set_yticklabels(sectors, fontsize=9, fontweight="bold", color="#0F172A")
        ax.invert_yaxis()
        ax.set_xlabel("Allocation Share (%)", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_title("Macro Sector & Asset Class Distribution", fontsize=11, fontweight="bold", color="#0F172A", pad=10)
        ax.grid(axis="x", linestyle="--", alpha=0.5, color="#CBD5E1")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_color("#94A3B8")
        ax.spines["bottom"].set_color("#94A3B8")

        for bar in bars:
            width = bar.get_width()
            ax.annotate(f"{width:.1f}%",
                        xy=(width, bar.get_y() + bar.get_height() / 2),
                        xytext=(5, 0),
                        textcoords="offset points",
                        ha="left", va="center", fontsize=8, fontweight="bold", color="#0F172A")

        plt.tight_layout()
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_sector.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate sector bar chart: {e}")
        return None


def _generate_performance_chart(history: List[Any], comparison: Dict[str, Any], live_return_pct: float) -> Optional[str]:
    try:
        fig, ax = plt.subplots(figsize=(6.2, 3.6), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        benchmark_name = comparison.get("benchmark", "S&P 500")
        benchmark_ret = float(comparison.get("benchmark_return", 10.8) or 0.0)

        if len(history) >= 2:
            dates = [snap.date for snap in history]
            values = [float(snap.portfolio_value) for snap in history]
            base_val = values[0] if values[0] > 0 else 1.0
            port_ret_curve = [((v - base_val) / base_val) * 100.0 for v in values]

            total_days = max((dates[-1] - dates[0]).days, 1)
            bench_daily_rate = (1.0 + (benchmark_ret / 100.0)) ** (1.0 / 365.0) - 1.0
            bench_curve = [(((1.0 + bench_daily_rate) ** (d - dates[0]).days) - 1.0) * 100.0 for d in dates]

            ax.plot(dates, port_ret_curve, label="Portfolio Return (%)", color="#3B82F6", linewidth=2.5)
            ax.plot(dates, bench_curve, label=f"{benchmark_name} (%)", color="#06B6D4", linewidth=2.0, linestyle="--")
            ax.set_ylabel("Cumulative Return (%)", fontsize=9, fontweight="bold", color="#64748B")
            ax.tick_params(axis="x", rotation=25)
        else:
            categories = ["Live Return", benchmark_name]
            returns = [live_return_pct, benchmark_ret]
            colors_list = ["#3B82F6", "#94A3B8"] if live_return_pct >= benchmark_ret else ["#EF4444", "#3B82F6"]

            bars = ax.bar(categories, returns, color=colors_list, width=0.45, edgecolor="#1E293B", linewidth=0.8)
            ax.set_ylabel("Total Return (%)", fontsize=9, fontweight="bold", color="#64748B")
            for bar in bars:
                height = bar.get_height()
                offset = 3 if height >= 0 else -12
                ax.annotate(f"{height:+.2f}%",
                            xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, offset),
                            textcoords="offset points",
                            ha="center", va="bottom" if height >= 0 else "top",
                            fontsize=9, fontweight="bold", color="#0F172A")

        ax.set_title(f"Portfolio vs Benchmark Comparison ({benchmark_name})", fontsize=11, fontweight="bold", color="#0F172A", pad=10)
        ax.grid(axis="y", linestyle="--", alpha=0.5, color="#CBD5E1")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_color("#94A3B8")
        ax.spines["bottom"].set_color("#94A3B8")
        if len(history) >= 2:
            ax.legend(loc="upper left", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", fontsize=8)

        plt.tight_layout()
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_perf.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate performance chart: {e}")
        return None


def _generate_efficient_frontier_chart(frontier_points: List[Dict[str, Any]], current_vol: float, current_ret: float) -> Optional[str]:
    try:
        if not frontier_points:
            return None

        risks = [float(p.get("risk", 0.0)) * 100.0 for p in frontier_points]
        returns = [float(p.get("return", 0.0)) * 100.0 for p in frontier_points]

        fig, ax = plt.subplots(figsize=(6.2, 3.6), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        ax.plot(risks, returns, color="#64748B", linestyle="--", linewidth=1.2, alpha=0.6, label="Efficient Frontier Curve")
        ax.scatter(risks, returns, color="#3B82F6", s=25, alpha=0.85, edgecolors="none")

        optimal_point = None
        for p in frontier_points:
            if p.get("optimal"):
                optimal_point = p
                break
        if not optimal_point and frontier_points:
            optimal_point = max(frontier_points, key=lambda p: float(p.get("return", 0.0)) / (float(p.get("risk", 0.001)) or 0.001))

        if optimal_point:
            opt_risk = float(optimal_point.get("risk", 0.0)) * 100.0
            opt_ret = float(optimal_point.get("return", 0.0)) * 100.0
            ax.scatter([opt_risk], [opt_ret], color="#22C55E", s=180, marker="*", edgecolors="#0F172A", zorder=5, label=f"Max Sharpe Optimal ({opt_ret:.1f}%, {opt_risk:.1f}%)")

        ax.scatter([current_vol], [current_ret], color="#06B6D4", s=100, marker="o", edgecolors="#0F172A", linewidth=1.5, zorder=6, label=f"Current Portfolio ({current_ret:.1f}%, {current_vol:.1f}%)")

        ax.set_xlabel("Annualized Volatility Risk σ (%)", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_ylabel("Expected Return (%)", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_title("Markowitz Efficient Frontier & Portfolio Risk-Return Optimization", fontsize=11, fontweight="bold", color="#0F172A", pad=10)
        ax.grid(True, linestyle="--", alpha=0.5, color="#CBD5E1")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.legend(loc="lower right", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", fontsize=8)

        plt.tight_layout()
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_frontier.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate efficient frontier chart: {e}")
        return None


def _generate_monte_carlo_chart(mc_result: Dict[str, Any], years: int) -> Optional[str]:
    try:
        final_values = mc_result.get("final_values", [])
        if not final_values:
            return None

        fig, ax = plt.subplots(figsize=(6.2, 3.6), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        median_val = float(mc_result.get("median_value", np.median(final_values)))
        best_val = float(mc_result.get("best_case", np.percentile(final_values, 90)))
        worst_val = float(mc_result.get("worst_case", np.percentile(final_values, 10)))

        n, bins, patches = ax.hist(final_values, bins=40, color="#60A5FA", edgecolor="#1D4ED8", alpha=0.75, density=False)

        ax.axvline(worst_val, color="#EF4444", linestyle="--", linewidth=2.0, label=f"10th Pct (Worst): ${worst_val:,.0f}")
        ax.axvline(median_val, color="#3B82F6", linestyle="-", linewidth=2.5, label=f"50th Pct (Median): ${median_val:,.0f}")
        ax.axvline(best_val, color="#22C55E", linestyle="--", linewidth=2.0, label=f"90th Pct (Best): ${best_val:,.0f}")

        ax.set_xlabel(f"Projected Terminal Wealth After {years} Years ($)", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_ylabel("Simulation Frequency", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_title(f"Monte Carlo Probability Distribution (1,000 Sim Trials over {years}Y)", fontsize=11, fontweight="bold", color="#0F172A", pad=10)
        ax.grid(axis="y", linestyle="--", alpha=0.5, color="#CBD5E1")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.legend(loc="upper right", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", fontsize=8)

        plt.tight_layout()
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_mc.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate Monte Carlo chart: {e}")
        return None


def _generate_factor_exposure_chart(factor_data: List[Dict[str, Any]]) -> Optional[str]:
    try:
        if not factor_data:
            return None

        factors = [f.get("factor", "Unknown") for f in factor_data]
        exposures = [float(f.get("exposure", 0.0) or f.get("allocation", 0.0) or 0.0) for f in factor_data]

        if not exposures or sum(exposures) <= 0:
            return None

        fig, ax = plt.subplots(figsize=(6.2, 3.2), dpi=300)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")

        y_pos = np.arange(len(factors))
        bars = ax.barh(y_pos, exposures, color="#06B6D4", height=0.55, edgecolor="#0284C7", linewidth=0.8)

        ax.set_yticks(y_pos)
        ax.set_yticklabels([str(f).title() for f in factors], fontsize=9, fontweight="bold", color="#0F172A")
        ax.invert_yaxis()
        ax.set_xlabel("Factor Weight (%)", fontsize=9, fontweight="bold", color="#64748B")
        ax.set_title("Quantitative Factor & Risk Sensitivity Profile", fontsize=11, fontweight="bold", color="#0F172A", pad=10)
        ax.grid(axis="x", linestyle="--", alpha=0.5, color="#CBD5E1")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

        for bar in bars:
            width = bar.get_width()
            ax.annotate(f"{width:.1f}%",
                        xy=(width, bar.get_y() + bar.get_height() / 2),
                        xytext=(5, 0),
                        textcoords="offset points",
                        ha="left", va="center", fontsize=8, fontweight="bold", color="#0F172A")

        plt.tight_layout()
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix="_factor.png").name
        plt.savefig(tmp_file, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
        plt.close(fig)
        return tmp_file
    except Exception as e:
        logger.warning(f"Failed to generate factor exposure chart: {e}")
        return None


# -------------------------------------------------------------------------
# Existing Required Version & Helper Logic (Preserved Signatures)
# -------------------------------------------------------------------------
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


# -------------------------------------------------------------------------
# Core Institutional PDF Builder
# -------------------------------------------------------------------------
def _build_portfolio_pdf(
    portfolio_id: int,
    db: Session,
    pdf_path: Path,
):
    """
    Completely redesigned PDF generation engine that builds a professional,
    institutional-quality portfolio analytics report using ReportLab & Matplotlib.
    Adheres strictly to existing backend services without duplicating math or
    breaking any endpoints/schemas.
    """
    # 1. Fetch Core Data via Existing Backend Services
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    portfolio_name = portfolio.name if portfolio else f"Portfolio #{portfolio_id}"
    user_id = portfolio.user_id if portfolio else None

    profile = db.query(InvestorProfile).filter(InvestorProfile.user_id == user_id).first() if user_id else None
    goal = db.query(Goal).filter(Goal.user_id == user_id).first() if user_id else None

    health = get_portfolio_health(portfolio_id)
    valuation_metrics = calculate_live_portfolio_value_and_returns(db, portfolio_id)
    total_value = float(valuation_metrics.get("total_value", 0.0))
    total_invested = float(valuation_metrics.get("total_invested", 0.0))
    total_return_pct = float(valuation_metrics.get("total_return_pct", 0.0))
    todays_gain_loss_amt = float(valuation_metrics.get("todays_gain_loss_amt", 0.0))
    todays_gain_loss_pct = float(valuation_metrics.get("todays_gain_loss_pct", 0.0))

    valuations = calculate_live_asset_valuations(db, portfolio_id)
    assets = [v["asset"] for v in valuations] if valuations else []

    benchmark = get_benchmark_comparison(db, portfolio_id)
    benchmark["status"] = "Outperforming" if benchmark.get("alpha", 0) >= 0 else "Underperforming"

    risk_metrics = get_portfolio_risk(portfolio_id)
    diversification = get_diversification_score(portfolio_id)
    alloc_breakdown = calculate_allocation_breakdown(db, portfolio_id)
    exposure_summary = calculate_exposure(db, portfolio_id)

    # Rebalance & Recommendations
    if profile:
        rebalance = get_rebalance_recommendation(profile)
        opt_recommendations = get_recommendations(profile).recommendations
        risk_profile_str = determine_risk_profile(profile)
    else:
        rebalance = None
        opt_recommendations = ["Create an investor profile to receive tailored optimization recommendations."]
        risk_profile_str = "Balanced / Moderate"

    # Historical Snapshots
    history = get_performance_history(db, portfolio_id, "max")

    # Efficient Frontier
    frontier_points = generate_efficient_frontier(assets)

    # Monte Carlo & Goal Probability
    mc_years = 10
    if goal:
        goal_metrics = populate_goal_metrics(db, goal)
        mc_years = max(1, goal.target_date.year - date.today().year) if getattr(goal, "target_date", None) else 10
        mc_result = run_monte_carlo(
            initial_amount=max(total_value, float(goal.current_amount or 0.0)),
            monthly_contribution=float(goal.monthly_contribution or 1000.0),
            expected_return=float(risk_metrics.expected_return if hasattr(risk_metrics, "expected_return") else 12.0),
            volatility=float(risk_metrics.volatility if hasattr(risk_metrics, "volatility") else 15.0),
            years=mc_years,
            simulations=1000,
        )
    else:
        goal_metrics = None
        mc_result = run_monte_carlo(
            initial_amount=max(total_value, 100000.0),
            monthly_contribution=1000.0,
            expected_return=float(risk_metrics.expected_return if hasattr(risk_metrics, "expected_return") else 12.0),
            volatility=float(risk_metrics.volatility if hasattr(risk_metrics, "volatility") else 15.0),
            years=mc_years,
            simulations=1000,
        )

    # Factor Exposure
    try:
        factor_data = get_factor_exposure(portfolio_id, db)
    except Exception:
        factor_data = exposure_summary

    # 2. Generate Matplotlib Charts
    temp_images: List[str] = []
    pie_img = _generate_allocation_pie_chart(alloc_breakdown)
    if pie_img:
        temp_images.append(pie_img)

    sector_img = _generate_sector_bar_chart(valuations, total_value)
    if sector_img:
        temp_images.append(sector_img)

    perf_img = _generate_performance_chart(history, benchmark, total_return_pct)
    if perf_img:
        temp_images.append(perf_img)

    frontier_img = _generate_efficient_frontier_chart(frontier_points, float(risk_metrics.volatility), float(benchmark.get("portfolio_return", total_return_pct)))
    if frontier_img:
        temp_images.append(frontier_img)

    mc_img = _generate_monte_carlo_chart(mc_result, mc_years)
    if mc_img:
        temp_images.append(mc_img)

    factor_img = _generate_factor_exposure_chart(factor_data)
    if factor_img:
        temp_images.append(factor_img)

    # 3. Setup ReportLab Document & Styles
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Typography Inspired by Institutional Financial Reports
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=TEXT_LIGHT,
        alignment=1,
    )
    cover_subtitle = ParagraphStyle(
        "CoverSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=SECONDARY_CYAN,
        alignment=1,
    )
    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=NAVY_HEADER_BG,
        spaceBefore=14,
        spaceAfter=8,
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=PRIMARY_DARK,
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=8,
    )
    body_bold = ParagraphStyle(
        "BodyBoldDark",
        parent=body_style,
        fontName="Helvetica-Bold",
    )
    table_head_style = ParagraphStyle(
        "TableHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_LIGHT,
        alignment=1,
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=table_cell_style,
        fontName="Helvetica-Bold",
    )
    table_cell_green = ParagraphStyle(
        "TableCellGreen",
        parent=table_cell_style,
        fontName="Helvetica-Bold",
        textColor=SUCCESS_GREEN,
    )
    table_cell_red = ParagraphStyle(
        "TableCellRed",
        parent=table_cell_style,
        fontName="Helvetica-Bold",
        textColor=ERROR_RED,
    )
    kpi_title_style = ParagraphStyle(
        "KpiTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=1,
    )
    kpi_value_style = ParagraphStyle(
        "KpiValue",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=NAVY_HEADER_BG,
        alignment=1,
    )
    kpi_sub_style = ParagraphStyle(
        "KpiSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=PRIMARY_BLUE,
        alignment=1,
    )

    content: List[Any] = []

    try:
        # =========================================================================
        # SECTION 1: COVER PAGE (Institutional Dark Navy Theme)
        # =========================================================================
        cover_table_data = [
            [Paragraph("PORTFOLIO INTELLIGENCE & RISK ANALYTICS PLATFORM", cover_subtitle)],
            [Spacer(1, 15)],
            [Paragraph("INSTITUTIONAL PORTFOLIO PERFORMANCE & RISK REPORT", title_style)],
            [Spacer(1, 10)],
            [Paragraph(f"Comprehensive Multi-Factor Analytics & Strategic Allocation Review<br/><b>{portfolio_name.upper()}</b>", ParagraphStyle("CoverDesc", parent=cover_subtitle, textColor=TEXT_LIGHT, fontSize=11, leading=16))],
        ]
        cover_banner = Table(cover_table_data, colWidths=[letter[0] - 108])
        cover_banner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY_HEADER_BG),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 36),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 36),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
            ("RIGHTPADDING", (0, 0), (-1, -1), 20),
            ("BOX", (0, 0), (-1, -1), 2, PRIMARY_BLUE),
        ]))
        content.append(cover_banner)
        content.append(Spacer(1, 30))

        # Metadata & Client Profile Box
        meta_left = [
            Paragraph("<b>PORTFOLIO SPECIFICATION</b>", h2_style),
            Paragraph(f"<b>Portfolio Name:</b> {portfolio_name}", body_style),
            Paragraph(f"<b>Portfolio ID:</b> #{portfolio_id}", body_style),
            Paragraph(f"<b>Account Owner ID:</b> #{user_id if user_id else 'Private Client'}", body_style),
            Paragraph(f"<b>Live Market Valuation:</b> USD ${total_value:,.2f}", body_style),
            Paragraph(f"<b>Total Invested Principal:</b> USD ${total_invested:,.2f}", body_style),
        ]
        meta_right = [
            Paragraph("<b>REPORT METADATA & PROFILE</b>", h2_style),
            Paragraph(f"<b>Report Version:</b> Institutional Release v{_next_report_version(portfolio_id, db, REPORT_TYPE_PORTFOLIO)}", body_style),
            Paragraph(f"<b>Generated Date (UTC):</b> {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M')}", body_style),
            Paragraph(f"<b>Investor Risk Profile:</b> {risk_profile_str}", body_style),
            Paragraph(f"<b>Investment Horizon:</b> {profile.investment_horizon if profile else 10} Years Target", body_style),
            Paragraph(f"<b>Target Wealth Goal:</b> USD ${float(goal.target_amount):,.2f}" if goal else "<b>Target Wealth Goal:</b> Not Established", body_style),
        ]
        meta_table = Table([[meta_left, meta_right]], colWidths=[(letter[0] - 108) / 2.0] * 2)
        meta_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, -1), TABLE_ROW_ALT),
            ("BOX", (0, 0), (-1, -1), 1, SLATE_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ]))
        content.append(meta_table)
        content.append(Spacer(1, 25))

        # Confidentiality Disclosure Box
        conf_text = Paragraph(
            "<b>CONFIDENTIALITY NOTICE & LEGAL DISCLAIMER:</b> This institutional report contains proprietary quantitative risk models, efficient frontier allocations, and Monte Carlo wealth projections prepared exclusively for the designated account holder by the StratFolio Intelligence Platform. The simulations, historical tracking, and multi-factor analyses contained herein are for strategic advisory purposes only and do not constitute guaranteed future performance or direct tax/legal counsel.",
            ParagraphStyle("ConfDisclaimer", parent=body_style, fontSize=7.5, leading=11, textColor=TEXT_MUTED)
        )
        conf_table = Table([[conf_text]], colWidths=[letter[0] - 108])
        conf_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        content.append(conf_table)
        content.append(PageBreak())

        # =========================================================================
        # SECTION 2: EXECUTIVE SUMMARY WITH KPI CARDS
        # =========================================================================
        content.append(Paragraph("1. EXECUTIVE SUMMARY & KPI SCORECARD", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=12))
        content.append(Paragraph(
            f"As of the reporting timestamp, <b>{portfolio_name}</b> commands a total live valuation of <b>USD ${total_value:,.2f}</b>, generating a cumulative historical return of <b>{total_return_pct:+.2f}%</b> across {len(assets)} underlying asset positions. The portfolio achieved an overall institutional health rating of <b>{health.health_score} / 100 ({health.rating})</b>, supported by a diversification score of <b>{diversification.score} / 100 ({diversification.rating})</b>. Against its primary market benchmark (<b>{benchmark['benchmark']}</b>), the portfolio exhibits an excess alpha of <b>{benchmark['alpha']:+.2f}%</b> ({benchmark['status']}).",
            body_style
        ))
        content.append(Spacer(1, 8))

        # 3x3 KPI Cards Grid
        kpi_w = (letter[0] - 108) / 3.0
        kpi_rows = [
            [
                Table([[Paragraph("PORTFOLIO VALUE", kpi_title_style)], [Paragraph(f"${total_value:,.2f}", kpi_value_style)], [Paragraph(f"Principal: ${total_invested:,.2f}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("PORTFOLIO RETURN", kpi_title_style)], [Paragraph(f"{total_return_pct:+.2f}%", kpi_value_style)], [Paragraph(f"Today: ${todays_gain_loss_amt:+.2f}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("BENCHMARK RETURN", kpi_title_style)], [Paragraph(f"{benchmark['benchmark_return']:+.2f}%", kpi_value_style)], [Paragraph(f"Index: {benchmark['benchmark']}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
            ],
            [
                Table([[Paragraph("EXCESS ALPHA", kpi_title_style)], [Paragraph(f"{benchmark['alpha']:+.2f}%", kpi_value_style)], [Paragraph(f"Status: {benchmark['status']}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("HEALTH SCORE", kpi_title_style)], [Paragraph(f"{health.health_score} / 100", kpi_value_style)], [Paragraph(f"Rating Grade: {health.rating}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("DIVERSIFICATION", kpi_title_style)], [Paragraph(f"{diversification.score} / 100", kpi_value_style)], [Paragraph(f"Grade: {diversification.rating}", kpi_sub_style)]], colWidths=[kpi_w - 6]),
            ],
            [
                Table([[Paragraph("ANNUAL VOLATILITY σ", kpi_title_style)], [Paragraph(f"{risk_metrics.volatility:.2f}%", kpi_value_style)], [Paragraph("Risk Dispersion", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("SHARPE RATIO", kpi_title_style)], [Paragraph(f"{risk_metrics.sharpe_ratio:.2f}", kpi_value_style)], [Paragraph("Risk-Adjusted Efficiency", kpi_sub_style)]], colWidths=[kpi_w - 6]),
                Table([[Paragraph("PORTFOLIO BETA β", kpi_title_style)], [Paragraph(f"{risk_metrics.beta:.2f}", kpi_value_style)], [Paragraph("Market Correlation", kpi_sub_style)]], colWidths=[kpi_w - 6]),
            ]
        ]

        kpi_grid = Table(kpi_rows, colWidths=[kpi_w] * 3)
        kpi_grid.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, SLATE_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.75, DIVIDER_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]))
        content.append(kpi_grid)
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 3: PORTFOLIO HOLDINGS & VALUATIONS TABLE
        # =========================================================================
        content.append(Paragraph("2. PORTFOLIO HOLDINGS & VALUATION LEDGER", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        content.append(Paragraph(
            "The following ledger details every individual holding within the portfolio, displaying current market valuations, asset class classifications, weighted allocation percentages, and cumulative unrealized profit/loss figures.",
            body_style
        ))
        content.append(Spacer(1, 6))

        holdings_headers = [
            Paragraph("<b>Ticker</b>", table_head_style),
            Paragraph("<b>Asset Class</b>", table_head_style),
            Paragraph("<b>Qty</b>", table_head_style),
            Paragraph("<b>Avg Cost</b>", table_head_style),
            Paragraph("<b>Cur Price</b>", table_head_style),
            Paragraph("<b>Market Val ($)</b>", table_head_style),
            Paragraph("<b>Alloc (%)</b>", table_head_style),
            Paragraph("<b>Unrealized P/L</b>", table_head_style),
        ]
        holdings_data = [holdings_headers]

        if not valuations:
            holdings_data.append([
                Paragraph("No assets currently allocated.", table_cell_style), "", "", "", "", "", "", ""
            ])
        else:
            for val in valuations:
                asset = val["asset"]
                mv = float(val["market_value"])
                amt_inv = float(asset.amount_invested or 0.0)
                qty = float(asset.quantity or 0.0)
                if qty <= 0 and amt_inv > 0 and asset.purchase_price:
                    qty = amt_inv / float(asset.purchase_price)
                cur_price = mv / qty if qty > 0 else float(asset.purchase_price or 0.0)
                avg_cost = float(asset.purchase_price or (amt_inv / qty if qty > 0 else cur_price))
                pl_amt = mv - amt_inv
                pl_pct = (pl_amt / amt_inv) * 100.0 if amt_inv > 0 else 0.0
                alloc_pct = (mv / total_value) * 100.0 if total_value > 0 else float(asset.allocation_percent or 0.0)

                pl_style = table_cell_green if pl_amt >= 0 else table_cell_red
                pl_str = f"{pl_amt:+.2f}<br/>({pl_pct:+.1f}%)"

                holdings_data.append([
                    Paragraph(f"<b>{(asset.ticker or '').upper()}</b>", table_cell_bold),
                    Paragraph(str(asset.asset_type or "Equity").title(), table_cell_style),
                    Paragraph(f"{qty:,.2f}" if qty % 1 != 0 else f"{qty:,.0f}", table_cell_style),
                    Paragraph(f"${avg_cost:,.2f}", table_cell_style),
                    Paragraph(f"${cur_price:,.2f}", table_cell_style),
                    Paragraph(f"${mv:,.2f}", table_cell_bold),
                    Paragraph(f"{alloc_pct:.2f}%", table_cell_style),
                    Paragraph(pl_str, pl_style),
                ])

            # Total Summary Row
            total_pl_amt = total_value - total_invested
            total_pl_pct = (total_pl_amt / total_invested) * 100.0 if total_invested > 0 else 0.0
            tot_style = table_cell_green if total_pl_amt >= 0 else table_cell_red
            holdings_data.append([
                Paragraph("<b>PORTFOLIO TOTAL</b>", table_cell_bold),
                Paragraph("<b>All Classes</b>", table_cell_bold),
                Paragraph("-", table_cell_bold),
                Paragraph(f"<b>Inv: ${total_invested:,.2f}</b>", table_cell_bold),
                Paragraph("-", table_cell_bold),
                Paragraph(f"<b>${total_value:,.2f}</b>", table_cell_bold),
                Paragraph("<b>100.00%</b>", table_cell_bold),
                Paragraph(f"<b>{total_pl_amt:+.2f}<br/>({total_pl_pct:+.1f}%)</b>", tot_style),
            ])

        col_w = [55, 75, 42, 60, 60, 72, 48, 88]
        holdings_table = Table(holdings_data, colWidths=col_w, repeatRows=1)
        holdings_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY_HEADER_BG),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, TABLE_ROW_ALT]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        content.append(KeepTogether([holdings_table]))
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 4: ASSET ALLOCATION PIE CHART & SECTOR BAR CHART
        # =========================================================================
        content.append(Paragraph("3. ASSET ALLOCATION & MACRO SECTOR BREAKDOWN", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        content.append(Paragraph(
            "Multi-asset class balance ensures capital preservation and limits downside concentration risk during market volatility. Below left is the portfolio's allocation breakdown by primary asset class, alongside the granular macro sector distribution across global equity, fixed income, and digital asset markets.",
            body_style
        ))
        content.append(Spacer(1, 6))

        charts_row = []
        if pie_img and os.path.exists(pie_img):
            charts_row.append(Image(pie_img, width=(letter[0] - 116) / 2.0, height=2.3 * inch))
        else:
            charts_row.append(Paragraph("Asset allocation chart unavailable.", body_style))

        if sector_img and os.path.exists(sector_img):
            charts_row.append(Image(sector_img, width=(letter[0] - 116) / 2.0, height=2.3 * inch))
        else:
            charts_row.append(Paragraph("Sector allocation data unavailable.", body_style))

        charts_table = Table([charts_row], colWidths=[(letter[0] - 108) / 2.0] * 2)
        charts_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        content.append(KeepTogether([charts_table]))
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 5: BENCHMARK PERFORMANCE COMPARISON
        # =========================================================================
        content.append(Paragraph("4. PORTFOLIO VS. BENCHMARK PERFORMANCE TRACKING", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        content.append(Paragraph(
            f"Evaluating portfolio trajectory against standard market indices provides transparency into investment manager skill and risk-adjusted efficiency. The portfolio is currently benchmarked against the <b>{benchmark['benchmark']}</b> index, generating an excess return (Alpha) of <b>{benchmark['alpha']:+.2f}%</b>.",
            body_style
        ))
        content.append(Spacer(1, 6))

        if perf_img and os.path.exists(perf_img):
            perf_flowable = Image(perf_img, width=letter[0] - 108, height=2.8 * inch)
            content.append(KeepTogether([perf_flowable]))
            content.append(Spacer(1, 14))

        # =========================================================================
        # SECTION 6: RISK ANALYSIS & QUANTITATIVE INTERPRETATION
        # =========================================================================
        content.append(Paragraph("5. QUANTITATIVE RISK ANALYSIS & INTERPRETATION", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        
        # Risk Table Left, Interpretation Right
        risk_headers = [Paragraph("<b>Risk Metric</b>", table_head_style), Paragraph("<b>Value</b>", table_head_style), Paragraph("<b>Status / Profile</b>", table_head_style)]
        risk_data = [
            risk_headers,
            [Paragraph("Annualized Volatility (σ)", table_cell_bold), Paragraph(f"{risk_metrics.volatility:.2f}%", table_cell_style), Paragraph("Low/Balanced" if risk_metrics.volatility <= 18 else "Elevated Dispersion", table_cell_style)],
            [Paragraph("Sharpe Ratio (Rf=4%)", table_cell_bold), Paragraph(f"{risk_metrics.sharpe_ratio:.2f}", table_cell_style), Paragraph("Superior Risk-Adjusted" if risk_metrics.sharpe_ratio >= 1.0 else "Adequate Yield", table_cell_style)],
            [Paragraph("Portfolio Beta (β)", table_cell_bold), Paragraph(f"{risk_metrics.beta:.2f}", table_cell_style), Paragraph("Defensive (< 1.0)" if risk_metrics.beta < 0.95 else ("Market Neutral" if risk_metrics.beta <= 1.05 else "Aggressive Sensitivity"), table_cell_style)],
            [Paragraph("Maximum Drawdown (MDD)", table_cell_bold), Paragraph(f"{risk_metrics.max_drawdown:.2f}%", table_cell_style), Paragraph("Downside Tail Limit", table_cell_style)],
            [Paragraph("Concentration Risk Grade", table_cell_bold), Paragraph(f"{diversification.rating}", table_cell_bold), Paragraph(f"Score: {diversification.score} / 100", table_cell_style)],
        ]
        risk_table = Table(risk_data, colWidths=[140, 65, 115])
        risk_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY_HEADER_BG),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_ROW_ALT]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        # Dynamic Institutional Textual Interpretation
        vol_comment = f"• <b>Volatility Profile ({risk_metrics.volatility:.2f}% σ):</b> " + ("The portfolio exhibits defensive stability with standard deviation well below equity averages, minimizing short-term capital drawdowns." if risk_metrics.volatility <= 14 else ("The portfolio reflects a balanced growth posture, experiencing moderate return dispersion characteristic of diversified equity-debt allocations." if risk_metrics.volatility <= 22 else "The portfolio operates with elevated volatility, indicating aggressive exposure to high-beta growth assets or digital currencies."))
        sharpe_comment = f"• <b>Sharpe Efficiency ({risk_metrics.sharpe_ratio:.2f}):</b> " + ("Superior risk-adjusted yield generation. Every unit of volatility undertaken yields more than proportionate excess return over the risk-free rate." if risk_metrics.sharpe_ratio >= 1.0 else ("Satisfactory risk compensation. The portfolio generates positive excess return, though selective factor rebalancing could further optimize yield." if risk_metrics.sharpe_ratio >= 0.5 else "Sub-optimal risk compensation. High return dispersion is not currently rewarded with commensurate excess profit over risk-free instruments."))
        beta_comment = f"• <b>Market Sensitivity ({risk_metrics.beta:.2f} β):</b> " + ("Defensive posture. The portfolio will experience less severe declines during equity bear markets, but may lag during aggressive bull runs." if risk_metrics.beta < 0.85 else ("Market-neutral correlation. The portfolio tracks broader macroeconomic swings with proportional sensitivity." if risk_metrics.beta <= 1.08 else "Amplified market sensitivity. The portfolio acts as a leveraged play on market momentum, outperforming in bull markets but exposed to sharper contractions."))
        mdd_comment = f"• <b>Downside Drawdown ({risk_metrics.max_drawdown:.2f}% MDD):</b> Historical or simulated peak-to-trough capital contraction limit. Diversification across non-correlated asset classes helps contain maximum tail-risk exposure."

        interp_box = [
            Paragraph("<b>INSTITUTIONAL QUANTITATIVE COMMENTARY</b>", h2_style),
            Paragraph(vol_comment, body_style),
            Paragraph(sharpe_comment, body_style),
            Paragraph(beta_comment, body_style),
            Paragraph(mdd_comment, body_style),
        ]

        risk_split = Table([[risk_table, interp_box]], colWidths=[320, letter[0] - 108 - 328])
        risk_split.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (1, 0), (1, 0), 12),
            ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ]))
        content.append(KeepTogether([risk_split]))
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 7: EFFICIENT FRONTIER & MARKOWITZ OPTIMIZATION
        # =========================================================================
        content.append(Paragraph("6. MARKOWITZ EFFICIENT FRONTIER & ALLOCATION OPTIMIZATION", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        content.append(Paragraph(
            "Modern Portfolio Theory (MPT) calculates the optimal asset weights that maximize expected return for a given level of risk. The chart below plots simulated multi-asset weightings along the Efficient Frontier curve, highlighting where your current portfolio sits relative to the Maximum Sharpe Ratio optimal portfolio.",
            body_style
        ))
        content.append(Spacer(1, 6))

        if frontier_img and os.path.exists(frontier_img):
            frontier_flowable = Image(frontier_img, width=letter[0] - 108, height=2.8 * inch)
            content.append(KeepTogether([frontier_flowable]))
            content.append(Spacer(1, 14))

        # =========================================================================
        # SECTION 8: MONTE CARLO SIMULATION & FUTURE WEALTH FORECASTS
        # =========================================================================
        content.append(Paragraph(f"7. MONTE CARLO SIMULATION & {mc_years}-YEAR WEALTH PROJECTIONS", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))
        content.append(Paragraph(
            f"To project long-term capital compounding under market uncertainty, StratFolio executed <b>1,000 randomized Geometric Brownian Motion (GBM) simulation trials</b> over a {mc_years}-year investment horizon, incorporating an assumed monthly SIP contribution of <b>${float(goal.monthly_contribution if goal else 1000.0):,.2f}</b> and your portfolio's annualized volatility profile.",
            body_style
        ))
        content.append(Spacer(1, 6))

        mc_median = float(mc_result.get("median_value", 0.0))
        mc_best = float(mc_result.get("best_case", 0.0))
        mc_worst = float(mc_result.get("worst_case", 0.0))

        mc_table_headers = [Paragraph("<b>Percentile Scenario</b>", table_head_style), Paragraph("<b>Projected Terminal Wealth ($)</b>", table_head_style), Paragraph("<b>Scenario Interpretation</b>", table_head_style)]
        mc_table_data = [
            mc_table_headers,
            [Paragraph("<b>90th Percentile (Best Case)</b>", table_cell_bold), Paragraph(f"${mc_best:,.2f}", table_cell_green), Paragraph("Strong market outperformance & positive compounding shocks.", table_cell_style)],
            [Paragraph("<b>50th Percentile (Median Trajectory)</b>", table_cell_bold), Paragraph(f"${mc_median:,.2f}", table_cell_bold), Paragraph("Expected base-case capital growth along historical trendlines.", table_cell_style)],
            [Paragraph("<b>10th Percentile (Worst Case)</b>", table_cell_bold), Paragraph(f"${mc_worst:,.2f}", table_cell_red), Paragraph("Severe prolonged bear markets; downside capital floor.", table_cell_style)],
        ]
        mc_summary_table = Table(mc_table_data, colWidths=[150, 140, letter[0] - 108 - 290])
        mc_summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY_HEADER_BG),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_ROW_ALT]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        if mc_img and os.path.exists(mc_img):
            content.append(KeepTogether([Image(mc_img, width=letter[0] - 108, height=2.8 * inch), Spacer(1, 10), mc_summary_table]))
        else:
            content.append(KeepTogether([mc_summary_table]))
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 9: GOAL SUCCESS PROBABILITY & FACTOR EXPOSURE
        # =========================================================================
        content.append(Paragraph("8. FINANCIAL GOAL ATTAINMENT & QUANTITATIVE FACTOR EXPOSURE", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))

        # Goal Box Left
        if goal and goal_metrics:
            goal_prob = float(goal_metrics.get("success_probability", 0.0))
            prob_style = table_cell_green if goal_prob >= 75 else (table_cell_bold if goal_prob >= 50 else table_cell_red)
            goal_box = [
                Paragraph("<b>FINANCIAL GOAL STATUS</b>", h2_style),
                Paragraph(f"<b>Target Wealth Goal:</b> ${float(goal.target_amount):,.2f}", body_style),
                Paragraph(f"<b>Current Progress:</b> {float(goal_metrics.get('progress_percent', 0.0)):.1f}% Completed", body_style),
                Paragraph(f"<b>Remaining Goal Gap:</b> ${float(goal_metrics.get('remaining_gap', 0.0)):,.2f}", body_style),
                Paragraph(f"<b>Success Probability:</b> {goal_prob:.1f}% Attainment Chance", prob_style),
                Paragraph("<b>Advisory Note:</b> " + ("Your portfolio is on track to exceed its wealth target." if goal_prob >= 75 else "Consider slightly increasing monthly SIP contributions or optimizing asset weights to bolster goal success probability."), body_style),
            ]
        else:
            goal_box = [
                Paragraph("<b>FINANCIAL GOAL STATUS</b>", h2_style),
                Paragraph("No explicit wealth target goal is currently configured for this account.", body_style),
                Paragraph("Establishing a structured target wealth goal within StratFolio unlocks liability-driven investing (LDI) recommendations and precision Monte Carlo success probability tracking.", body_style),
            ]

        # Factor Exposure Right
        if factor_img and os.path.exists(factor_img):
            factor_flowable = Image(factor_img, width=260, height=1.9 * inch)
        else:
            factor_flowable = Paragraph("Factor exposure analysis unavailable.", body_style)

        goal_factor_split = Table([[goal_box, factor_flowable]], colWidths=[240, letter[0] - 108 - 248])
        goal_factor_split.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (1, 0), (1, 0), 12),
        ]))
        content.append(KeepTogether([goal_factor_split]))
        content.append(Spacer(1, 16))

        # =========================================================================
        # SECTION 10: REBALANCING & STRATEGIC ACTION PLAN
        # =========================================================================
        content.append(Paragraph("9. STRATEGIC REBALANCING & ADVISORY ACTION PLAN", h1_style))
        content.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_BLUE, spaceAfter=10))

        if rebalance:
            reb_headers = [Paragraph("<b>Asset Bucket</b>", table_head_style), Paragraph("<b>Current Allocation (%)</b>", table_head_style), Paragraph("<b>Target Recommended (%)</b>", table_head_style), Paragraph("<b>Rebalancing Action</b>", table_head_style)]
            reb_data = [
                reb_headers,
                [Paragraph("<b>Equity Growth</b>", table_cell_bold), Paragraph(f"{rebalance.current_equity:.1f}%", table_cell_style), Paragraph(f"{rebalance.recommended_equity:.1f}%", table_cell_style), Paragraph(str(rebalance.action), table_cell_bold)],
                [Paragraph("<b>Debt / Fixed Income</b>", table_cell_bold), Paragraph(f"{rebalance.current_debt:.1f}%", table_cell_style), Paragraph(f"{rebalance.recommended_debt:.1f}%", table_cell_style), Paragraph("Maintain Portfolio Balance", table_cell_style)],
                [Paragraph("<b>Cash Reserves</b>", table_cell_bold), Paragraph(f"{rebalance.current_cash:.1f}%", table_cell_style), Paragraph(f"{rebalance.recommended_cash:.1f}%", table_cell_style), Paragraph("Liquidity Cushion", table_cell_style)],
            ]
            reb_table = Table(reb_data, colWidths=[130, 110, 120, letter[0] - 108 - 360])
            reb_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY_HEADER_BG),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, DIVIDER_COLOR),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_ROW_ALT]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            content.append(reb_table)
            content.append(Spacer(1, 10))

        content.append(Paragraph("<b>Strategic Advisory Recommendations:</b>", h2_style))
        for rec in opt_recommendations:
            content.append(Paragraph(f"• <b>Strategic Directive:</b> {rec}", body_style))

        # Build PDF using NumberedCanvas
        doc.build(content, canvasmaker=NumberedCanvas)

    finally:
        # Clean up temporary chart files cleanly
        for tmp_img in temp_images:
            if tmp_img and os.path.exists(tmp_img):
                try:
                    os.remove(tmp_img)
                except Exception:
                    pass


# -------------------------------------------------------------------------
# Existing Required Public API & History Services (Exact Preservation)
# -------------------------------------------------------------------------
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
