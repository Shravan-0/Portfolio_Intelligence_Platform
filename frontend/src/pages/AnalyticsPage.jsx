import { useState } from "react";

import {
  Typography
} from "@mui/material";

import DashboardLayout from "../layouts/DashboardLayout";
import AnalyticsTabs from "../components/analytics/AnalyticsTabs";
import Overview from "../components/analytics/Overview";
import RiskView from "../components/analytics/RiskView";
import OptimizationView from "../components/analytics/OptimizationView";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] =
    useState("overview");

  const renderActiveView = () => {
    switch (activeTab) {
      case "risk":
        return <RiskView />;

      case "optimization":
        return <OptimizationView />;

      case "overview":
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardLayout>
  <Typography variant="h4">
    Analytics Dashboard
  </Typography>

  <AnalyticsTabs
    activeTab={activeTab}
    onTabChange={setActiveTab}
  />

  {renderActiveView()}
</DashboardLayout>
  );
}
