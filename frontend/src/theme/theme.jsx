import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0E17",
      paper: "#12182A",
    },
    primary: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#1D4ED8",
    },
    secondary: {
      main: "#06B6D4",
    },
    success: { main: "#22C55E" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    divider: "rgba(148, 163, 184, 0.12)",
    text: {
      primary: "#E2E8F0",
      secondary: "#94A3B8",
      disabled: "#64748B",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    body2: { color: "#94A3B8" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(148, 163, 184, 0.10)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(148, 163, 184, 0.10)",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
        contained: { boxShadow: "none" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#94A3B8",
          fontWeight: 700,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
        },
        body: {
          borderBottom: "1px solid rgba(148, 163, 184, 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;