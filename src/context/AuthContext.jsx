import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUrl } from "../utils/utils"; // Importing for side effects, if needed

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  const login = (token) => {
    // For simplicity, validate against a hardcoded token
    // In a real app, this would involve an API call to verify the token
    const data = {
      accessToken: token,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    fetch(getAuthUrl(), options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Response:", response);
        setAccessToken(token);
      })
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const logout = () => {
    setAccessToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
