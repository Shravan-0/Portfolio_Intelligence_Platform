import axios from "axios";


const API_BASE_URL =
  "http://127.0.0.1:8000";

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
        `${API_BASE_URL}/portfolios`
      );

    return response.data;
};