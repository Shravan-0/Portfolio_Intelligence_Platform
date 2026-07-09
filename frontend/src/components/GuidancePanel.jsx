import {
  Alert,
  Box,
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

export function ServerErrorAlert({ message }) {
  return (
    <Alert severity="error">
      {message}
    </Alert>
  );
}

export function SetupChecklist({
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

export function GuidancePanel({
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

export function GuidanceAlert({
  severity = "info",
  children
}) {
  return (
    <Alert severity={severity} sx={{ mb: 3 }}>
      {children}
    </Alert>
  );
}

export const GUIDANCE = {
  almostReady: {
    title: "Almost ready.",
    message: "Create your portfolio to begin investing.",
    actionLabel: "Create Portfolio",
    actionTo: "/portfolio"
  },
  portfolioNoAssets: {
    title: "Portfolio created successfully.",
    message: "Add your first asset to unlock:",
    bullets: [
      "Portfolio Analytics",
      "Risk Analysis",
      "Portfolio Optimization"
    ],
    actionLabel: "Add Asset",
    actionTo: "/portfolio"
  },
  profileRequiredRisk: {
    title: "Investor Profile required.",
    message:
      "Create your Investor Profile to calculate your personalized risk profile.",
    actionLabel: "Create Investor Profile",
    actionTo: "/profile"
  },
  goalRequiredDashboard: {
    title: "Goal not created.",
    message:
      "Goal Probability and Retirement Planning are unavailable until you create a goal."
  },
  portfolioNotFound: {
    title: "Portfolio not found.",
    actionLabel: "Create Portfolio",
    actionTo: "/portfolio"
  },
  profileNotFound: {
    title: "Investor Profile not found.",
    
    actionLabel: "Create Investor Profile",
    actionTo: "/profile"
  },
  goalNotFound: {
    title: "Goal not found.",
    message:
      "Create a financial goal to calculate Goal Success Probability.",
    actionLabel: "Create Goal",
    actionTo: "/profile"
  },
  analyticsNoAssets: {
    title: "No portfolio analytics available yet.",
    message: "Add assets to generate analytics.",
    actionLabel: "Add Asset",
    actionTo: "/portfolio"
  },
  portfolioNoHoldings: {
    message: "Add your first asset to begin portfolio analysis.",
    actionLabel: "Add Asset",
    actionTo: "/portfolio"
  },
  reportsNotReady: {
    title: "Report not available yet.",
    message:
      "Complete your Investor Profile, Goal, Portfolio, and add at least one asset to generate a report.",
    actionLabel: "Complete Setup",
    actionTo: "/profile"
  }
};

export function getGuidanceForMissing(missing) {
  if (!missing.length) {
    return null;
  }

  const first = missing[0];

  if (first === "profile") {
    return GUIDANCE.profileNotFound;
  }

  if (first === "goal") {
    return GUIDANCE.goalNotFound;
  }

  if (first === "portfolio") {
    return GUIDANCE.portfolioNotFound;
  }

  if (first === "assets") {
    return GUIDANCE.analyticsNoAssets;
  }

  return null;
}
