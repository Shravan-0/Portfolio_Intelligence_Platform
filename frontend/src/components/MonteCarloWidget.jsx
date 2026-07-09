import { useEffect, useState } from "react";

import {
  Typography,
  Box,
  Skeleton
} from "@mui/material";

import AnalyticsPanel from "./AnalyticsPanel";
import { GUIDANCE } from "./GuidancePanel";

import {
  getMonteCarlo,
  getGoals
} from "../services/analyticsService";
import {
  resolveUserPortfolio,
  resolveUserProfile,
  yearsUntilTargetDate
} from "../utils/currentUser";
import { classifyApiError } from "../utils/apiErrors";

export default function MonteCarloWidget() {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [guidance, setGuidance] =
    useState(null);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    fetchMonteCarlo();
  }, []);

  const fetchMonteCarlo = async () => {
    setLoading(true);
    setGuidance(null);
    setError(null);

    try {
      const [portfolio, profile, goals] = await Promise.all([
        resolveUserPortfolio(),
        resolveUserProfile(),
        getGoals(),
      ]);

      if (!portfolio) {
        setGuidance(GUIDANCE.portfolioNotFound);
        return;
      }

      if (!profile) {
        setGuidance(GUIDANCE.profileNotFound);
        return;
      }

      const [userGoal] = goals;

      const years = userGoal
        ? yearsUntilTargetDate(userGoal.target_date)
        : 10;

      const result =
        await getMonteCarlo(
          profile.id,
          {
            initial_amount: userGoal
              ? Math.max(1, userGoal.current_amount)
              : 500000,
            monthly_contribution: userGoal
              ? userGoal.monthly_contribution
              : 15000,
            years,
            simulations: 1000
          }
        );

      setData(result);

    } catch (err) {

      console.error(err);

      setError(
        classifyApiError(err).message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AnalyticsPanel title="Monte Carlo Projection">
        <Skeleton height={40} />
        <Skeleton height={40} />
        <Skeleton height={80} />
      </AnalyticsPanel>
    );
  }

  if (guidance) {
    return (
      <AnalyticsPanel title="Monte Carlo Projection">
        <Typography color="#94A3B8" mb={1}>
          {guidance.title}
        </Typography>
        <Typography color="#64748B">
          {guidance.message}
        </Typography>
      </AnalyticsPanel>
    );
  }

  if (error) {
    return (
      <AnalyticsPanel title="Monte Carlo Projection">
        <Typography color="error">
          {error}
        </Typography>
      </AnalyticsPanel>
    );
  }

  return (
    <AnalyticsPanel
      title="Monte Carlo Projection"
    >

      <Box mb={4}>

        <Typography
          color="#94A3B8"
        >
          Risk Profile
        </Typography>

        <Typography
          variant="h6"
          fontWeight={700}
        >
          {data?.risk_profile}
        </Typography>

      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 5,
          mb: 4
        }}
      >

        <Box>
          <Typography
            color="#94A3B8"
          >
            Expected Return
          </Typography>

          <Typography
            fontWeight={700}
          >
            {`${data.expected_return}%`}
          </Typography>
        </Box>

        <Box>
          <Typography
            color="#94A3B8"
          >
            Volatility
          </Typography>

          <Typography
            fontWeight={700}
          >
            {`${data.volatility}%`}
          </Typography>
        </Box>

      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3,1fr)"
          },
          gap: 4
        }}
      >

        <Box>

          <Typography
            color="#94A3B8"
          >
            Worst Case
          </Typography>

          <Typography
            variant="h5"
            fontWeight={700}
          >
            {`$${data.worst_case.toLocaleString()}`}
          </Typography>

        </Box>

        <Box>

          <Typography
            color="#94A3B8"
          >
            Median
          </Typography>

          <Typography
            variant="h5"
            fontWeight={700}
          >
            {`$${data.median_value.toLocaleString()}`}
          </Typography>

        </Box>

        <Box>

          <Typography
            color="#94A3B8"
          >
            Best Case
          </Typography>

          <Typography
            variant="h5"
            fontWeight={700}
          >
            {`$${data.best_case.toLocaleString()}`}
          </Typography>

        </Box>

      </Box>

    </AnalyticsPanel>
  );
}
