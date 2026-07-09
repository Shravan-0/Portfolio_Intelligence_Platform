import { getGoals } from "../services/analyticsService";
import { getAssetsByPortfolio } from "../services/assetService";
import { getPortfolios } from "../services/portfolioService";
import { getProfiles } from "../services/profileService";
import { getCurrentUserId } from "./currentUser";

export const resolveUserGoal = async () => {
  const goals = await getGoals();
  return goals[0] || null;
};

export const resolveUserContext = async () => {
  const userId = getCurrentUserId();

  if (!userId) {
    return {
      userId: null,
      profile: null,
      goal: null,
      portfolio: null,
      assets: [],
      hasProfile: false,
      hasGoal: false,
      hasPortfolio: false,
      hasAssets: false
    };
  }

  const [portfolios, profiles, goals] = await Promise.all([
    getPortfolios(),
    getProfiles(),
    getGoals()
  ]);

  const profile =
    profiles.find(
      (item) => item.user_id === userId
    ) || null;

  const portfolio =
    portfolios.find(
      (item) => item.user_id === userId
    ) || null;

  const goal = goals[0] || null;

  let assets = [];

  if (portfolio) {
    assets = await getAssetsByPortfolio(portfolio.id);
  }

  return {
    userId,
    profile,
    goal,
    portfolio,
    assets,
    hasProfile: Boolean(profile),
    hasGoal: Boolean(goal),
    hasPortfolio: Boolean(portfolio),
    hasAssets: assets.length > 0
  };
};

export const PAGE_DEPENDENCIES = {
  profile: [],
  goal: [],
  portfolio: [],
  assets: ["portfolio"],
  analytics: ["portfolio", "assets"],
  risk: ["profile", "portfolio", "assets"],
  optimization: ["profile", "portfolio", "assets"],
  reports: ["profile", "goal", "portfolio", "assets"]
};

export const getMissingForPage = (pageKey, context) => {
  const required = PAGE_DEPENDENCIES[pageKey] || [];
  const missing = [];

  if (required.includes("profile") && !context.hasProfile) {
    missing.push("profile");
  }

  if (required.includes("goal") && !context.hasGoal) {
    missing.push("goal");
  }

  if (required.includes("portfolio") && !context.hasPortfolio) {
    missing.push("portfolio");
  }

  if (required.includes("assets") && !context.hasAssets) {
    missing.push("assets");
  }

  return missing;
};
