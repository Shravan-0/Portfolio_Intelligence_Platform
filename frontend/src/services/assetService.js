import axios from "axios";

const API_BASE_URL =
  "http://127.0.0.1:8000";

export const createAsset =
  async (assetData) => {

    const response =
      await axios.post(
        `${API_BASE_URL}/assets/`,
        assetData
      );

    return response.data;
  };

export const getAssetsByPortfolio =
  async (portfolioId) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/assets/portfolio/${portfolioId}`
      );

    return response.data;
  };

export const updateAsset =
  async (
    assetId,
    assetData
  ) => {

    const response =
      await axios.put(
        `${API_BASE_URL}/assets/${assetId}`,
        assetData
      );

    return response.data;
  };

export const deleteAsset =
  async (assetId) => {

    const response =
      await axios.delete(
        `${API_BASE_URL}/assets/${assetId}`
      );

    return response.data;
  };
