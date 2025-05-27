import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import StockTabs from "./components/StockTabs";
import Stock from "./components/Stock";
import SelectedStocksPage from "./components/SelectedStocksPage";
import Login from "./components/Login";

import { SelectedStocksProvider } from "./context/SelectedStocksContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
import { useEffect, useState } from "react";
import { getApiUrl, getWebSocketUrl, getAuthUrl } from "./utils/utils"; // Importing for side effects, if needed

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const AppContent = () => {
  useEffect(() => {
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

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/">Stock Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Dashboard</Nav.Link>
              <Nav.Link href="/accessToken">Initiate Websocket</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<StockTabs />} />

          <Route path="/accessToken" element={<Login />} />
          <Route path="/stock/:key/:name" element={<Stock />}></Route>
        </Routes>
      </Container>
    </>
  );
};

export default App;
