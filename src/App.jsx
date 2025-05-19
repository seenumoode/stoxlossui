// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import StockTabs from "./components/StockTabs";
import SelectedStocksPage from "./components/SelectedStocksPage";
import gainers from "./data/gainers";
import losers from "./data/losers";
import { SelectedStocksProvider } from "./context/SelectedStocksContext";
import "./App.css";

function App() {
  return (
    <SelectedStocksProvider>
      <Router>
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
          <Container>
            <Navbar.Brand href="/">Stock Dashboard</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="/">Dashboard</Nav.Link>
                <Nav.Link href="/selected">Selected</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container>
          <Routes>
            <Route
              path="/"
              element={<StockTabs gainers={gainers} losers={losers} />}
            />
            <Route path="/selected" element={<SelectedStocksPage />} />
          </Routes>
        </Container>
      </Router>
    </SelectedStocksProvider>
  );
}

export default App;
