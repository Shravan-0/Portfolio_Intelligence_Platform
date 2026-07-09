export const isNetworkError = (error) =>
  error?.code === "ERR_NETWORK" || !error?.response;

export const isNotFoundError = (error) =>
  error?.response?.status === 404;

export const classifyApiError = (error) => {
  if (isNetworkError(error)) {
    return {
      type: "network",
      message:
        "Network error."
    };
  }

  if (isNotFoundError(error)) {
    return {
      type: "missing",
      message: error.response?.data?.detail || null
    };
  }

  return {
    type: "server",
    message: "Something went wrong. Please try again."
  };
};
