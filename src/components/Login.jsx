import { useEffect, useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";

import { getAuthUrl, getToken } from "../utils/utils";
import SessionData from "../services/sessionData";

const sessionData = new SessionData();

const Login = () => {
  const [token, setToken] = useState();

  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // Fetch the token from the server when the component mounts
    if (sessionData.getData("accessToken")) {
      setAccessToken(sessionData.getData("accessToken"));
    } else
      fetch(getToken())
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Token fetched successfully:", data);
          if (data.auth) {
            sessionData.setData({ accessToken: data.auth });
            console.log(
              "Access Token set in session data:",
              sessionData.getData("accessToken")
            );
            console.log("Access Tokensssss set in session data:", sessionData);
            setAccessToken(data.auth);
          }
        })
        .catch((error) => {
          console.error("Error fetching token:", error);
        });
  }, []);

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
        sessionData.setData({ accessToken: data.auth });
        setAccessToken(token);
      })
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      login(token);
    } else {
      alert("Please enter an access token.");
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {!accessToken && (
        <Card
          className="stock-card shadow-sm p-4"
          style={{ maxWidth: "400px", width: "100%" }}
        >
          <Card.Body>
            <Card.Title className="text-center mb-4">
              Login to Stock Dashboard
            </Card.Title>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="accessToken">
                <Form.Label>Access Token</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your access token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  aria-label="Access token input"
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100">
                Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
      {accessToken && (
        <Card
          className="stock-card shadow-sm p-4"
          style={{ maxWidth: "400px", width: "100%" }}
        >
          <Card.Body>
            <Card.Title className="text-center mb-4">
              Successfully Initilized
            </Card.Title>
            <p className="text-center">Access Token: {token}</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Login;
