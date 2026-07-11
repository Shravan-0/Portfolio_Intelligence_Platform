import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SimpleBar from "simplebar-react";

export default function DashboardLayout({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar />

        <SimpleBar
  style={{
    flex: 1,
    maxHeight: "100%",
  }}
>
  <Box
  sx={{
    px: {
      xs: 2,
      md: 5,
    },

    pt: {
      xs: 2,
      md: 4,
    },

    pb: {
      xs: 6,
      md: 8,
    },

    maxWidth: "1600px",
    width: "100%",
    margin: "0 auto",
  }}
>
  {children}
</Box>
</SimpleBar>
      </Box>
    </Box>
  );
}