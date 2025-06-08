import { Route, Routes } from "react-router";
import { Navbar, Nav, Container } from "react-bootstrap";
import StockTabs from "./components/StockTabs";
import Stock from "./components/Stock";
import Login from "./components/Login";
import ProfitLoss from "./components/ProfitLoss";
import { NavLink } from "react-router-dom"; // Use NavLink instead of Link
import "./App.css";
import PositionsList from "./components/Positions";
import OrderHistory from "./components/OrderHistory";

function App() {
  console.log("App component rendered");

  return (
    <>
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="mb-4 shadow-sm"
        sticky="top"
      >
        <Container>
          <Navbar.Brand as={NavLink} to="/" className="fw-bold">
            Stock Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto gap-2">
              <Nav.Link
                as={NavLink}
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                Dashboard
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/accessToken"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                Initiate Websocket
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/pl"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                PL
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/positions"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                Positions
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/orderHistory"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                Order History
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<StockTabs />} />
          <Route path="/accessToken" element={<Login />} />
          <Route path="/stock/:key/:name" element={<Stock />} />
          <Route path="/pl" element={<ProfitLoss />} />
          <Route path="/positions" element={<PositionsList />} />
          <Route path="/orderHistory" element={<OrderHistory />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
