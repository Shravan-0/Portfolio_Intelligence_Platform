import axios from "axios";
import { getCurrentUserId } from "../utils/currentUser";

import { API_BASE_URL } from "../config/api";

export const getGoalProbability = async (params = null) => {
  const payload = params || {
    current_value: 500000,
    monthly_contribution: 10000,
    expected_return: 12,
    volatility: 15,
    years: 10,
    target_amount: 4000000,
    simulations: 1000
  };
  const response = await axios.post(
  `${API_BASE_URL}/goal-probability`,
  payload
);

  return response.data;
};

export const getGoals = async () => {
  const userId = getCurrentUserId();

  if (!userId) {
    return [];
  }

  const response = await axios.get(
    `${API_BASE_URL}/goals`,
    {
      params: {
        user_id: userId
      }
    }
  );

  return response.data;
};

export const getMonteCarlo = async (
  profileId,
  payload
) => {

  const response =
    await axios.post(
      `${API_BASE_URL}/analytics/monte-carlo/${profileId}`,
      payload
    );

  return response.data;
};

export const getEfficientFrontier = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/analytics/efficient-frontier`
  );

  return response.data;
};

export const getFactorExposure = async (
  portfolioId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/analytics/factor-exposure/${portfolioId}`
    );

  return response.data;
};