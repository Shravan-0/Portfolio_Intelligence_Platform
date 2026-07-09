import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh"
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flex: 1,
          overflow: "auto"
        }}
      >
        <Topbar />

        <Box
          sx={{
            px: {
  xs: 2,
  md: 5
},

py: {
  xs: 2,
  md: 4
},
            maxWidth: "1600px",
            margin: "0 auto"
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}