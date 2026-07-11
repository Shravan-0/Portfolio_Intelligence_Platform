import { useEffect, useState } from "react";
import axios from "axios";

import {
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import { API_BASE_URL } from "../config/api";

export default function SettingsPage() {
  const [user, setUser] =
    useState(null);


 const loadUser = async () => {
    try {
      const token =
   localStorage.getItem(
    "token"
   );

  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setUser(response.data);

    } catch (error) {
      console.error(error);
      
    }
  };

  useEffect(() => {
    const init = async () => {
        await loadUser();
    };

    init();
}, []);


  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );
    localStorage.removeItem(
      "userId"
    );

    window.location.href =
      "/login";
  };

  return (
    <DashboardLayout>

      <Typography
        variant="h4"
        fontWeight={700}
        mb={4}
      >
      
      </Typography>

      <Grid
        container
        spacing={3}
      >

        <Grid xs={12}>
          <Paper
            sx={{
              bgcolor: "#131C2F",
              p: 3,
            }}
          >
            <Typography
              variant="h6"
              mb={2}
            >
              Profile
            </Typography>

            <Divider
              sx={{ mb: 2 }}
            />

            <Typography>
              User ID:
              {" "}
              {user?.id}
            </Typography>

            <Typography mt={1}>
              Name:
              {" "}
              {user?.name}
            </Typography>

            <Typography mt={1}>
              Email:
              {" "}
              {user?.email}
            </Typography>
          </Paper>
        </Grid>

        <Grid xs={12}>
          <Paper
            sx={{
              bgcolor: "#131C2F",
              p: 3,
            }}
          >
            <Typography
              variant="h6"
              mb={2}
            >
              Application Settings
            </Typography>

            <Divider
              sx={{ mb: 2 }}
            />

            <Typography>
              Theme: Dark
            </Typography>

            <Typography mt={2}>
              Risk Profile:
              Moderate
            </Typography>

            <Button
              variant="contained"
              color="error"
              sx={{ mt: 4 }}
              onClick={
                handleLogout
              }
            >
              Logout
            </Button>

          </Paper>
        </Grid>

      </Grid>

    </DashboardLayout>
  );
}