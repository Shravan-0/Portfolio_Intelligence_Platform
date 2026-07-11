import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const getRebalance = async (
  profileId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/optimization/rebalance/${profileId}`
    );

  return response.data;
};

export const getRecommendations =
  async (profileId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/optimization/recommendations/${profileId}`
      );

    return response.data;
};

export const getPortfolioHealth =
  async (portfolioId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/optimization/health/${portfolioId}`
      );

    return response.data;
};