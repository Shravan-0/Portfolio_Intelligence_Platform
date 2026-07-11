import { useEffect, useState } from "react";

import {
  Typography,
  LinearProgress,
  Box,
  Skeleton
} from "@mui/material";

import AnalyticsPanel from "./AnalyticsPanel";
import { GUIDANCE } from "./guidanceUtils";

import {
  getGoalProbability,
  getGoals
} from "../services/analyticsService";
import { classifyApiError } from "../utils/apiErrors";

export default function GoalProbabilityWidget() {

  const [
    probability,
    setProbability
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [guidance, setGuidance] =
    useState(null);

  const [
    error,
    setError
  ] = useState(null);

  const fetchProbability = async () => {
    setLoading(true);
    setGuidance(null);
    setError(null);

    try {

      const [userGoal] = await getGoals();

      if (!userGoal) {
        setGuidance(GUIDANCE.goalNotFound);
        return;
      }

      const targetYear =
        new Date(
          userGoal.target_date
        ).getFullYear();

      const currentYear =
        new Date().getFullYear();

      const years =
        Math.max(
          1,
          targetYear - currentYear
        );

      const result =
        await getGoalProbability({

          current_value:
            Math.max(
              1,
              userGoal.current_amount
            ),

          monthly_contribution:
            userGoal.monthly_contribution,

          expected_return: 12,

          volatility: 15,

          years,

          target_amount:
            userGoal.target_amount,

          simulations: 1000

        });

      setProbability(
        result.probability
      );

    } catch (err) {

      console.error(err);

      setError(
        classifyApiError(err).message
      );

    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    const init = async () => {
        await fetchProbability();
    };

    init();
}, []);


  if (loading) {
    return (
      <AnalyticsPanel title="Goal Success Probability">
        <Skeleton width={120} height={80} />
        <Skeleton height={14} sx={{ mt: 3 }} />
      </AnalyticsPanel>
    );
  }

  if (guidance) {
    return (
      <AnalyticsPanel title="Goal Success Probability">
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
      <AnalyticsPanel title="Goal Success Probability">
        <Typography color="error">
          {error}
        </Typography>
      </AnalyticsPanel>
    );

  }

  return (

    <AnalyticsPanel
      title="Goal Success Probability"
    >

      <Box
        sx={{
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >

        <Typography
          variant="h2"
          fontWeight={700}
        >
          {`${probability}%`}
        </Typography>

        <Typography
          sx={{
            color: "#94A3B8",
            mt: 1,
            mb: 3
          }}
        >
          Probability of achieving target goal
        </Typography>

        <LinearProgress
          variant="determinate"
          value={probability || 0}
          sx={{
            height: 14,
            borderRadius: 8,
            backgroundColor:
              "rgba(255,255,255,0.08)",

            "& .MuiLinearProgress-bar": {
              borderRadius: 8
            }
          }}
        />

      </Box>

    </AnalyticsPanel>

  );
}
