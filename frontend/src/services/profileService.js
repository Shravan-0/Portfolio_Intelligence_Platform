import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const createProfile = async (profileData) => {
  const response = await axios.post(
    `${API_URL}/profiles/`,
    profileData
  );

  return response.data;
};

export const getProfiles = async () => {
  const response = await axios.get(
    `${API_URL}/profiles/`
  );

  return response.data;
};

export const updateProfile = async (
  profileId,
  profileData
) => {

  const response =
    await axios.put(
      `${API_URL}/profiles/${profileId}`,
      profileData
    );

  return response.data;
};