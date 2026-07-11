import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  LinearProgress,
  Skeleton
} from "@mui/material";

import AnalyticsPanel from "./AnalyticsPanel";
import { GUIDANCE } from "./guidanceUtils";

import {
  getFactorExposure
} from "../services/analyticsService";
import {
  resolveUserPortfolio
} from "../utils/currentUser";
import { getAssetsByPortfolio } from "../services/assetService";
import { classifyApiError } from "../utils/apiErrors";

export default function FactorExposureWidget() {

  const [exposures, setExposures] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState(null);


  const fetchExposure = async () => {
    setLoading(true);
    setGuidance(null);
    setError(null);

    try {
      const portfolio = await resolveUserPortfolio();

      if (!portfolio) {
        setGuidance(GUIDANCE.portfolioNotFound);
        return;
      }

      const assets =
        await getAssetsByPortfolio(portfolio.id);

      if (!assets.length) {
        setGuidance(GUIDANCE.analyticsNoAssets);
        return;
      }

      const result =
        await getFactorExposure(portfolio.id);

      setExposures(result.exposures);
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        await fetchExposure();
    };

    init();
}, []);

  if (loading) {
  return (
    <AnalyticsPanel
      title="Factor Exposure Analysis"
    >
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
    </AnalyticsPanel>
  );
}

  if (guidance) {
    return (
      <AnalyticsPanel title="Factor Exposure Analysis">
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
      <AnalyticsPanel title="Factor Exposure Analysis">
        <Typography color="error">
          {error}
        </Typography>
      </AnalyticsPanel>
    );
  }

  return (
    <AnalyticsPanel
      title="Factor Exposure Analysis"
    >
      {exposures.map((factor) => (
        <Box
          key={factor.factor}
          mb={3}
        >
          <Box
            sx={{
    display: "flex",
    justifyContent: "space-between"
  }}
            mb={1}
          >
            <Typography>
              {factor.factor}
            </Typography>

            <Typography>
              {Number(factor.exposure || 0).toFixed(2)}%
            </Typography>
          </Box>

          <LinearProgress
  variant="determinate"
  value={factor.exposure}
  sx={{
    height: 12,

    borderRadius: 6,

    backgroundColor:
      "rgba(255,255,255,0.08)",

    "& .MuiLinearProgress-bar": {
      borderRadius: 6
    }
  }}
/>
        </Box>
      ))}
    </AnalyticsPanel>
  );
}
