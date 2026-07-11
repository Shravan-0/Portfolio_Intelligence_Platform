import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const getRiskProfile = async (
  profileId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/risk/profile/${profileId}`
    );

  return response.data;
};

export const getPortfolioRisk = async (
  portfolioId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/risk/portfolio/${portfolioId}`
    );

  return response.data;
};

export const getAssetAllocation = async (
  portfolioId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/risk/allocation/${portfolioId}`
    );

  return response.data;
};

export const getDiversification = async (
  portfolioId
) => {

  const response =
    await axios.get(
      `${API_BASE_URL}/risk/diversification/${portfolioId}`
    );

  return response.data;
};