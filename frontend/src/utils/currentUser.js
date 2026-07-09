import { getPortfolios } from "../services/portfolioService";
import { getProfiles } from "../services/profileService";

export const getCurrentUserId = () => {
  return Number(
    localStorage.getItem("userId")
  );
};

export const resolveUserPortfolio = async () => {
  const userId = getCurrentUserId();

  if (!userId) {
    return null;
  }

  const portfolios = await getPortfolios();

  return (
    portfolios.find(
      (portfolio) => portfolio.user_id === userId
    ) || null
  );
};

export const resolveUserProfile = async () => {
  const userId = getCurrentUserId();

  if (!userId) {
    return null;
  }

  const profiles = await getProfiles();

  return (
    profiles.find(
      (profile) => profile.user_id === userId
    ) || null
  );
};

export const yearsUntilTargetDate = (targetDate) => {
  const targetYear = new Date(targetDate).getFullYear();
  const currentYear = new Date().getFullYear();

  return Math.max(1, targetYear - currentYear);
};

export const storeUserIdFromToken = (accessToken) => {
  const tokenData = JSON.parse(
    atob(accessToken.split(".")[1])
  );

  localStorage.setItem(
    "userId",
    tokenData.user_id
  );
};
