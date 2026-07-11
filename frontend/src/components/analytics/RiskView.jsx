import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Typography,
  Button,
  Skeleton,
  Chip,
  Divider
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import SummaryCard from "../SummaryCard";
import AnalyticsPanel from "../AnalyticsPanel";
import GuidancePanel from "../GuidancePanel";
import ServerErrorAlert from "../ServerErrorAlert";
import {
  GUIDANCE,
  getGuidanceForMissing
} from "../guidanceUtils";
import { classifyApiError } from "../../utils/apiErrors";
import { getMissingForPage, resolveUserContext } from "../../utils/userContext";
import { API_BASE_URL } from "../../config/api";

// ── Theme-aligned semantic colors ──
const C_PRIMARY = "#3B82F6";
const C_SECONDARY = "#06B6D4";
const C_SUCCESS = "#22C55E";
const C_ERROR = "#EF4444";
const C_WARNING = "#F59E0B";
const C_TEXT_PRIMARY = "#F1F5F9";
const C_TEXT_SECONDARY = "#94A3B8";
const C_TEXT_MUTED = "#64748B";
const C_GRID = "rgba(148, 163, 184, 0.12)";
const C_BORDER = "rgba(148, 163, 184, 0.10)";

const ALLOCATION_COLORS = [C_PRIMARY, C_SUCCESS, C_WARNING];

const chartTooltipStyle = {
  backgroundColor: "#0B1120",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 2,
  color: C_TEXT_PRIMARY,
  fontSize: "0.8125rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
};



const formatNumber = (value) => {
  const n = Number(value || 0);
  return Number.isNaN(n) ? "--" : n.toFixed(2);
};

const getRiskProfileColor = (profile) => {
  const p = (profile || "").toLowerCase();
  if (p.includes("aggressive")) return C_ERROR;
  if (p.includes("moderate")) return C_WARNING;
  if (p.includes("conservative")) return C_PRIMARY;
  return C_SUCCESS;
};

const getRiskProfileBg = (profile) => {
  const p = (profile || "").toLowerCase();
  if (p.includes("aggressive")) return "rgba(239,68,68,0.12)";
  if (p.includes("moderate")) return "rgba(245,158,11,0.12)";
  if (p.includes("conservative")) return "rgba(59,130,246,0.12)";
  return "rgba(34,197,94,0.12)";
};

const AllocationTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <Box
      sx={{
        bgcolor: "#0B1120",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 2,
        px: 1.5,
        py: 1,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
      }}
    >
      <Typography variant="body2" sx={{ color: C_TEXT_PRIMARY, fontWeight: 700 }}>
        {item.name}
      </Typography>
      <Typography variant="caption" sx={{ color: C_TEXT_SECONDARY }}>
        {Number(item.value || 0).toFixed(1)}% allocation
      </Typography>
    </Box>
  );
};

export default function RiskDashboard() {
  const [risk, setRisk] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [diversification, setDiversification] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guidance, setGuidance] = useState(null);

 

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setGuidance(null);

    try {
      const context = await resolveUserContext();
      const missing = getMissingForPage("risk", context);

      if (missing.length) {
        if (missing[0] === "profile" && context.hasPortfolio && context.hasAssets) {
          setGuidance(GUIDANCE.profileRequiredRisk);
        } else {
          setGuidance(getGuidanceForMissing(missing));
        }
        setLoading(false);
        return;
      }

      const activePortfolioId = context.portfolio.id;
      const profileId = context.profile.id;

     const results = await Promise.all([
  axios.get(`${API_BASE_URL}/risk/portfolio/${activePortfolioId}`),
  axios.get(`${API_BASE_URL}/risk/allocation/${activePortfolioId}`),
  axios.get(`${API_BASE_URL}/risk/diversification/${activePortfolioId}`),
  axios.get(`${API_BASE_URL}/risk/profile/${profileId}`)
]);

      setRisk(results[0].data);
      setAllocation(results[1].data);
      setDiversification(results[2].data);
      setProfile(results[3].data);
    } catch (err) {
      console.error("Risk Dashboard Error:", err);
      const classified = classifyApiError(err);
      if (classified.type === "missing") {
        setGuidance(getGuidanceForMissing(["profile"]));
      } else {
        setError(classified.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        await loadData();
    };

    init();
}, []);

  const allocationData = allocation
    ? [
        { name: "Equity", value: Number(allocation.equity || 0) },
        { name: "Debt", value: Number(allocation.debt || 0) },
        { name: "Cash", value: Number(allocation.cash || 0) }
      ].filter((d) => d.value > 0)
    : [];

  const riskMetricsData = risk
    ? [
        { metric: "Volatility", value: Number(risk.volatility || 0) },
        { metric: "Sharpe", value: Number(risk.sharpe_ratio || 0) },
        { metric: "Drawdown", value: Math.abs(Number(risk.max_drawdown || 0)) },
        { metric: "Beta", value: Number(risk.beta || 0) }
      ]
    : [];

  if (loading) {
    return (
      <>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={260} height={40} sx={{ bgcolor: "rgba(148,163,184,0.08)" }} />
          <Skeleton variant="text" width={420} height={20} sx={{ bgcolor: "rgba(148,163,184,0.08)", mt: 0.5 }} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Skeleton variant="rounded" height={148} sx={{ bgcolor: "rgba(148,163,184,0.08)", borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={380} sx={{ bgcolor: "rgba(148,163,184,0.08)", borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={380} sx={{ bgcolor: "rgba(148,163,184,0.08)", borderRadius: 3 }} />
          </Grid>
        </Grid>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: C_TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
            
          </Typography>
        </Box>
        <ServerErrorAlert message={error} />
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={loadData}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}
          >
            Retry
          </Button>
        </Box>
      </>
    );
  }

  if (guidance) {
    return (
      <>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: C_TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
            
          </Typography>
        </Box>
        <GuidancePanel {...guidance} />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={750}
            sx={{ color: C_TEXT_PRIMARY, letterSpacing: "-0.02em" }}
          >
            Risk Overview
          </Typography>
          <Typography variant="body2" sx={{ color: C_TEXT_SECONDARY, mt: 0.5 }}>
  
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={loadData}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
            borderColor: "rgba(148,163,184,0.20)",
            color: "#94A3B8",
            "&:hover": {
              borderColor: "rgba(148,163,184,0.40)",
              bgcolor: "rgba(148,163,184,0.06)"
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Volatility"
            value={formatNumber(risk?.volatility)}
            subtitle="Annualized Std. Dev."
            accent={C_PRIMARY}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Sharpe Ratio"
            value={formatNumber(risk?.sharpe_ratio)}
            subtitle="Risk-adjusted Return"
            accent={C_SUCCESS}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Max Drawdown"
            value={formatNumber(risk?.max_drawdown)}
            subtitle="Peak to Trough"
            accent={C_ERROR}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Beta"
            value={formatNumber(risk?.beta)}
            subtitle="Market Sensitivity"
            accent={C_SECONDARY}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Asset Allocation Pie */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <AnalyticsPanel
            title="Asset Allocation"
            sx={{ minHeight: { xs: 420, sm: 454 } }}
            contentSx={{ display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ width: "100%", height: { xs: 260, sm: 304 }, position: "relative" }}>
              {allocationData.length === 0 ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  flexDirection="column"
                  gap={1}
                >
                  <Typography sx={{ color: C_TEXT_MUTED, fontWeight: 500 }}>
                    No allocation data available.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius="40%"
                      outerRadius="65%"
                      paddingAngle={3}
                      labelLine={false}
                      label={renderAllocationLabel}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={entry.name} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<AllocationTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
              {allocationData.map((item, idx) => (
                <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]
                    }}
                  />
                  <Typography variant="caption" sx={{ color: C_TEXT_SECONDARY, fontWeight: 600 }}>
                    {item.name} {item.value.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </AnalyticsPanel>
        </Grid>

        {/* Risk Metrics Bar Chart + Profile */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <AnalyticsPanel
            title="Risk Metrics Overview"
            sx={{ minHeight: { xs: 420, sm: 454 } }}
            contentSx={{ display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ width: "100%", height: { xs: 210, sm: 228 }, position: "relative" }}>
              {riskMetricsData.length === 0 ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                >
                  <Typography sx={{ color: C_TEXT_MUTED, fontWeight: 500 }}>
                    No risk metrics available.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskMetricsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={C_GRID} vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="metric"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: C_TEXT_MUTED, fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: C_TEXT_MUTED, fontSize: 12 }}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "rgba(148,163,184,0.06)" }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      fill={C_PRIMARY}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>

            <Divider sx={{ borderColor: C_BORDER, my: 2.5 }} />

            {/* Diversification & Profile */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, flex: 1, justifyContent: "space-evenly" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: C_TEXT_MUTED, fontWeight: 600 }}>
                    Diversification Score
                  </Typography>
                  <Typography variant="h6" fontWeight={700} mt={0.5} sx={{ color: C_TEXT_PRIMARY }}>
                    {diversification?.score ?? "--"}
                  </Typography>
                </Box>
                <Chip
                  label={diversification?.rating || "N/A"}
                  sx={{
                    bgcolor: `${getRiskProfileColor(diversification?.rating)}15`,
                    color: getRiskProfileColor(diversification?.rating),
                    fontWeight: 700,
                    borderRadius: 2,
                    border: `1px solid ${getRiskProfileColor(diversification?.rating)}30`
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: C_TEXT_MUTED, fontWeight: 600 }}>
                    Risk Score
                  </Typography>
                  <Typography variant="h6" fontWeight={700} mt={0.5} sx={{ color: C_TEXT_PRIMARY }}>
                    {profile?.risk_score ?? "--"}
                  </Typography>
                </Box>
                <Chip
                  label={profile?.risk_profile || "N/A"}
                  sx={{
                    bgcolor: getRiskProfileBg(profile?.risk_profile),
                    color: getRiskProfileColor(profile?.risk_profile),
                    fontWeight: 700,
                    borderRadius: 2,
                    border: `1px solid ${getRiskProfileColor(profile?.risk_profile)}30`
                  }}
                />
              </Box>
            </Box>
          </AnalyticsPanel>
        </Grid>
      </Grid>
    </>
  );
}

/* ---------- Subcomponents ---------- */

function renderAllocationLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const radians = (Math.PI / 180) * -midAngle;
  const x = cx + radius * Math.cos(radians);
  const y = cy + radius * Math.sin(radians);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {Math.round(percent * 100)}%
    </text>
  );
}
