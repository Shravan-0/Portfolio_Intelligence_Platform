import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";

import {
  CircularProgressbar,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import PageLoader from "../PageLoader";
import SummaryCard from "../SummaryCard";
import AnalyticsPanel from "../AnalyticsPanel";

import GuidanceAlert from "../GuidanceAlert";
import GuidancePanel from "../GuidancePanel";
import ServerErrorAlert from "../ServerErrorAlert";
import {
  GUIDANCE,
  getGuidanceForMissing
} from "../guidanceUtils";

import { getBenchmarkComparison } from "../../services/performanceService";
import { classifyApiError } from "../../utils/apiErrors";

import {
  getMissingForPage,
  resolveUserContext
} from "../../utils/userContext";
import { API_BASE_URL } from "../../config/api";


const COLOR_PRIMARY = "#3B82F6";
const COLOR_SECONDARY = "#06B6D4";
const COLOR_SUCCESS = "#22C55E";
const COLOR_ERROR = "#EF4444";
const COLOR_WARNING = "#F59E0B";
const COLOR_TEXT_PRIMARY = "#F1F5F9";
const COLOR_TEXT_SECONDARY = "#94A3B8";
const COLOR_TEXT_MUTED = "#64748B";
const COLOR_DIVIDER = "rgba(148, 163, 184, 0.10)";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatPercent = (value, digits = 1) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return `${numericValue.toFixed(digits)}%`;
};

const formatSignedPercent = (value, digits = 1) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  const sign = numericValue > 0 ? "+" : "";

  return `${sign}${numericValue.toFixed(digits)}%`;
};

const signColor = (value) => {
  const numericValue = toNumber(value);

  if (numericValue > 0) return COLOR_SUCCESS;
  if (numericValue < 0) return COLOR_ERROR;

  return COLOR_TEXT_PRIMARY;
};

const getHealthColor = (rating, score) => {
  if (rating === "Excellent" || score >= 85) return COLOR_SUCCESS;
  if (rating === "Strong" || score >= 70) return COLOR_PRIMARY;
  if (rating === "Moderate" || score >= 50) return COLOR_WARNING;

  return COLOR_ERROR;
};

const getBenchmarkStatus = (alpha) => {
  const numericAlpha = toNumber(alpha);

  if (numericAlpha > 0) {
    return {
      label: "Outperforming",
      color: COLOR_SUCCESS
    };
  }

  if (numericAlpha < 0) {
    return {
      label: "Underperforming",
      color: COLOR_ERROR
    };
  }

  return {
    label: "In Line",
    color: COLOR_TEXT_SECONDARY
  };
};

const getAllocationColor = (current, recommended) => {
  const diff = Math.abs(toNumber(current) - toNumber(recommended));

  if (diff <= 5) return COLOR_SUCCESS;
  if (diff <= 12) return COLOR_WARNING;

  return COLOR_ERROR;
};

const normalizeRecommendations = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.recommendations)) return payload.recommendations;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const getCorrelationAssets = (matrix) => {
  if (!matrix || typeof matrix !== "object") return [];

  return Object.keys(matrix);
};

function MetricLine({ label, value, color = COLOR_TEXT_PRIMARY }) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={700}
        color={color}
        textAlign="right"
      >
        {value}
      </Typography>
    </Box>
  );
}

function AllocationBar({ label, current, recommended }) {
  const currentValue = Math.max(0, Math.min(100, toNumber(current)));
  const recommendedValue = Math.max(0, Math.min(100, toNumber(recommended)));
  const color = getAllocationColor(currentValue, recommendedValue);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box display="flex" justifyContent="space-between" mb={0.75} gap={2} flexWrap="wrap">
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {formatPercent(currentValue)} current · {formatPercent(recommendedValue)} target
        </Typography>
      </Box>

      <Box sx={{ position: "relative", pt: 0.25 }}>
        <LinearProgress
          variant="determinate"
          value={currentValue}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(148,163,184,0.12)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              bgcolor: color
            }
          }}
        />
        <Box
          aria-label={`${label} recommended allocation: ${formatPercent(recommendedValue)}`}
          sx={{
            position: "absolute",
            top: -2,
            bottom: -2,
            left: `${recommendedValue}%`,
            width: 2,
            borderRadius: 1,
            bgcolor: COLOR_TEXT_SECONDARY,
            transform: "translateX(-1px)",
            boxShadow: "0 0 0 1px rgba(11,17,32,0.35)",
            pointerEvents: "none"
          }}
        />
      </Box>
    </Box>
  );
}

function RecommendationList({ recommendations }) {
  if (!recommendations.length) {
    return (
      <Box
        minHeight={160}
        display="flex"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        sx={{
          borderRadius: 4,
          bgcolor: "rgba(148,163,184,0.04)",
          border: "1px dashed rgba(148,163,184,0.16)"
        }}
      >
        <Box>
          <Typography fontWeight={700} mb={0.5}>
            No recommendations available
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Optimization suggestions will appear once enough portfolio data is available.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {recommendations.map((item, index) => (
        <Box key={`${item}-${index}`}>
          <ListItem
            disableGutters
            sx={{
              py: 1.5,
              alignItems: "flex-start"
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "rgba(59,130,246,0.12)",
                color: COLOR_PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
                flexShrink: 0,
                mt: 0.25,
                mr: 1.5
              }}
            >
              {index + 1}
            </Box>

            <ListItemText
              primary={item}
              primaryTypographyProps={{
                color: COLOR_TEXT_PRIMARY,
                fontWeight: 600,
                fontSize: "0.925rem"
              }}
            />
          </ListItem>

          {index !== recommendations.length - 1 && (
            <Divider sx={{ borderColor: COLOR_DIVIDER }} />
          )}
        </Box>
      ))}
    </List>
  );
}

function CorrelationMatrix({ correlation }) {
  const matrix = correlation?.matrix;
  const assets = getCorrelationAssets(matrix);

  if (!matrix || assets.length <= 1) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
          borderRadius: 3,
          bgcolor: "rgba(148,163,184,0.04)",
          border: "1px dashed rgba(148,163,184,0.16)"
        }}
      >
        <Typography variant="h6" color={COLOR_TEXT_SECONDARY} gutterBottom>
          Correlation Matrix Unavailable
        </Typography>

        <Typography color={COLOR_TEXT_MUTED}>
          Add at least two portfolio assets to calculate asset correlations.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        bgcolor: "transparent",
        border: `1px solid ${COLOR_DIVIDER}`,
        borderRadius: 3,
        overflowX: "auto"
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            {assets.map((asset) => (
              <TableCell key={asset} align="center">
                {asset}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {assets.map((rowAsset) => (
            <TableRow key={rowAsset} hover>
              <TableCell>
                <Typography fontWeight={800} color={COLOR_TEXT_PRIMARY}>
                  {rowAsset}
                </Typography>
              </TableCell>

              {assets.map((columnAsset) => {
                const rawValue = matrix?.[rowAsset]?.[columnAsset];
                const value = toNumber(rawValue);
                const intensity = Math.min(1, Math.abs(value));
                const isPositive = value >= 0;

                return (
                  <TableCell key={`${rowAsset}-${columnAsset}`} align="center">
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 54,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1.5,
                        bgcolor: isPositive
                          ? `rgba(34,197,94,${0.08 + intensity * 0.22})`
                          : `rgba(239,68,68,${0.08 + intensity * 0.22})`,
                        color: isPositive ? "#86EFAC" : "#FCA5A5",
                        fontWeight: 800,
                        fontSize: "0.8125rem"
                      }}
                    >
                      {value.toFixed(2)}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function OptimizationDashboard() {
  const [health, setHealth] = useState(null);
  const [rebalance, setRebalance] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [correlation, setCorrelation] = useState(null);


  const [reportBlocked, setReportBlocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guidance, setGuidance] = useState(null);

  const healthScore = toNumber(health?.health_score);
  const healthColor = getHealthColor(health?.rating, healthScore);
  const benchmarkStatus = getBenchmarkStatus(benchmark?.alpha);

  const allocationDrift = useMemo(() => {
    if (!rebalance) return 0;

    const equityDrift = Math.abs(
      toNumber(rebalance.current_equity) - toNumber(rebalance.recommended_equity)
    );

    const debtDrift = Math.abs(
      toNumber(rebalance.current_debt) - toNumber(rebalance.recommended_debt)
    );

    const cashDrift = Math.abs(
      toNumber(rebalance.current_cash) - toNumber(rebalance.recommended_cash)
    );

    return equityDrift + debtDrift + cashDrift;
  }, [rebalance]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setGuidance(null);
    setReportBlocked(false);

    try {
      const context = await resolveUserContext();

      const missing = getMissingForPage("optimization", context);

      if (missing.length) {
        setGuidance(getGuidanceForMissing(missing));
        return;
      }

      const activePortfolioId = context.portfolio.id;
      const activeProfileId = context.profile.id;

     

      const reportMissing = getMissingForPage("reports", context);
      setReportBlocked(reportMissing.length > 0);

      const benchmarkRequest = getBenchmarkComparison(activePortfolioId).then((data) => ({
        data: {
          ...data,
          status:
            Number(data.alpha || 0) >= 0
              ? "Outperforming"
              : "Underperforming"
        }
      }));

      const [
        healthResponse,
        benchmarkResponse,
        correlationResponse,
        rebalanceResponse,
        recommendationsResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/optimization/health/${activePortfolioId}`),
        benchmarkRequest,
        axios.get(`${API_BASE_URL}/analytics/correlation/${activePortfolioId}`),
        axios.get(`${API_BASE_URL}/optimization/rebalance/${activeProfileId}`),
        axios.get(`${API_BASE_URL}/optimization/recommendations/${activeProfileId}`)
      ]);

      setHealth(healthResponse.data || null);
      setBenchmark(benchmarkResponse.data || null);
      setCorrelation(correlationResponse.data || null);
      setRebalance(rebalanceResponse.data || null);
      setRecommendations(normalizeRecommendations(recommendationsResponse.data));
    } catch (err) {
      console.error("Optimization Dashboard Error:", err);
      setError(classifyApiError(err).message);
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

  if (loading) {
    return <PageLoader message="Loading optimization..." />;
  }

  if (error) {
    return <ServerErrorAlert message={error} />;
  }

  if (guidance) {
    return <GuidancePanel {...guidance} />;
  }

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={750}
            sx={{ color: COLOR_TEXT_PRIMARY, letterSpacing: "-0.02em" }}
          >
            Optimization Summary
          </Typography>
          <Typography variant="body2" sx={{ color: COLOR_TEXT_SECONDARY, mt: 0.5 }}>
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            label={benchmarkStatus.label}
            size="small"
            sx={{
              bgcolor: `${benchmarkStatus.color}18`,
              color: benchmarkStatus.color,
              border: `1px solid ${benchmarkStatus.color}35`,
              fontWeight: 700
            }}
          />

        </Stack>
      </Box>

      {reportBlocked && (
        <Box mb={3}>
          <GuidanceAlert severity="warning">
            <Typography fontWeight={600} mb={0.5}>
              {GUIDANCE.reportsNotReady.title}
            </Typography>
            {GUIDANCE.reportsNotReady.message}
          </GuidanceAlert>
        </Box>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Health Score"
            value={`${healthScore || 0}/100`}
            subtitle={health?.rating || "Portfolio rating"}
            accent={healthColor}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Alpha"
            value={formatSignedPercent(benchmark?.alpha)}
            subtitle={`vs ${benchmark?.benchmark || "benchmark"}`}
            accent={signColor(benchmark?.alpha)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Allocation Drift"
            value={formatPercent(allocationDrift)}
            subtitle="Total deviation from target"
            accent={
              allocationDrift <= 10
                ? COLOR_SUCCESS
                : allocationDrift <= 25
                  ? COLOR_WARNING
                  : COLOR_ERROR
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: "flex" }}>
          <SummaryCard
            title="Recommendations"
            value={recommendations.length}
            subtitle="Optimization actions"
            accent={COLOR_SECONDARY}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <AnalyticsPanel
            title="Portfolio Health Score"
            sx={{ minHeight: { xs: 384, lg: 412 } }}
            contentSx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <Box
              sx={{
                width: { xs: 188, sm: 220 },
                height: { xs: 188, sm: 220 },
                mx: "auto",
                mt: 1
              }}
            >
              <CircularProgressbar
                value={healthScore}
                text={`${healthScore || 0}`}
                styles={buildStyles({
                  textColor: healthColor,
                  pathColor: healthColor,
                  trailColor: "rgba(148,163,184,0.12)",
                  textSize: "18px",
                  pathTransitionDuration: 0.5
                })}
              />
            </Box>

            <Box textAlign="center" mt={3}>
              <Typography variant="h5" fontWeight={800} color={healthColor}>
                {health?.rating || "Unrated"}
              </Typography>

              <Typography variant="body2" color="text.secondary" mt={1}>
                Composite score based on diversification, allocation balance and risk positioning.
              </Typography>
            </Box>
          </AnalyticsPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <AnalyticsPanel
            title="Benchmark Comparison"
            sx={{ minHeight: { xs: 384, lg: 412 } }}
            contentSx={{ display: "flex", flexDirection: "column" }}
          >
            <Stack spacing={2.25} sx={{ height: "100%", justifyContent: "space-between" }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: `${benchmarkStatus.color}12`,
                  border: `1px solid ${benchmarkStatus.color}28`
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  RELATIVE PERFORMANCE
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  mt={1}
                  color={benchmarkStatus.color}
                >
                  {formatSignedPercent(benchmark?.alpha)}
                </Typography>

                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {benchmarkStatus.label} {benchmark?.benchmark || "benchmark"}
                </Typography>
              </Box>

              <MetricLine
                label="Portfolio Return"
                value={formatPercent(benchmark?.portfolio_return)}
                color={signColor(benchmark?.portfolio_return)}
              />

              <MetricLine
                label="Benchmark"
                value={benchmark?.benchmark || "S&P 500"}
              />

              <MetricLine
                label="Benchmark Return"
                value={formatPercent(benchmark?.benchmark_return)}
                color={signColor(benchmark?.benchmark_return)}
              />

              <Divider />

              <MetricLine
                label="Status"
                value={benchmark?.status || benchmarkStatus.label}
                color={benchmarkStatus.color}
              />
            </Stack>
          </AnalyticsPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex" }}>
          <AnalyticsPanel
            title="Rebalance Summary"
            sx={{ minHeight: { xs: 384, lg: 412 } }}
            contentSx={{ display: "flex", flexDirection: "column" }}
          >
            <Stack spacing={2.5} sx={{ height: "100%", justifyContent: "space-between" }}>
              <AllocationBar
                label="Equity"
                current={rebalance?.current_equity}
                recommended={rebalance?.recommended_equity}
              />

              <AllocationBar
                label="Debt"
                current={rebalance?.current_debt}
                recommended={rebalance?.recommended_debt}
              />

              <AllocationBar
                label="Cash"
                current={rebalance?.current_cash}
                recommended={rebalance?.recommended_cash}
              />

              <Divider />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.18)"
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  RECOMMENDED ACTION
                </Typography>

                <Typography fontWeight={800} color={COLOR_PRIMARY} mt={1}>
                  {rebalance?.action || "Maintain current allocation"}
                </Typography>
              </Box>
            </Stack>
          </AnalyticsPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }} sx={{ display: "flex" }}>
          <AnalyticsPanel title="Correlation Matrix" sx={{ minHeight: 300 }}>
            <CorrelationMatrix correlation={correlation} />
          </AnalyticsPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: "flex" }}>
          <AnalyticsPanel title="Optimization Recommendations" sx={{ minHeight: 300 }}>
            <RecommendationList recommendations={recommendations} />
          </AnalyticsPanel>
        </Grid>
      </Grid>
    </>
  );
}
