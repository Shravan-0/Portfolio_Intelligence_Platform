import { Box, CircularProgress, Typography } from "@mui/material";

export default function PageLoader({ message = "Loading..." }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={280}
      gap={2}
    >
      <CircularProgress size={36} thickness={4} sx={{ color: "primary.main" }} />
      <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}