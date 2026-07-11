import axios from "axios";

import { API_BASE_URL } from "../config/api";

export const createGoal = async (
  goalData
) => {

  const response =
    await axios.post(
      `${API_URL}/goals`,
      goalData
    );

  return response.data;
};

export const updateGoal = async (
  goalId,
  goalData
) => {

  const response =
    await axios.put(
      `${API_URL}/goals/${goalId}`,
      goalData
    );

  return response.data;
};

export const getGoal = async (
  goalId
) => {

  const response =
    await axios.get(
      `${API_URL}/goals/${goalId}`
    );

  return response.data;
};

export const deleteGoal = async (
  goalId
) => {

  const response =
    await axios.delete(
      `${API_URL}/goals/${goalId}`
    );

  return response.data;
};