import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Skeleton
} from "@mui/material";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import AnalyticsPanel from "./AnalyticsPanel";

import {
  getEfficientFrontier
} from "../services/analyticsService";
import { classifyApiError } from "../utils/apiErrors";

export default function EfficientFrontierWidget() {

  const [frontier, setFrontier] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFrontier = async () => {
    setLoading(true);
    setError(null);

    try {
      const result =
        await getEfficientFrontier();

      setFrontier(result.frontier);
    } catch (err) {
      console.error(err);
      setError(classifyApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        await fetchFrontier();
    };

    init();
}, []);

  if (loading) {
  return (
    <AnalyticsPanel
      title="Efficient Frontier"
    >
      <Skeleton
        variant="rectangular"
        height={340}
      />
    </AnalyticsPanel>
  );
}


  if (error) {
    return (
      <AnalyticsPanel title="Efficient Frontier">
        <Typography color="error">
          {error}
        </Typography>
      </AnalyticsPanel>
    );
  }
if (!frontier || frontier.length === 0) {
  return (
    <AnalyticsPanel title="Efficient Frontier">
      <Box
        sx={{
          height: 500,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h6"
          color="#94A3B8"
          gutterBottom
        >
          Efficient Frontier Unavailable
        </Typography>

        <Typography
          color="#64748B"
          textAlign="center"
        >
          Add at least two assets to your portfolio to
          generate an Efficient Frontier.
        </Typography>
      </Box>
    </AnalyticsPanel>
  );
}
  return (
  <AnalyticsPanel
    title="Efficient Frontier"
  >
    <Box>

      <Typography
        color="#94A3B8"
        mb={1}
        fontSize={14}
      >
        Return (%)
      </Typography>

      <ResponsiveContainer
        width="100%"
        height={500}
      >
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 20
          }}
        >
          <CartesianGrid
            stroke="#243244"
            strokeDasharray="3 3"
          />

          <XAxis
            type="number"
            dataKey="risk"
            name="Risk"
            tick={{
              fill: "#94A3B8",
              fontSize: 12
            }}
            axisLine={{
              stroke: "#2A3550"
            }}
            tickLine={false}
          />

          <YAxis
            type="number"
            dataKey="return"
            name="Return"
            tick={{
              fill: "#94A3B8",
              fontSize: 12
            }}
            axisLine={{
              stroke: "#2A3550"
            }}
            tickLine={false}
          />

          <Tooltip
            cursor={false}
            formatter={(value, name) => [
              Number(value).toFixed(3),
              name
            ]}
            contentStyle={{
              background: "#111827",
              border: "1px solid #2A3550",
              borderRadius: "8px",
              color: "#fff"
            }}
          />

         <Scatter
  data={frontier.filter(point => !point.optimal)}
  fill="#3B82F6"
  shape="circle"
/>

<Scatter
  data={frontier.filter(point => point.optimal)}
  fill="#EF4444"
  shape="circle"
/>
        </ScatterChart>
      </ResponsiveContainer>

      <Typography
        color="#94A3B8"
        mt={1}
        sx={{
    textAlign: "center"
  }}
        fontSize={14}
      >
        Risk (Volatility)
      </Typography>

    </Box>
  </AnalyticsPanel>
);
}
