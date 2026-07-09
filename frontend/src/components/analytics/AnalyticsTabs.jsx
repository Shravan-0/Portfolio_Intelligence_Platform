import { Tabs, Tab, Paper } from "@mui/material";

export default function AnalyticsTabs({
  activeTab,
  onTabChange,
}) {
  const handleChange = (event, newValue) => {
    onTabChange(newValue);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        borderRadius: 3,
        bgcolor: "#131C2F",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleChange}
        textColor="inherit"
        indicatorColor="primary"
        variant="fullWidth"
        sx={{
          "& .MuiTab-root": {
            color: "#94A3B8",
            fontWeight: 600,
            textTransform: "none",
            fontSize: "0.95rem",
            minHeight: 60,
          },

          "& .Mui-selected": {
            color: "#FFFFFF",
          },

          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
            backgroundColor: "#3B82F6",
          },
        }}
      >
        <Tab
          label="Overview"
          value="overview"
        />

        <Tab
          label="Risk"
          value="risk"
        />

        <Tab
          label="Optimization"
          value="optimization"
        />
      </Tabs>
    </Paper>
  );
}