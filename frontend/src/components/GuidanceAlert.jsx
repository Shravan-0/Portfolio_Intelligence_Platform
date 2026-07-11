import { Alert } from "@mui/material";

export default function GuidanceAlert({
  severity = "info",
  children
}) {
  return (
    <Alert severity={severity} sx={{ mb: 3 }}>
      {children}
    </Alert>
  );
}