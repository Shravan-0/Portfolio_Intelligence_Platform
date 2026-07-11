import axios from "axios";

import { API_BASE_URL } from "../config/api";

const CRYPTO_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "ADA",
  "XRP",
  "DOGE",
  "BNB",
  "DOT",
  "MATIC",
  "AVAX"
];

const isCryptoAsset = (asset) => {
  const type =
    asset.asset_type?.toLowerCase() || "";
  const ticker =
    asset.ticker?.toUpperCase() || "";

  return (
    type.includes("crypto") ||
    type.includes("digital") ||
    CRYPTO_SYMBOLS.includes(ticker)
  );
};

export const getStockMarketData =
  async (ticker) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/market-data/stock/${ticker}`
      );

    return response.data;
  };

export const getCryptoMarketData =
  async (symbol) => {

    const response =
      await axios.get(
        `${API_BASE_URL}/market-data/crypto/${symbol}`
      );

    return response.data;
  };

export const getAssetMarketData =
  async (asset) => {

    if (isCryptoAsset(asset)) {
      return getCryptoMarketData(asset.ticker);
    }

    return getStockMarketData(asset.ticker);
  };
