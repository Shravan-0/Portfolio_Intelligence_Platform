import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {
  MdDescription,
  MdHistory,
  MdOutlineFileDownload,
  MdPlayArrow
} from "react-icons/md";

import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import PageLoader from "../components/PageLoader";
import { ServerErrorAlert } from "../components/GuidancePanel";
import {
  downloadReportVersion,
  generatePortfolioReport,
  getReportHistory,
  getReportSummary
} from "../services/reportService";
import { classifyApiError } from "../utils/apiErrors";
import { resolveUserContext } from "../utils/userContext";

const reportTypes = [
  {
    key: "portfolio",
    title: "Portfolio Report",
    description: "Portfolio summary, allocations, benchmark analysis, and optimization recommendations.",
    available: true
  },
  {
    key: "performance",
    title: "Performance Report",
    description: "Historical returns and benchmark performance.",
    available: false
  },
  {
    key: "risk",
    title: "Risk Report",
    description: "Risk profile, concentration, and exposure reporting.",
    available: false
  },
  {
    key: "tax",
    title: "Tax Report",
    description: "Tax-ready export support.",
    available: false
  },
  {
    key: "goals",
    title: "Goal Progress Report",
    description: "Goal tracking and probability snapshots.",
    available: false
  }
];

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
};

const statusStyles = {
  Generated: {
    bgcolor: "rgba(59, 130, 246, 0.16)",
    color: "#60A5FA"
  },
  Downloaded: {
    bgcolor: "rgba(34, 197, 94, 0.16)",
    color: "#4ADE80"
  },
  Archived: {
    bgcolor: "rgba(148, 163, 184, 0.16)",
    color: "#CBD5E1"
  },
  Failed: {
    bgcolor: "rgba(239, 68, 68, 0.16)",
    color: "#F87171"
  }
};

const getDownloadFilename = (response, fallback) => {
  const disposition = response.headers["content-disposition"];
  const match = disposition?.match(/filename="?([^"]+)"?/);

  return match?.[1] || fallback;
};

const saveBlob = (response, fileName) => {
  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [context, setContext] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const portfolioId = context?.portfolio?.id;

  const latestReport = useMemo(
    () => summary?.latest_report || history[0] || null,
    [summary, history]
  );

  const loadReports = useCallback(async () => {
    setError(null);

    try {
      const userContext = await resolveUserContext();
      setContext(userContext);

      if (!userContext.portfolio) {
        setSummary(null);
        setHistory([]);
        return;
      }

      const [
        summaryData,
        historyData
      ] = await Promise.all([
        getReportSummary(userContext.portfolio.id),
        getReportHistory(userContext.portfolio.id)
      ]);

      setSummary(summaryData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    }
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await loadReports();
      setLoading(false);
    };

    loadPage();
  }, [loadReports]);

  const handleGenerate = async () => {
    if (!portfolioId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await generatePortfolioReport(portfolioId);
      await loadReports();
      setSnackbar({
        severity: "success",
        message: "Report generated successfully."
      });
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
      setSnackbar({
        severity: "error",
        message: "Unable to generate report."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (report) => {
    setDownloadingId(report.id);
    setError(null);

    try {
      const response = await downloadReportVersion(report.id);
      const fileName = getDownloadFilename(
        response,
        report.file_name
      );

      saveBlob(response, fileName);
      await loadReports();
      setSnackbar({
        severity: "success",
        message: "Report downloaded."
      });
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    } finally {
      setDownloadingId(null);
    }
  };

  const availableReportsCount = reportTypes.filter(
    (report) => report.available
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader message="Loading reports..." />
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
        Reports
      </Typography>

      <Typography
        color="#94A3B8"
        mb={4}
      >
      </Typography>

      {error && (
        <Box mb={3}>
          <ServerErrorAlert message={error} />
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            lg: "repeat(4,1fr)"
          },
          gap: 2,
          mb: 4
        }}
      >
        <SummaryCard
          title="Available Report Types"
          value={availableReportsCount}
          subtitle="Portfolio Report"
        />

        <SummaryCard
          title="Generated Reports"
          value={summary?.generated_reports || 0}
          subtitle="All versions"
        />

        <SummaryCard
          title="Latest Report"
          value={latestReport?.status || "Not Generated"}
          subtitle="Current Status"
        />

        <SummaryCard
          title="Last Generated"
          value={formatDateTime(summary?.last_generated)}
          subtitle="Latest version"
        />
      </Box>

      <Paper
        sx={{
          bgcolor: "#131C2F",
          p: 3,
          mb: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center"
            },
            flexDirection: {
              xs: "column",
              md: "row"
            },
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              color="#FFFFFF"
            >
              Portfolio Report
            </Typography>
            <Typography
              variant="body2"
              color="#94A3B8"
              mt={0.5}
            >
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<MdPlayArrow />}
            disabled={!portfolioId || actionLoading}
            onClick={handleGenerate}
            sx={{
              px: 3,
              py: 1.1,
              fontWeight: 600,
              textTransform: "none"
            }}
          >
            {actionLoading ? "Generating..." : "Generate Report"}
          </Button>
        </Box>

        {latestReport ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                lg: "repeat(4,1fr)"
              },
              gap: 2
            }}
          >
            {[
              ["Latest Version", `V${latestReport.version}`],
              ["Current Status", latestReport.status],
              ["Generated Time", formatDateTime(latestReport.generated_at)],
              ["Last Downloaded", formatDateTime(latestReport.downloaded_at)]
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 1,
                  p: 2,
                  minHeight: 86
                }}
              >
                <Typography
                  variant="body2"
                  color="#94A3B8"
                  mb={1}
                >
                  {label}
                </Typography>
                <Typography
                  fontWeight={700}
                  color="#F8FAFC"
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              border: "1px dashed rgba(148, 163, 184, 0.28)",
              borderRadius: 1,
              p: 3,
              display: "flex",
              gap: 2,
              alignItems: "center"
            }}
          >
            <MdDescription size={28} color="#64748B" />
            <Box>
              <Typography
                fontWeight={700}
                color="#F8FAFC"
              >
                No report has been generated yet.
              </Typography>
              <Typography
                variant="body2"
                color="#94A3B8"
                mt={0.5}
              >
                {portfolioId
                  ? "Generate the first portfolio report to start version tracking."
                  : "Create a portfolio before generating reports."}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper
        sx={{
          bgcolor: "#131C2F",
          p: 3,
          mb: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          mb={3}
          color="#FFFFFF"
        >
          Report History
        </Typography>

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
                <TableCell>Version</TableCell>
                <TableCell>Report Type</TableCell>
                <TableCell>Generated On</TableCell>
                <TableCell>Downloaded On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length ? (
                history.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "& .MuiTableCell-body": { color: "#E2E8F0" }
                    }}
                  >
                    <TableCell>V{row.version}</TableCell>
                    <TableCell>{row.report_name}</TableCell>
                    <TableCell>{formatDateTime(row.generated_at)}</TableCell>
                    <TableCell>{formatDateTime(row.downloaded_at)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        sx={{
                          ...(statusStyles[row.status] || statusStyles.Generated),
                          fontWeight: 600,
                          borderRadius: 1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MdOutlineFileDownload />}
                        onClick={() => handleDownload(row)}
                        disabled={
                          row.status === "Failed" ||
                          downloadingId === row.id
                        }
                        sx={{
                          textTransform: "none"
                        }}
                      >
                        {downloadingId === row.id ? "Downloading..." : "Download"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box
                      sx={{
                        py: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        color: "#94A3B8"
                      }}
                    >
                      <MdHistory size={20} />
                      <Typography variant="body2">
                        Report history will appear here after generation.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
      >
        {snackbar ? (
          <Alert
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </DashboardLayout>
  );
}
