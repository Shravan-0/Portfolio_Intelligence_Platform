import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Button
} from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import PageLoader from "../components/PageLoader";
import {
  GuidancePanel,
  GuidanceAlert,
  ServerErrorAlert,
  GUIDANCE
} from "../components/GuidancePanel";
import {
  getBenchmarkComparison,
  getPerformanceHistory,
  getPortfolioScorecard,
  getPortfolioAnalytics
} from "../services/performanceService";
import { classifyApiError } from "../utils/apiErrors";
import {
  getMissingForPage,
  resolveUserContext
} from "../utils/userContext";

const currencyFormatter =
  new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  );

const formatAmount = (value) =>
  currencyFormatter.format(
    Number(value || 0)
  );

const formatPercent = (value) =>
  `${Number(value || 0).toFixed(1)}%`;

const formatSignedPercent = (value) => {
  const numericValue = Number(value || 0);
  const sign =
    numericValue > 0
      ? "+"
      : "";

  return `${sign}${numericValue.toFixed(1)}%`;
};

const formatColoredMetric = (pctValue, amtValue = null) => {
  const numericPct = Number(pctValue || 0);
  const isPositive = numericPct > 0;
  const isNegative = numericPct < 0;
  const color = isPositive ? "#22C55E" : isNegative ? "#EF4444" : "#FFFFFF";
  const sign = isPositive ? "+" : "";

  let displayStr = `${sign}${numericPct.toFixed(2)}%`;
  if (amtValue !== null) {
    const numericAmt = Number(amtValue || 0);
    const amtSign = numericAmt > 0 ? "+" : "";
    displayStr = `${amtSign}${formatAmount(numericAmt)} (${displayStr})`;
  }

  return (
    <Box component="span" sx={{ color, fontSize: amtValue !== null ? "1.4rem" : "2.0rem" }}>
      {displayStr}
    </Box>
  );
};

const formatColoredPercent = (pctValue) => {
  const numericPct = Number(pctValue || 0);
  const isPositive = numericPct > 0;
  const isNegative = numericPct < 0;
  const color = isPositive ? "#22C55E" : isNegative ? "#EF4444" : "#FFFFFF";
  const sign = isPositive ? "+" : "";
  return (
    <Box component="span" sx={{ color, fontSize: "2.0rem" }}>
      {sign}{numericPct.toFixed(2)}%
    </Box>
  );
};

const formatColoredAmount = (amtValue) => {
  const numericAmt = Number(amtValue || 0);
  const isPositive = numericAmt > 0;
  const isNegative = numericAmt < 0;
  const color = isPositive ? "#22C55E" : isNegative ? "#EF4444" : "#FFFFFF";
  const sign = isPositive ? "+" : "";
  return (
    <Box component="span" sx={{ color, fontSize: "2.0rem" }}>
      {sign}{formatAmount(numericAmt)}
    </Box>
  );
};

export default function DashboardPage() {
  const [history, setHistory] =
    useState([]);
  const [benchmark, setBenchmark] =
    useState(null);
  const [scorecard, setScorecard] =
    useState(null);
  const [analytics, setAnalytics] =
    useState(null);
  const [selectedPeriod, setSelectedPeriod] =
    useState("MAX");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState(null);
  const [context, setContext] =
    useState(null);
  const [setupMode, setSetupMode] =
    useState(null);

  const handlePeriodChange = async (period) => {
    if (!context || !context.portfolio) return;
    setSelectedPeriod(period);
    try {
      const historyData = await getPerformanceHistory(
        context.portfolio.id,
        period.toLowerCase()
      );
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      setSetupMode(null);

      try {
        const userContext =
          await resolveUserContext();

        setContext(userContext);

        if (!userContext.hasProfile) {
  setSetupMode("needsProfile");
  return;
}

if (!userContext.hasGoal) {
  setSetupMode("needsGoal");
  return;
}

if (!userContext.hasPortfolio) {
  setSetupMode("needsPortfolio");
  return;
}

if (!userContext.hasAssets) {
  setSetupMode("needsAssets");
  return;
}
        const missing =
          getMissingForPage(
            "portfolio",
            userContext
          );

        if (missing.length) {
          setSetupMode("needsPortfolio");
          return;
        }

        const portfolioId =
          userContext.portfolio.id;

        const [
          historyData,
          benchmarkData,
          scorecardData,
          analyticsData
        ] = await Promise.all([
          getPerformanceHistory(
            portfolioId,
            selectedPeriod.toLowerCase()
          ),
          getBenchmarkComparison(
            portfolioId
          ),
          getPortfolioScorecard(
            portfolioId
          ),
          getPortfolioAnalytics(
            portfolioId
          )
        ]);

        setHistory(historyData);
        setBenchmark(benchmarkData);
        setScorecard(scorecardData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error(err);
        setError(
          classifyApiError(err).message
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData =
    useMemo(
      () =>
        history.map((item) => ({
          date: new Date(
            item.date
          ).toLocaleDateString(
            "en-IN",
            {
              month: "short",
              day: "numeric"
            }
          ),
          value: item.portfolio_value
        })),
      [history]
    );

  const latestValue =
    history.length
      ? history[
        history.length - 1
      ].portfolio_value
      : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ServerErrorAlert message={error} />
      </DashboardLayout>
    );
  }

  if (setupMode === "needsProfile") {
  return (
    <DashboardLayout>
      <GuidancePanel {...GUIDANCE.profileNotFound} />
    </DashboardLayout>
  );
}

if (setupMode === "needsGoal") {
  return (
    <DashboardLayout>
      <GuidancePanel {...GUIDANCE.goalNotFound} />
    </DashboardLayout>
  );
}

if (setupMode === "needsPortfolio") {
  return (
    <DashboardLayout>
      <GuidancePanel {...GUIDANCE.portfolioNotFound} />
    </DashboardLayout>
  );
}

if (setupMode === "needsAssets") {
  return (
    <DashboardLayout>
      <GuidancePanel {...GUIDANCE.portfolioNoAssets} />
    </DashboardLayout>
  );
}

  if (setupMode === "needsPortfolio") {
    return (
      <DashboardLayout>
        <GuidancePanel {...GUIDANCE.almostReady} />
      </DashboardLayout>
    );
  }

  if (setupMode === "needsAssets") {
    return (
      <DashboardLayout>
        <GuidancePanel {...GUIDANCE.portfolioNoAssets} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={1}
      >
        Portfolio Overview
      </Typography>

      <Typography
        color="#64748B"
        mb={4}
      >
        
      </Typography>

      {context && !context.hasGoal && (
        <GuidanceAlert>
          <Typography fontWeight={600} mb={0.5}>
            {GUIDANCE.goalRequiredDashboard.title}
          </Typography>
          {GUIDANCE.goalRequiredDashboard.message}
        </GuidanceAlert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            lg: "repeat(4,1fr)"
          },
          gap: 3,
          mb: 4
        }}
      >
        <SummaryCard
          title="Current Portfolio Value (USD)"
          value={formatAmount(latestValue)}
          subtitle="Latest Snapshot"
        />

        <SummaryCard
          title="Goal Success"
          value={
            scorecard
              ? formatPercent(
                scorecard.goal_success
              )
              : "--"
          }
          subtitle="Progress to Target"
        />

        <SummaryCard
          title="Portfolio Health"
          value={
            scorecard
              ? formatPercent(
                scorecard.portfolio_health
              )
              : "--"
          }
          subtitle="Quality Score"
        />

        <SummaryCard
          title="Overall Rating"
          value={
            scorecard
              ? scorecard.overall_rating
              : "--"
          }
          subtitle="Scorecard"
        />
      </Box>

      <Typography
        variant="h5"
        fontWeight={700}
        mb={2}
        mt={4}
      >
        Performance Metrics
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            md: "repeat(3,1fr)",
            lg: "repeat(6,1fr)"
          },
          gap: 3,
          mb: 4
        }}
      >
        <SummaryCard
          title="Daily Return"
          value={analytics ? formatColoredMetric(analytics.daily_return_pct, analytics.daily_return_amt) : "--"}
          subtitle="Today's Performance"
        />
        <SummaryCard
          title="Weekly Return"
          value={analytics ? formatColoredMetric(analytics.weekly_return_pct) : "--"}
          subtitle="Last 7 Days"
        />
        <SummaryCard
          title="Monthly Return"
          value={analytics ? formatColoredMetric(analytics.monthly_return_pct) : "--"}
          subtitle="Last 30 Days"
        />
        <SummaryCard
          title="Total Return"
          value={analytics ? formatColoredMetric(analytics.total_return_pct) : "--"}
          subtitle="All Time"
        />
        <SummaryCard
          title="Profit / Loss"
          value={analytics ? formatColoredAmount(analytics.total_profit_loss) : "--"}
          subtitle="Net Profit/Loss"
        />
        <SummaryCard
          title="CAGR"
          value={analytics ? formatColoredPercent(analytics.cagr) : "--"}
          subtitle="Ann. Growth Rate"
        />
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} lg={8}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2
              }}
            >
              <Typography
                variant="h5"
                fontWeight={700}
              >
                Portfolio Growth
              </Typography>

              <Box display="flex" gap={1}>
                {["1W", "1M", "3M", "6M", "1Y", "MAX"].map((p) => (
                  <Button
                    key={p}
                    size="small"
                    variant={selectedPeriod === p ? "contained" : "outlined"}
                    onClick={() => handlePeriodChange(p)}
                    sx={{
                      minWidth: 40,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: "none",
                      color: selectedPeriod === p ? "#FFFFFF" : "#94A3B8",
                      borderColor: selectedPeriod === p ? "primary.main" : "rgba(255,255,255,0.1)",
                      bgcolor: selectedPeriod === p ? "primary.main" : "transparent",
                      "&:hover": {
                        bgcolor: selectedPeriod === p ? "primary.dark" : "rgba(255,255,255,0.05)",
                        borderColor: selectedPeriod === p ? "primary.dark" : "rgba(255,255,255,0.2)"
                      }
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                width: "100%",
                height: 320,
                 minWidth: 0,
                 overflow: "hidden"
              }}
            >
             <ResponsiveContainer
  width="100%"
  height="100%"
  style={{
    overflow: "hidden"
  }}
>
                <LineChart
  data={chartData}
  style={{
    overflow: "hidden"  
  }}
>
                  <CartesianGrid
                    stroke="#E2E8F0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) =>
  "$" + Math.round(value / 1000) + "K"
}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatAmount(value),
                      "Portfolio Value"
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #CBD5E1"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{
                      r: 3
                    }}
                    activeDot={{
                      r: 5
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid xs={12} lg={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography
              variant="h5"
              fontWeight={700}
              mb={3}
            >
              Benchmark Comparison
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2
              }}
            >
              <Box>
                <Typography color="#64748B">
                  Portfolio Return
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                >
                  {benchmark
                    ? formatPercent(
                      benchmark.portfolio_return
                    )
                    : "--"}
                </Typography>
              </Box>

              <Box>
                <Typography color="#64748B">
                  Benchmark Return
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                >
                  {benchmark
                    ? formatPercent(
                      benchmark.benchmark_return
                    )
                    : "--"}
                </Typography>
                <Typography
                  variant="caption"
                  color="#64748B"
                >
                  {benchmark?.benchmark || "S&P 500"}
                </Typography>
              </Box>

              <Box>
                <Typography color="#64748B">
                  Alpha
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={
                    benchmark?.alpha >= 0
                      ? "#166534"
                      : "#991B1B"
                  }
                >
                  {benchmark
                    ? formatSignedPercent(
                      benchmark.alpha
                    )
                    : "--"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          mt: 3,
          p: 3
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={3}
        >
          Portfolio Scorecard
        </Typography>

        <Grid container spacing={2}>
          {[
            [
              "Diversification",
              scorecard
                ? formatPercent(
                  scorecard.diversification
                )
                : "--"
            ],
            [
              "Risk",
              scorecard?.risk || "--"
            ],
            [
              "Performance",
              scorecard
                ? formatPercent(
                  scorecard.performance
                )
                : "--"
            ],
            [
              "Best Performer",
              scorecard?.best_performer || "--"
            ],
            [
              "Worst Performer",
              scorecard?.worst_performer || "--"
            ]
          ].map(([label, value]) => (
            <Grid
              xs={12}
              sm={6}
              md={2.4}
              key={label}
            >
              <Box
                sx={{
                  border:
                    "1px solid #E2E8F0",
                  borderRadius: 1,
                  p: 2,
                  minHeight: 88
                }}
              >
                <Typography
                  variant="body2"
                  color="#64748B"
                >
                  {label}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  mt={1}
                >
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

    </DashboardLayout>
  );
}
