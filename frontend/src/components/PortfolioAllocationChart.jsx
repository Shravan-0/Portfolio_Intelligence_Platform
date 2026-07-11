import { useEffect, useState } from "react";
import axios from "axios";
import { Typography, Skeleton } from "@mui/material";
import AnalyticsPanel from "./AnalyticsPanel";
import { GUIDANCE } from "./guidanceUtils";
import {
  resolveUserPortfolio
} from "../utils/currentUser";
import { getAssetsByPortfolio } from "../services/assetService";
import { classifyApiError } from "../utils/apiErrors";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#06B6D4",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6"
];

export default function PortfolioAllocationChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {

  const fetchAllocation =
    async () => {
      setLoading(true);
      setGuidance(null);
      setError(null);

      try {

        const portfolio =
          await resolveUserPortfolio();

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

        const response =
          await axios.get(
            `http://127.0.0.1:8000/portfolios/${portfolio.id}/allocation`
          );

        const formattedData =
          response.data.map(
            (item) => ({
              name: item.asset_type,
              value:
                item.total_allocation
            })
          );

        setData(formattedData);

      } catch (err) {

        console.error(err);

        setError(
          classifyApiError(err).message
        );

      } finally {
        setLoading(false);
      }

    };

  fetchAllocation();

}, []);

  if (loading) {
    return (
      <AnalyticsPanel title="Portfolio Allocation">
        <Skeleton variant="rectangular" height={400} />
      </AnalyticsPanel>
    );
  }

  if (guidance) {
    return (
      <AnalyticsPanel title="Portfolio Allocation">
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
      <AnalyticsPanel title="Portfolio Allocation">
        <Typography color="error">
          {error}
        </Typography>
      </AnalyticsPanel>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={400}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={70}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={
                COLORS[index % COLORS.length]
              }
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #2A3550",
            borderRadius: "8px"
          }}
        />

        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
