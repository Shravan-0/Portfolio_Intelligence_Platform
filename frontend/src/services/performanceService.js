import axios from "axios";

const API_BASE_URL =
  "http://127.0.0.1:8000";

export const getPerformanceHistory =
  async (portfolioId, period = "max") => {

    const response =
      await axios.get(
        `${API_BASE_URL}/performance/history/${portfolioId}`,
        {
          params: {
            period
          }
        }
      );

    return response.data;
  };

export const getPortfolioAnalytics =
  async (portfolioId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/performance/analytics/${portfolioId}`
      );

    return response.data;
  };

export const getBenchmarkComparison =
  async (
    portfolioId,
    benchmark = "S&P 500"
  ) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/performance/benchmark/${portfolioId}`,
        {
          params: {
            benchmark
          }
        }
      );

    return response.data;
  };

export const getPortfolioScorecard =
  async (portfolioId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/performance/scorecard/${portfolioId}`
      );

    return response.data;
  };
