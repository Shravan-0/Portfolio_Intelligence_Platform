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
