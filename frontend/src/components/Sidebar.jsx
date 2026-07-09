import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText
} from "@mui/material";

import { NavLink } from "react-router-dom";

import {
  MdDashboard,
  MdPieChart,
  MdAnalytics,
  MdTrackChanges,
  MdSettings,
  MdAddAPhoto,
  MdPerson,
  MdDescription
} from "react-icons/md";



const menuItems = [
    {
    label: "Dashboard",
    path: "/dashboard",
    icon: <MdDashboard />
  },
  {
  label: "Planning",
  path: "/profile",
  icon: <MdPerson/>
},
  {
    label: "Portfolio",
    path: "/portfolio",
    icon: <MdPieChart />
  },
 
  {
    label: "Analytics",
    path: "/analytics",
    icon: <MdAnalytics />
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <MdDescription />
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <MdSettings />
  }
];

export default function Sidebar() {
  return (
    <Box
  sx={{
    width: {
      xs: 80,
      md: 260
    },

    height: "100vh",

    position: "sticky",

    top: 0,

    overflowY: "auto",

    bgcolor: "#0F172A",

    borderRight:
      "1px solid rgba(255,255,255,0.05)",

    p: 3
  }}
>
      <Typography
        variant="h5"
        fontWeight={700}
        color="#3B82F6"
        mb={5}
      >
        StratFolio
      </Typography>

      <List disablePadding>
        {menuItems.map((item) => (
          <ListItemButton
  key={item.label}
  component={NavLink}
  to={item.path}
  sx={{
    mb: 1,

    borderRadius: 2,

    gap: 2,

    color: "#CBD5E1",

    textDecoration: "none",

    "&.active": {
      backgroundColor:
        "rgba(59,130,246,0.15)",

      borderLeft:
        "3px solid #3B82F6",

      color: "#FFFFFF"
    },

    "&:hover": {
      backgroundColor:
        "rgba(59,130,246,0.12)"
    }
  }}
>
            {item.icon}
            <ListItemText
              primary={item.label}
              sx={{
                display: {
                  xs: "none",
                  md: "block"
                }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}