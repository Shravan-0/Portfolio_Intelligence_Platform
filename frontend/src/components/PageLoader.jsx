import { Box, CircularProgress, Typography } from "@mui/material";

export default function PageLoader({
  message = "Loading..."
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={240}
      gap={2}
    >
      <CircularProgress />
      <Typography color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
