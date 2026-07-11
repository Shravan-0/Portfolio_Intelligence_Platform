import { Box, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard": "Portfolio Overview",
  "/portfolio": "Portfolio Intelligence",
  "/analytics": "Analytics",
  "/goals": "Financial Goals",
  "/reports": "Reports",
  "/profile": "Investor Profile",
  "/settings": "Settings",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || "PortfolioIQ";

  return (
    <Box
      sx={{
        px: { xs: 2.5, md: 4 },
        py: 2,
        borderBottom: "1px solid rgba(148,163,184,0.10)",
        background: "#0B1120",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
  variant="h6"
  sx={{
    color: "#849ec3",
    fontWeight: 700,
    letterSpacing: 0.3,
    fontSize: { 
      xs: "1.1rem",
      md: "1.25rem",
    },
  }}
>
  {title}
</Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.5,
          borderRadius: 6,
          border: "1px solid rgba(34,197,94,0.3)",
          bgcolor: "rgba(34,197,94,0.08)",
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#22C55E" }} />
        <Typography variant="caption" sx={{ color: "#4ADE80", fontWeight: 600 }}>
          Markets Live
        </Typography>
      </Box>
    </Box>
  );
}