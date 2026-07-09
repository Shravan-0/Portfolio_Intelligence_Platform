import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const generatePortfolioReport = async (portfolioId) => {
  const response = await axios.get(
    `${API_URL}/report/portfolio/${portfolioId}`
  );

  return response.data;
};

export const getReportSummary = async (portfolioId) => {
  const response = await axios.get(
    `${API_URL}/report/portfolio/${portfolioId}/summary`
  );

  return response.data;
};

export const getLatestReport = async (portfolioId) => {
  const response = await axios.get(
    `${API_URL}/report/portfolio/${portfolioId}/latest`
  );

  return response.data;
};

export const getReportHistory = async (portfolioId) => {
  const response = await axios.get(
    `${API_URL}/report/portfolio/${portfolioId}/history`
  );

  return response.data;
};

export const getRecentReportActivity = async (portfolioId) => {
  const response = await axios.get(
    `${API_URL}/report/portfolio/${portfolioId}/activity`
  );

  return response.data;
};

export const downloadReportVersion = async (reportId) => {
  const response = await axios.get(
    `${API_URL}/report/download/report/${reportId}`,
    {
      responseType: "blob"
    }
  );

  return response;
};
