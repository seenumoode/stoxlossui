const BASE_URL = "13.239.10.161:8443";
export const getApiUrl = (endpoint) => {
  return `https://${BASE_URL}/api/${endpoint}`;
};
export const getWebSocketUrl = () => {
  return `ws://${BASE_URL}`;
};
export const getAuthUrl = () => {
  return `https://${BASE_URL}/api/auth`;
};
