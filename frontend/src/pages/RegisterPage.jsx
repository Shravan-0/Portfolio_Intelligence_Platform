import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  storeUserIdFromToken
} from "../utils/currentUser";
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
import { API_BASE_URL } from "../config/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

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

  const handleRegister = async () => {

     if (!name.trim()) {
    setSnackbarMessage("Please enter your name");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  if (!email.trim()) {
    setSnackbarMessage("Please enter your email");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  if (!password.trim()) {
    setSnackbarMessage("Please enter your password");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }

  
    try {
      setLoading(true);

      await axios.post(
  `${API_BASE_URL}/auth/register`,
  {
    name,
    email,
    password,
  }
);

const loginResponse = await axios.post(
  `${API_BASE_URL}/auth/login`,
  {
    email,
    password,
  }
);

      localStorage.setItem(
        "token",
        loginResponse.data.access_token
      );

      storeUserIdFromToken(
        loginResponse.data.access_token
      );

      setSnackbarMessage(
        "Registration Successful"
      );

      setSnackbarSeverity(
        "success"
      );

      setSnackbarOpen(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } 
   catch (error) {
  console.error(error);

  let message = "Registration Failed";

  if (
    Array.isArray(
      error?.response?.data?.detail
    )
  ) {
    message =
      error.response.data.detail[0]?.msg ||
      "Validation Error";
  } else if (
    typeof error?.response?.data?.detail === "string"
  ) {
    message =
      error.response.data.detail;
  }

  setSnackbarMessage(message);

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
          color="white"
          mb={1}
        >
          Portfolio Intelligence Platform
        </Typography>

        <Typography
          align="center"
          color="gray"
          mb={4}
        >
          Create Your Account
        </Typography>

        <TextField
          fullWidth
          label="Full Name"
          margin="normal"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{
            mt: 3,
            py: 1.5,
          }}
          onClick={handleRegister}
          disabled={loading}
        >
          {
            loading
              ? "Registering..."
              : "Register"
          }
        </Button>

        <Button
          fullWidth
          sx={{ mt: 2 }}
          onClick={() =>
            navigate("/login")
          }
        >
          Already have an account?
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