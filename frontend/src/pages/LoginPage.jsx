import { useState } from "react";
import axios from "axios";

import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [snackbarOpen, setSnackbarOpen] =
    useState(false);

  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const [snackbarSeverity, setSnackbarSeverity] =
    useState("success");

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
  `${API_BASE_URL}/auth/login`,
  {
    email,
    password,
  }
);
        localStorage.setItem(
  "token",
  response.data.access_token
);

      const tokenData =
  JSON.parse(
    atob(
      response.data.access_token
        .split(".")[1]
    )
  );

localStorage.setItem(
  "userId",
  tokenData.user_id
);

      setSnackbarMessage(
        "Login Successful"
      );

      setSnackbarSeverity(
        "success"
      );

      setSnackbarOpen(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
  console.log("Error:", error);
  console.log("Status:", error.response?.status);
  console.log("Data:", error.response?.data);
  console.log("Detail:", error.response?.data?.detail);

  setSnackbarMessage(
    error.response?.data?.detail || "Login Failed"
  );

  setSnackbarSeverity("error");
  setSnackbarOpen(true);

} finally {
  setLoading(false);
}
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#0F172A",
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 500,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          bgcolor: "#131C2F",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          align="center"
          mb={1}
        >
          Portfolio Intelligence Platform
        </Typography>

        <Typography
          align="center"
          color="gray"
          mb={4}
        >
          PortfolioIQ
        </Typography>

        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <Button
          fullWidth
          size="large"
          variant="contained"
          sx={{
            mt: 3,
            py: 1.5,
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {
            loading
              ? "Logging In..."
              : "Login"
          }
        </Button>

        <Button
          fullWidth
          sx={{ mt: 2 }}
          onClick={() =>
            navigate("/register")
          }
        >
          Create Account
        </Button>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbarOpen(false)
        }
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
}