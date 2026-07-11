import { Card, CardContent, Typography, Box } from "@mui/material";

export default function SummaryCard({ title, value, subtitle, accent = "#3B82F6" }) {
  return (
    <Card
      sx={{
        bgcolor: "#12182A",
        borderRadius: 3,
        height: "100%",
        minHeight: 154,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 22px rgba(0,0,0,0.10)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        "&:hover": {
          borderColor: "rgba(148,163,184,0.24)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.16)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", bgcolor: accent, opacity: 0.7 }} />
      <CardContent
        sx={{
          p: { xs: 2.25, sm: 2.75 },
          pl: { xs: 2.75, sm: 3.25 },
          "&:last-child": { pb: { xs: 2.25, sm: 2.75 } },
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#64748B", fontWeight: 600, letterSpacing: "0.02em" }}
        >
          {title}
        </Typography>

        <Typography
          variant="h5"
          fontWeight={750}
          mt={1}
          sx={{ color: "#F1F5F9", lineHeight: 1.2, letterSpacing: "-0.02em" }}
        >
          {value}
        </Typography>

        <Typography variant="caption" sx={{ color: "#475569" }} mt={1.5} display="block">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}
