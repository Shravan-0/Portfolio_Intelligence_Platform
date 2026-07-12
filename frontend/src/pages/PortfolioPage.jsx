  import {
    useEffect,
    useMemo,
    useState
  } from "react";
  import axios from "axios";

  import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    MenuItem,
    Snackbar,
    Alert
  } from "@mui/material";
  import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
  } from "recharts";

  import DashboardLayout from "../layouts/DashboardLayout";
  import PageLoader from "../components/PageLoader";
  import ServerErrorAlert from "../components/ServerErrorAlert";
import { GUIDANCE } from "../components/guidanceUtils";
  import { classifyApiError } from "../utils/apiErrors";
  import {
    createAsset,
    deleteAsset,
    getAssetsByPortfolio,
    updateAsset
  } from "../services/assetService";
  import {
    getAssetMarketData
  } from "../services/marketDataService";
  import {
    resolveUserPortfolio
  } from "../utils/currentUser";
import { API_BASE_URL } from "../config/api";

  const emptyAssetForm = {
    ticker: "",
    asset_type: "",
    allocation_percent: "",
    amount_invested: ""
  };

  const ASSET_CATALOG = {
    Stock: [
      "AAPL",
      "MSFT",
      "GOOGL",
      "NVDA",
      "TSLA"
    ],
    ETF: [
      "SPY",
      "QQQ",
      "VTI"
    ],
    Crypto: [
      "BTC",
      "ETH",
      "SOL"
    ],
    Bond: [
      "TLT",
      "BND",
      "AGG"
    ],
    "Mutual Fund": [
      "VFIAX",
      "FXAIX",
      "SWPPX"
    ]
  };

  const getAssetOptions = (
    assetType,
    selectedTicker
  ) => {
    const options =
      ASSET_CATALOG[assetType] || [];

    if (
      selectedTicker &&
      !options.includes(selectedTicker)
    ) {
      return [
        selectedTicker,
        ...options
      ];
    }

    return options;
  };

  const ALLOCATION_COLORS = [
    "#2563EB",
    "#0891B2",
    "#16A34A",
    "#D97706",
    "#7C3AED",
    "#475569",
    "#DC2626",
    "#0F766E"
  ];

  const currencyFormatter =
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }
    );

  const usdFormatter =
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
      }
    );

  const getAssetId = (asset) =>
    asset.id || asset.asset_id;

  const formatAmount = (amount) => {
    const numericAmount = Number(amount || 0);

    return currencyFormatter.format(
      Number.isNaN(numericAmount)
        ? 0
        : numericAmount
    );
  };

  const formatUsdAmount = (amount) => {
    const numericAmount = Number(amount || 0);

    return usdFormatter.format(
      Number.isNaN(numericAmount)
        ? 0
        : numericAmount
    );
  };

  const formatPercent = (value) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "-";
    }

    return `${numericValue.toFixed(2)}%`;
  };

  const formatMarketPrice = (price, currency = "USD") => {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return "-";
    }

    return `${currency} ${numericPrice.toFixed(2)}`;
  };

  const getPerformanceColor = (value) => {
    if (value > 0) {
      return "#166534";
    }

    if (value < 0) {
      return "#991B1B";
    }

    return "text.primary";
  };

  const getValuationPerformanceColor = (value) => {
    const numericValue = Number(value);

    if (numericValue > 0) {
      return "#22C55E";
    }

    if (numericValue < 0) {
      return "#EF4444";
    }

    return "#F1F5F9";
  };

  const portfolioMetricCardSx = {
    bgcolor: "#12182A",
    borderRadius: 3,
    border: "1px solid rgba(148,163,184,0.10)",
    boxShadow: "0 8px 22px rgba(0,0,0,0.10)",
    minHeight: { xs: 132, sm: 148 },
    height: "100%",
    p: { xs: 2.25, sm: 2.75 },
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
    "&:hover": {
      borderColor: "rgba(148,163,184,0.24)",
      boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
      transform: "translateY(-1px)"
    }
  };

  const PortfolioMetricCard = ({ label, children, sx = {} }) => (
    <Paper sx={{ ...portfolioMetricCardSx, ...sx }}>
      <Typography
        variant="caption"
        sx={{
          color: "#64748B",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          lineHeight: 1.35
        }}
      >
        {label}
      </Typography>
      {children}
    </Paper>
  );

  const renderAllocationLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }) => {
    const radius =
      innerRadius +
      (outerRadius - innerRadius) * 0.55;
    const radians =
      (Math.PI / 180) * -midAngle;
    const x =
      cx + radius * Math.cos(radians);
    const y =
      cy + radius * Math.sin(radians);

    if (percent < 0.05) {
      return null;
    }

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
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  const AllocationTooltip = ({
    active,
    payload
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const item = payload[0];

    return (
      <Box
        sx={{
          bgcolor: "#0F172A",
          border: "1px solid #334155",
          borderRadius: 1,
          px: 1.5,
          py: 1
        }}
      >
        <Typography
          variant="body2"
          color="#FFFFFF"
          fontWeight={700}
        >
          {item.name}
        </Typography>
        <Typography
          variant="caption"
          color="#CBD5E1"
        >
          {item.value}% allocation
        </Typography>
      </Box>
    );
  };

  export default function PortfolioPage() {

    const [portfolioId, setPortfolioId] =
      useState(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState(null);

    const [noPortfolio, setNoPortfolio] =
    useState(false);

  const [creatingPortfolio, setCreatingPortfolio] =
    useState(false);

    const [deletingAsset, setDeletingAsset] = useState(false);

    const [snackbar, setSnackbar] = useState({
      open: false,
      message: "",
      severity: "success"
    });

    const showNotification = (message, severity = "success") => {
      setSnackbar({
        open: true,
        message,
        severity
      });
    };

    const handleSnackbarClose = () => {
      setSnackbar((prev) => ({
        ...prev,
        open: false
      }));
    };

    const [portfolioData, setPortfolioData] =
      useState(null);

    const [holdings, setHoldings] =
      useState([]);

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState(null);

    const [openAssetModal, setOpenAssetModal] =
      useState(false);

    const [assetForm, setAssetForm] =
      useState(emptyAssetForm);

    const [editingAssetId, setEditingAssetId] =
      useState(null);

    const [savingAsset, setSavingAsset] =
      useState(false);

    const [assetError, setAssetError] =
      useState(null);

    const [assetFormErrors, setAssetFormErrors] =
      useState({});

    const [marketDataByTicker, setMarketDataByTicker] =
      useState({});

    const [marketDataLoading, setMarketDataLoading] =
      useState(false);

    const [marketDataError, setMarketDataError] =
      useState(null);

    const [lastMarketRefresh, setLastMarketRefresh] =
      useState(null);

      const [portfolioName,
    setPortfolioName] =
    useState("");

    const allocationChartData =
      useMemo(
        () =>
          holdings
            .map((holding) => ({
              name: holding.ticker,
              value: Number(
                holding.allocation_percent
              )
            }))
            .filter((item) =>
              item.name &&
              !Number.isNaN(item.value) &&
              item.value > 0
            ),
        [holdings]
      );

    const valuedHoldings =
      useMemo(
        () =>
          holdings.map((holding) => {
            const ticker =
              holding.ticker?.toUpperCase();
            const marketData =
              marketDataByTicker[ticker];
            const currentPrice =
              marketData?.price ?? null;
            const previousClose =
              marketData?.previous_close ?? null;
            const investedAmount =
              Number(holding.amount_invested || 0);
            const quantity =
              Number(
                holding.quantity ??
                  holding.position_quantity ??
                  0
              );
            const estimatedQuantity =
              investedAmount > 0
                ? investedAmount / (
                  Number(holding.purchase_price) ||
                  previousClose ||
                  currentPrice ||
                  investedAmount
                )
                : 0;
            const positionQuantity =
              quantity > 0
                ? quantity
                : estimatedQuantity;
            const marketValue =
              currentPrice
                ? currentPrice * positionQuantity
                : investedAmount;
            const gainLoss =
              marketValue - investedAmount;
            const returnPercent =
              investedAmount > 0
                ? (gainLoss / investedAmount) * 100
                : 0;
            const todaysGainLoss =
              currentPrice && previousClose
                ? (
                  currentPrice - previousClose
                ) * positionQuantity
                : 0;

            return {
              ...holding,
              current_price: currentPrice,
              market_value: marketValue,
              gain_loss: gainLoss,
              return_percent: returnPercent,
              todays_gain_loss: todaysGainLoss,
              market_currency:
                marketData?.currency || "USD"
            };
          }),
        [holdings, marketDataByTicker]
      );

    const portfolioValuation =
      useMemo(
        () => {
          const currentValue =
            valuedHoldings.reduce(
              (total, holding) =>
                total + holding.market_value,
              0
            );
          const todaysGainLoss =
            valuedHoldings.reduce(
              (total, holding) =>
                total + holding.todays_gain_loss,
              0
            );
          const totalGainLoss =
            valuedHoldings.reduce(
              (total, holding) =>
                total + holding.gain_loss,
              0
            );
          const sortedByReturn =
            [...valuedHoldings].sort(
              (a, b) =>
                b.return_percent -
                a.return_percent
            );

          return {
            currentValue,
            todaysGainLoss,
            totalGainLoss,
            bestPerformer:
              sortedByReturn[0] || null,
            worstPerformer:
              sortedByReturn[
                sortedByReturn.length - 1
              ] || null
          };
        },
        [valuedHoldings]
      );

    const selectedAssetOptions =
      useMemo(
        () =>
          getAssetOptions(
            assetForm.asset_type,
            assetForm.ticker
          ),
        [
          assetForm.asset_type,
          assetForm.ticker
        ]
      );

    const fetchMarketData = async (assets) => {
      if (!assets.length) {
        setMarketDataByTicker({});
        return;
      }

      setMarketDataLoading(true);
      setMarketDataError(null);

      const uniqueAssets =
        assets.reduce((items, asset) => {
          const ticker =
            asset.ticker?.toUpperCase();

          if (
            ticker &&
            !items.some(
              (item) =>
                item.ticker?.toUpperCase() === ticker
            )
          ) {
            items.push(asset);
          }

          return items;
        }, []);

      const results =
        await Promise.allSettled(
          uniqueAssets.map((asset) =>
            getAssetMarketData(asset)
          )
        );

      const nextMarketData = {};

      results.forEach((result, index) => {
        const ticker =
          uniqueAssets[index].ticker?.toUpperCase();

        if (result.status === "fulfilled") {
          nextMarketData[ticker] = result.value;
        }
      });

      setMarketDataByTicker((currentData) => ({
        ...currentData,
        ...nextMarketData
      }));
      setLastMarketRefresh(new Date());

      if (
        results.some(
          (result) => result.status === "rejected"
        )
      ) {
        setMarketDataError(
          "Some market prices could not be refreshed."
        );
      }

      setMarketDataLoading(false);
    };

    const fetchHoldings = async (activePortfolioId) => {
      if (!activePortfolioId) {
        return;
      }

      const assets =
        await getAssetsByPortfolio(
          activePortfolioId
        );

      setHoldings(assets);
    };

    useEffect(() => {

      const fetchData = async () => {

        try {
          const portfolio = await resolveUserPortfolio();

          if (!portfolio) {

    setNoPortfolio(true);

    return;
  }

          setPortfolioId(portfolio.id);

          const portfolioResponse = await axios.get(
  `${API_BASE_URL}/analytics/portfolio/${portfolio.id}`
);
          setPortfolioData(
            portfolioResponse.data
          );

          await fetchHoldings(portfolio.id);

        } catch (error) {

    console.error(error);

    setError(
      classifyApiError(error).message
    );

  }
  finally {

          setLoading(false);

        }
      };

      fetchData();

      if (sessionStorage.getItem("portfolioCreated") === "true") {
        sessionStorage.removeItem("portfolioCreated");
        setTimeout(() => {
          showNotification("Portfolio created successfully.", "success");
        }, 0);
      }

    }, []);

    useEffect(() => {
      if (!holdings.length) {
        return undefined;
      }

      const initialRefresh = setTimeout(
        () => {
          fetchMarketData(holdings);
        },
        0
      );

      const refreshInterval = setInterval(
        () => {
          fetchMarketData(holdings);
        },
        45000
      );

      return () => {
        clearTimeout(initialRefresh);
        clearInterval(refreshInterval);
      };
    }, [holdings]);

    const handleCreatePortfolio =
    async () => {

      try {

        setCreatingPortfolio(true);

        const userId =
          Number(
            localStorage.getItem(
              "userId"
            )
          );

        await axios.post(
  `${API_BASE_URL}/portfolios/`,
  {
    name: portfolioName,
    user_id: userId
  }
);
        setPortfolioName("");
        sessionStorage.setItem("portfolioCreated", "true");
        window.location.reload();

      } catch (error) {

        console.error(error);

      showNotification(
          "Unable to create portfolio.",
          "error"
        );

      } finally {

        setCreatingPortfolio(false);

      }
  };

    const resetAssetModal = () => {
      setOpenAssetModal(false);
      setEditingAssetId(null);
      setAssetForm(emptyAssetForm);
      setAssetError(null);
      setAssetFormErrors({});
    };

    const handleOpenAddAsset = () => {
      setEditingAssetId(null);
      setAssetForm(emptyAssetForm);
      setAssetError(null);
      setAssetFormErrors({});
      setOpenAssetModal(true);
    };

    const handleOpenEditAsset = (holding) => {
      setEditingAssetId(getAssetId(holding));
      setAssetForm({
        ticker: holding.ticker || "",
        asset_type: holding.asset_type || "",
        allocation_percent:
          holding.allocation_percent ?? "",
        amount_invested:
          holding.amount_invested ?? ""
      });
      setAssetError(null);
      setAssetFormErrors({});
      setOpenAssetModal(true);
    };

    const handleAssetFieldChange = (event) => {
      const { name, value } = event.target;

      setAssetForm((currentForm) => ({
        ...currentForm,
        ...(name === "asset_type"
          ? { ticker: "" }
          : {}),
        [name]: value
      }));
      setAssetFormErrors((currentErrors) => ({
        ...currentErrors,
        [name]: ""
      }));
    };

    const handleSaveAsset = async () => {
      setAssetError(null);

      const allocationValue = Number(
        assetForm.allocation_percent
      );
      const amountValue = Number(
        assetForm.amount_invested
      );
      const existingAllocation =
        holdings.reduce((total, holding) => {
          if (
            editingAssetId &&
            getAssetId(holding) === editingAssetId
          ) {
            return total;
          }

          return total +
            Number(
              holding.allocation_percent || 0
            );
        }, 0);
      const nextAllocationTotal =
        existingAllocation + allocationValue;
      const validationErrors = {};

      if (!assetForm.asset_type) {
        validationErrors.asset_type =
          "Select an asset type.";
      }

      if (!assetForm.ticker) {
        validationErrors.ticker =
          "Select an asset.";
      }

      if (
        Number.isNaN(allocationValue) ||
        allocationValue <= 0
      ) {
        validationErrors.allocation_percent =
          "Allocation must be greater than 0%.";
      }

      if (
        Number.isNaN(amountValue) ||
        amountValue <= 0
      ) {
        validationErrors.amount_invested =
          "Amount invested must be greater than 0.";
      }

      if (
        !validationErrors.allocation_percent &&
        nextAllocationTotal > 100
      ) {
        validationErrors.allocation_percent =
          "Total allocation cannot exceed 100%.";
      }

      if (Object.keys(validationErrors).length) {
        setAssetFormErrors(validationErrors);
        return;
      }

      if (!portfolioId) {
        setAssetError("Portfolio is not loaded yet.");
        return;
      }

      setSavingAsset(true);

      try {
        const assetPayload = {
          ticker: assetForm.ticker,
          asset_type: assetForm.asset_type,
          allocation_percent: allocationValue,
          amount_invested: amountValue
        };

        if (editingAssetId) {
          await updateAsset(
            editingAssetId,
            assetPayload
          );
        } else {
          await createAsset({
            portfolio_id: portfolioId,
            ...assetPayload
          });
        }

        await fetchHoldings(portfolioId);
        resetAssetModal();
      } catch (err) {
        console.error(err);
        setAssetError("Unable to save asset.");
      } finally {
        setSavingAsset(false);
      }
    };

    const handleDeleteAsset = async () => {
      try {
        setDeletingAsset(true);
        setAssetError(null);

        await deleteAsset(selectedAssetId);
        await fetchHoldings(portfolioId);

        setDeleteDialogOpen(false);
        setSelectedAssetId(null);
        showNotification("Asset deleted successfully.", "success");
      } catch (err) {
        console.error(err);
        setAssetError("Unable to delete asset.");
        showNotification("Unable to delete asset.", "error");
      } finally {
        setDeletingAsset(false);
      }
    };

    if (loading) {
      return (
        <DashboardLayout>
          <PageLoader message="Loading portfolio..." />
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

    if (noPortfolio) {
    return (
      <DashboardLayout>

        <Paper
          sx={{
            p: 5,
            textAlign: "center"
          }}
        >

          <Typography
            variant="h5"
            fontWeight={700}
            mb={2}
          >
            {GUIDANCE.portfolioNotFound.title}
          </Typography>

          <Typography
            color="text.secondary"
            mb={3}
          >
            {GUIDANCE.portfolioNotFound.message}
          </Typography>

          <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      maxWidth: 400
    }}
  >

    <TextField
      label="Portfolio Name"
      value={portfolioName}
      onChange={(e) =>
        setPortfolioName(
          e.target.value
        )
      }
    />

    <Button
      variant="contained"
      onClick={handleCreatePortfolio}
      disabled={
        !portfolioName.trim() || creatingPortfolio
      }
    >
      {creatingPortfolio ? "Creating..." : "Create Portfolio"}
    </Button>

  </Box>

        </Paper>

      </DashboardLayout>
    );
  }

    return (
      <DashboardLayout>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={750}
            sx={{ color: "#F1F5F9", letterSpacing: "-0.025em" }}
          >
            Portfolio Summary
          </Typography>
          <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.75 }}>
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          
          <Grid
  size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
  sx={{
    display: "flex",
    minWidth: 0,
  }}
>
            <PortfolioMetricCard label="Portfolio Value">
              <Typography
                variant="h4"
                fontWeight={750}
                sx={{ color: "#F1F5F9",  lineHeight: 1.15 }}
              >
                {formatAmount(
                  portfolioData.total_value
                )}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid
    xs={12}
    sm={6}
    md={4}
    lg={2}
    sx={{ display: "flex" }}
>
            <PortfolioMetricCard label="Assets">
              <Typography variant="h4" fontWeight={750} sx={{ color: "#F1F5F9", lineHeight: 1.15 }}>
                {portfolioData.asset_count}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid
  size={{
    xs: 12,
    sm: 6,
    md: 4,
    lg: 2
  }}
  sx={{ display: "flex" }}
>
            <PortfolioMetricCard label="Diversification">
              <Typography variant="h4" fontWeight={750} sx={{ color: "#F1F5F9", lineHeight: 1.15 }}>
                {portfolioData.diversification_score}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

         <Grid
  size={{
    xs: 12,
    sm: 6,
    md: 4,
    lg: 2
  }}
  sx={{ display: "flex" }}
>
            <PortfolioMetricCard label="Health Score">
              <Typography variant="h4" fontWeight={750} sx={{ color: "#F1F5F9", lineHeight: 1.15 }}>
                {portfolioData.health_score}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

         <Grid
  size={{
    xs: 12,
    sm: 6,
    md: 4,
    lg: 2
  }}
  sx={{ display: "flex" }}
>
            <PortfolioMetricCard label="Largest Holding">
              <Typography
                variant="h5"
                fontWeight={750}
                sx={{ color: "#F1F5F9", lineHeight: 1.2, overflowWrap: "anywhere" }}
              >
                {portfolioData.largest_holding}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid
  size={{
    xs: 12,
    sm: 6,
    md: 4,
    lg: 2
  }}
  sx={{ display: "flex" }}
>
            <PortfolioMetricCard label="Concentration">
              <Typography
                variant="h5"
                fontWeight={750}
                sx={{ color: "#F1F5F9", lineHeight: 1.2, overflowWrap: "anywhere" }}
              >
                {portfolioData.concentration_level}
              </Typography>
            </PortfolioMetricCard>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center"
            },
            gap: 2,
            flexDirection: {
              xs: "column",
              md: "row"
            }
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={750}
              sx={{ color: "#F1F5F9", letterSpacing: "-0.02em" }}
            >
              Live Portfolio Valuation
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5 }}>
            
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <Chip
              size="small"
              label={
                marketDataLoading
                  ? "Refreshing prices"
                  : "Live prices"
              }
              sx={{
                bgcolor: "rgba(59,130,246,0.12)",
                color: "#93C5FD",
                border: "1px solid rgba(59,130,246,0.22)",
                fontWeight: 700
              }}
            />

            {lastMarketRefresh && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Updated{" "}
                {lastMarketRefresh.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </Box>

        {marketDataError && (
          <Typography
            color="warning.main"
            mt={1}
          >
            {marketDataError}
          </Typography>
        )}

        <Grid
          container
          spacing={3}
          alignItems="stretch"
          sx={{ mt: 1.5 }}
        >
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: "flex" }}>
            <PortfolioMetricCard label="Current Portfolio Value (USD)">
              <Typography
                variant="h4"
                fontWeight={750}
                sx={{ color: "#F1F5F9", letterSpacing: "-0.025em", lineHeight: 1.15 }}
              >
                {formatAmount(
                  portfolioData?.total_value ?? 0
                )}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: "flex" }}>
            <PortfolioMetricCard label="Today's Gain/Loss (USD)">
              <Typography
                variant="h4"
                fontWeight={750}
                sx={{
                  color: getValuationPerformanceColor(portfolioValuation.todaysGainLoss),
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15
                }}
              >
                {formatUsdAmount(
                  portfolioValuation.todaysGainLoss
                )}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: "flex" }}>
            <PortfolioMetricCard label="Total Gain/Loss (USD)">
              <Typography
                variant="h4"
                fontWeight={750}
                sx={{
                  color: getValuationPerformanceColor(portfolioValuation.totalGainLoss),
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15
                }}
              >
                {formatUsdAmount(
                  portfolioValuation.totalGainLoss
                )}
              </Typography>
            </PortfolioMetricCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: "flex" }}>
            <PortfolioMetricCard label="Best Performer">
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={750}
                  sx={{ color: "#F1F5F9", lineHeight: 1.2 }}
                >
                  {portfolioValuation.bestPerformer
                    ? portfolioValuation
                      .bestPerformer
                      .ticker
                    : "-"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: getValuationPerformanceColor(
                      portfolioValuation
                        .bestPerformer
                        ?.return_percent || 0
                    ),
                    display: "block",
                    fontWeight: 750,
                    mt: 0.75
                  }}
                >
                  {portfolioValuation.bestPerformer
                    ? formatPercent(
                      portfolioValuation
                        .bestPerformer
                        .return_percent
                    )
                    : "-"}
                </Typography>
              </Box>
            </PortfolioMetricCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} sx={{ display: "flex" }}>
            <PortfolioMetricCard label="Worst Performer">
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={750}
                  sx={{ color: "#F1F5F9", lineHeight: 1.2 }}
                >
                  {portfolioValuation.worstPerformer
                    ? portfolioValuation
                      .worstPerformer
                      .ticker
                    : "-"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: getValuationPerformanceColor(
                      portfolioValuation
                        .worstPerformer
                        ?.return_percent || 0
                    ),
                    display: "block",
                    fontWeight: 750,
                    mt: 0.75
                  }}
                >
                  {portfolioValuation.worstPerformer
                    ? formatPercent(
                      portfolioValuation
                        .worstPerformer
                        .return_percent
                    )
                    : "-"}
                </Typography>
              </Box>
            </PortfolioMetricCard>
          </Grid>
        </Grid>

        <Paper
          sx={{
            mt: 4,
            p: 3
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            mb={3}
          >
            Portfolio Allocation
          </Typography>

          {allocationChartData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography
                variant="h6"
                fontWeight={600}
                mb={1}
              >
                {GUIDANCE.portfolioNoHoldings.title}
              </Typography>
              <Typography
                color="text.secondary"
                mb={2}
              >
                
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenAddAsset}
              >
                Add Asset
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                height: {
                  xs: 300,
                  sm: 340,
                  md: 360
                }
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={allocationChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius="48%"
                    outerRadius="72%"
                    paddingAngle={2}
                    labelLine={false}
                    label={renderAllocationLabel}
                  >
                    {allocationChartData.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ALLOCATION_COLORS[
                              index %
                                ALLOCATION_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={<AllocationTooltip />}
                  />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "13px",
                      paddingTop: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

        <Paper
          sx={{
            mt: 4,
            p: 3
          }}
        >

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mb: 3
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
            >
              Portfolio Holdings
            </Typography>

            <Button
              variant="contained"
              onClick={handleOpenAddAsset}
            >
              Add Asset
            </Button>
          </Box >

          {assetError && (
            <Typography
              color="error"
              mb={2}
            >
              {assetError}
            </Typography>
          )}

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
            <TableHead
    sx={{
      bgcolor: "#1E293B",
      "& .MuiTableCell-head": {
        color: "#FFFFFF",
        fontWeight: 700
      }
    }}
  >
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Ticker
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Asset Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Invested Amount (USD)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Current Price (USD)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Market Value (USD)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Gain/Loss (USD)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Return %
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {holdings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                    >
                      <Typography
                        fontWeight={600}
                        mb={0.5}
                      >
                        {GUIDANCE.portfolioNoHoldings.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        mb={2}
                      >
                        {GUIDANCE.portfolioNoHoldings.message}
                      </Typography>
                      
                    </TableCell>
                  </TableRow>
                ) : (
                  valuedHoldings.map((holding) => {
                    const assetId = getAssetId(holding);

                    return (
                      <TableRow
                        key={assetId}
                        hover
                      >
                        <TableCell>
                          {holding.ticker}
                        </TableCell>
                        <TableCell>
                          {holding.asset_type}
                        </TableCell>
                        <TableCell>
                          {formatAmount(
                            holding.amount_invested
                          )}
                        </TableCell>
                        <TableCell>
                          {holding.current_price
                            ? formatMarketPrice(
                              holding.current_price,
                              holding.market_currency || "USD"
                            )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatUsdAmount(
                            holding.market_value
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            color={getPerformanceColor(
                              holding.gain_loss
                            )}
                          >
                            {formatUsdAmount(
                              holding.gain_loss
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            color={getPerformanceColor(
                              holding.return_percent
                            )}
                          >
                            {formatPercent(
                              holding.return_percent
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() =>
                              handleOpenEditAsset(
                                holding
                              )
                            }
                          >
                            Edit
                          </Button>

                          <Button
    size="small"
    color="error"
    onClick={() => {
      setSelectedAssetId(assetId);
      setDeleteDialogOpen(true);
    }}
  >
    Delete
  </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </Paper>

        <Dialog
          open={openAssetModal}
          onClose={resetAssetModal}
          maxWidth="sm"
          fullWidth
        >

          <DialogTitle>
            {editingAssetId
              ? "Edit Asset"
              : "Add Asset"}
          </DialogTitle>

          <DialogContent>

            <TextField
              select
              fullWidth
              margin="normal"
              label="Asset Type"
              name="asset_type"
              value={assetForm.asset_type}
              onChange={handleAssetFieldChange}
              error={Boolean(
                assetFormErrors.asset_type
              )}
              helperText={
                assetFormErrors.asset_type
              }
            >
              {Object.keys(ASSET_CATALOG).map(
                (assetType) => (
                  <MenuItem
                    key={assetType}
                    value={assetType}
                  >
                    {assetType}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              select
              fullWidth
              margin="normal"
              label="Asset"
              name="ticker"
              value={assetForm.ticker}
              onChange={handleAssetFieldChange}
              disabled={!assetForm.asset_type}
              error={Boolean(
                assetFormErrors.ticker
              )}
              helperText={
                assetFormErrors.ticker
              }
            >
              {selectedAssetOptions.map(
                (ticker) => (
                  <MenuItem
                    key={ticker}
                    value={ticker}
                  >
                    {ticker}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              label="Allocation %"
              name="allocation_percent"
              type="number"
              value={assetForm.allocation_percent}
              onChange={handleAssetFieldChange}
              error={Boolean(
                assetFormErrors.allocation_percent
              )}
              helperText={
                assetFormErrors.allocation_percent
              }
            />

            <TextField
              fullWidth
              margin="normal"
              label="Amount Invested"
              name="amount_invested"
              type="number"
              value={assetForm.amount_invested}
              onChange={handleAssetFieldChange}
              error={Boolean(
                assetFormErrors.amount_invested
              )}
              helperText={
                assetFormErrors.amount_invested
              }
            />

            {assetError && (
              <Typography
                color="error"
                mt={2}
              >
                {assetError}
              </Typography>
            )}

          </DialogContent>

          <DialogActions>

            <Button
              onClick={resetAssetModal}
              disabled={savingAsset}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSaveAsset}
              disabled={savingAsset}
            >
              {savingAsset
                ? "Saving..."
                : "Save Asset"}
            </Button>

          </DialogActions>

        </Dialog>
        <Dialog
    open={deleteDialogOpen}
    onClose={() => !deletingAsset && setDeleteDialogOpen(false)}
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle>Delete Asset</DialogTitle>

    <DialogContent>
      <Typography>
        Are you sure you want to delete this asset?
        This action cannot be undone.
      </Typography>
    </DialogContent>

    <DialogActions>
      <Button
        onClick={() => setDeleteDialogOpen(false)}
        disabled={deletingAsset}
      >
        Cancel
      </Button>

      <Button
        color="error"
        variant="contained"
        onClick={handleDeleteAsset}
        disabled={deletingAsset}
      >
        {deletingAsset ? "Deleting..." : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
          
        </Snackbar>
     
      </DashboardLayout >
    );
  }
