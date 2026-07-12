import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "simplebar-react/dist/simplebar.min.css";

import App from "./App";
import theme from "./theme/theme";

/*axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});*/
axios.interceptors.request.use((config) => {
  console.log("===== AXIOS REQUEST =====");
  console.log("baseURL:", config.baseURL);
  console.log("url:", config.url);
  console.log("full:", (config.baseURL || "") + config.url);

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

