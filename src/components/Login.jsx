import { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [token, setToken] = useState("");
  const { login } = useAuth();

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
    </Container>
  );
};

export default Login;
