
import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";

import { Link as RouterLink } from "react-router-dom";

const StatusIcon = ({ done }) => (
  <Typography
    component="span"
    sx={{
      fontWeight: 700,
      color: done ? "success.main" : "error.main",
      width: 24,
      display: "inline-block"
    }}
  >
    {done ? "✔" : "✖"}
  </Typography>
);

const CHECKLIST_ITEMS = [
  {
    key: "profile",
    label: "Create Investor Profile",
    path: "/profile"
  },
  {
    key: "goal",
    label: "Create Goal",
    path: "/profile"
  },
  {
    key: "portfolio",
    label: "Create Portfolio",
    path: "/portfolio"
  }
];

export default function SetupChecklist({
  context
}) {
  const status = {
    profile: context?.hasProfile,
    goal: context?.hasGoal,
    portfolio: context?.hasPortfolio
  };

  return (
    <Paper
      sx={{
        p: 4,
        maxWidth: 560
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        mb={1}
      >
      </Typography>

      <List dense sx={{ mb: 3 }}>
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StatusIcon done />
          </ListItemIcon>
          <ListItemText primary="Logged in" />
        </ListItem>

        {CHECKLIST_ITEMS.map((item) => (
          <ListItem
            key={item.key}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <StatusIcon done={status[item.key]} />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>

      {!status.profile || !status.goal ? (
        <Button
          variant="contained"
          component={RouterLink}
          to="/profile"
        >
          Go to Investor Profile
        </Button>
      ) : !status.portfolio ? (
        <Button
          variant="contained"
          component={RouterLink}
          to="/portfolio"
        >
          Create Portfolio
        </Button>
      ) : null}
    </Paper>
  );
}