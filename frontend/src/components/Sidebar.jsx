import { Box, Typography, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPieChart,
  MdAnalytics,
  MdSettings,
  MdPerson,
  MdDescription,
} from "react-icons/md";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: <MdDashboard size={20} /> },
  { label: "Planning", path: "/profile", icon: <MdPerson size={20} /> },
  { label: "Portfolio", path: "/portfolio", icon: <MdPieChart size={20} /> },
  { label: "Analytics", path: "/analytics", icon: <MdAnalytics size={20} /> },
  { label: "Reports", path: "/reports", icon: <MdDescription size={20} /> },
  { label: "Settings", path: "/settings", icon: <MdSettings size={20} /> },
];

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: { xs: 76, md: 248 },
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        bgcolor: "#0B1120",
        borderRight: "1px solid rgba(148,163,184,0.10)",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, md: 2.5 },
        py: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 4, px: 0.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography fontWeight={800} fontSize="0.95rem" color="#fff">P</Typography>
        </Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="#F1F5F9"
          sx={{ display: { xs: "none", md: "block" }, letterSpacing: "-0.01em" }}
        >
          PortfolioIQ
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: { xs: "none", md: "block" },
          color: "#475569",
          fontWeight: 700,
          letterSpacing: "0.08em",
          px: 1.5,
          mb: 1,
        }}
      >
        WORKSPACE
      </Typography>

      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.label}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: 2,
              gap: 1.5,
              minHeight: 42,
              color: "#94A3B8",
              textDecoration: "none",
              justifyContent: { xs: "center", md: "flex-start" },
              transition: "background-color 0.15s ease, color 0.15s ease",
              "& svg": { flexShrink: 0 },
              "&.active": {
                backgroundColor: "rgba(59,130,246,0.14)",
                color: "#F1F5F9",
                "& svg": { color: "#3B82F6" },
              },
              "&:hover": {
                backgroundColor: "rgba(148,163,184,0.08)",
                color: "#E2E8F0",
              },
            }}
          >
            {item.icon}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
              sx={{ display: { xs: "none", md: "block" } }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: "rgba(148,163,184,0.10)", mb: 1.5, display: { xs: "none", md: "block" } }} />
      <Typography
        variant="caption"
        sx={{ display: { xs: "none", md: "block" }, color: "#334155", px: 1.5 }}
      >
        v1.0 · Institutional
      </Typography>
    </Box>
  );
}