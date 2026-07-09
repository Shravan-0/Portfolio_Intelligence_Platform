import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0B0F19",
      paper: "#1A2235",
    },
    primary: {
      main: "#3B82F6",
    },
    secondary: {
      main: "#06B6D4",
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;