import {
  Box,
  Button,
  Paper,
  Typography
} from "@mui/material";

import { Link as RouterLink } from "react-router-dom";



export default function GuidancePanel({
  title,
  message,
  bullets = [],
  actionLabel,
  actionTo
}) {
  return (
    <Paper
      sx={{
        p: 4,
        maxWidth: 640
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        mb={1}
      >
        {title}
      </Typography>

      {message && (
        <Typography
          color="text.secondary"
          mb={bullets.length ? 2 : 3}
        >
          {message}
        </Typography>
      )}

      {bullets.length > 0 && (
        <Box component="ul" sx={{ pl: 2, mb: 3, mt: 0 }}>
          {bullets.map((item) => (
            <Typography
              component="li"
              key={item}
              color="text.secondary"
              mb={0.5}
            >
              {item}
            </Typography>
          ))}
        </Box>
      )}

      {actionLabel && actionTo && (
        <Button
          variant="contained"
          component={RouterLink}
          to={actionTo}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}



