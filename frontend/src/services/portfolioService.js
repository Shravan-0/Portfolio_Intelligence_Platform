import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const getPortfolioAssets =
  async (portfolioId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/portfolios/${portfolioId}/assets`
      );

    return response.data;
};

export const getPortfolios =
  async () => {

    const response =
      await axios.get(
        `${API_BASE_URL}/portfolios/`
      );

    return response.data;
};