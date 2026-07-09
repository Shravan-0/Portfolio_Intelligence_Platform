import {
  Card,
  CardContent,
  Typography
} from "@mui/material";

export default function SummaryCard({
  title,
  value,
  subtitle
}) {
  return (
    <Card
      sx={{
        bgcolor: "#131C2F",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 3,
        minHeight: 180
      }}
    >
      <CardContent
        sx={{
          p: 3
        }}
      >
        <Typography
          variant="body2"
          color="#94A3B8"
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={700}
          mt={2}
        >
          {value}
        </Typography>

        <Typography
          variant="body2"
          color="#64748B"
          mt={3}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}