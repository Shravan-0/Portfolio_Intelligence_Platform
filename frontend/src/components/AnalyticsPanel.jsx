import {
  Card,
  CardContent,
  Typography
} from "@mui/material";

export default function AnalyticsPanel({
  title,
  children
}) {
  return (
    <Card
  sx={{
    bgcolor: "#131C2F",

    border:
      "1px solid rgba(255,255,255,0.05)",

    borderRadius: 3,

    "&:focus": {
      outline: "none"
    },

    "&:focus-visible": {
      outline: "none"
    }
  }}
>
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          mb={3}
        >
          {title}
        </Typography>

        {children}
      </CardContent>
    </Card>
  );
}