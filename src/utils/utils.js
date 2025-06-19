const BASE_URL = "13.239.10.161:8443";
const BASE_URL_LOCAL = "localhost:3000";
const URL = `https://${BASE_URL}/api/`;
//const URL = `http://${BASE_URL_LOCAL}/api/`;
export const getApiUrl = (endpoint) => {
  return `${URL}${endpoint}`;
};

export const getUpstoxUrl = (endpoint) => {
  return `${URL}upstox/${endpoint}`;
};

export const getAuthUrl = () => {
  return `${URL}auth`;
};

export const getToken = () => {
  return `${URL}getAuth`;
};
