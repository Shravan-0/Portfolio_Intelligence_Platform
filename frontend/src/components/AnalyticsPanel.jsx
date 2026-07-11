import { Card, CardContent, Typography } from "@mui/material";

export default function AnalyticsPanel({ title, children, sx, contentSx }) {
  return (
    <Card
      sx={{
        bgcolor: "#12182A",
        borderRadius: 3,
        height: "100%",
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.12)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        "&:hover": {
          borderColor: "rgba(148,163,184,0.22)",
          boxShadow: "0 14px 32px rgba(0, 0, 0, 0.18)",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
        ...sx,
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.25, sm: 3 },
          height: "100%",
          "&:last-child": { pb: { xs: 2.25, sm: 3 } },
          ...contentSx,
        }}  
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          mb={2.5}
          sx={{ color: "#E2E8F0", letterSpacing: "-0.01em", lineHeight: 1.35 }}
        >
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
