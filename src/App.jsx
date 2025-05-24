import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import StockTabs from "./components/StockTabs";
import SelectedStocksPage from "./components/SelectedStocksPage";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { SelectedStocksProvider } from "./context/SelectedStocksContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
import { useEffect, useState } from "react";
import { getApiUrl, getWebSocketUrl, getAuthUrl } from "./utils/utils"; // Importing for side effects, if needed

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

const AppContent = () => {
  const { accessToken, logout } = useAuth();
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  useEffect(() => {
    loadData();
    const wsUrl = getWebSocketUrl();
    console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);

      setGainers(data.gainers);
      setLosers(data.losers);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    websocket.onerror = (error) => {
      console.error("WebSocket errors:", error);
    };
    return () => {
      websocket.close();
    };
  }, []);

  const onDateChange = (date, dateString) => {
    console.log("Selected date:", dateString);
    const data = {
      date,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    fetch(getApiUrl("getPastData"), options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setGainers(data.gainers);
        setLosers(data.losers);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const loadData = async () => {
    try {
      const response = await fetch(getApiUrl("data"));
      const data = await response.json();
      setGainers(data.gainers);
      setLosers(data.losers);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <SelectedStocksProvider losers={losers}>
      <>
        {accessToken && (
          <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
              <Navbar.Brand href="/">Stock Dashboard</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link href="/">Dashboard</Nav.Link>
                  <Nav.Link href="/selected">Selected</Nav.Link>
                </Nav>
                <Button
                  variant="outline-light"
                  onClick={logout}
                  className="ms-auto"
                >
                  Logout
                </Button>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}
        <Container>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <StockTabs
                    gainers={gainers}
                    losers={losers}
                    onDateChange={onDateChange}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/selected"
              element={
                <ProtectedRoute>
                  <SelectedStocksPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Container>
      </>
    </SelectedStocksProvider>
  );
};

export default App;
