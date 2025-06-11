import { Route, Routes, useLocation, Navigate } from "react-router-dom"; // Add useLocation
import { Navbar, Nav, Container } from "react-bootstrap";
import StockTabs from "./components/StockTabs";
import Stock from "./components/Stock";
import AccessToken from "./components/AccessToken";
import ProfitLoss from "./components/ProfitLoss";
import { NavLink } from "react-router-dom";
import "./App.css";
import PositionsList from "./components/Positions";
import OrderHistory from "./components/OrderHistory";
import SessionData from "./services/sessionData";
import { useEffect } from "react";
import { getToken } from "./utils/utils";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";

const sessionData = SessionData.getSessionDataInstance(); // Use your singleton method

// ProtectedRoute component to check authentication
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionData.getData("token"); // Check if token exists
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const location = useLocation(); // Get current route
  const isLoginPage = location.pathname === "/login"; // Check if on login page

  useEffect(() => {
    // Fetch the access token (unchanged)
    fetch(getToken(), {
      credentials: "include", // Ensure cookies are sent
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.auth) {
          sessionData.setData({ accessToken: data.auth });
        }
      })
      .catch((error) => {
        console.error("Error fetching token:", error);
      });
  }, []);

  return (
    <>
      {/* Conditionally render Navbar (hide on login page) */}
      {!isLoginPage && (
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
                  to="/stocks"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active fw-bold" : ""}`
                  }
                >
                  Stocks
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
      )}

      <Container className="py-4">
        <Routes>
          {/* Unprotected route for login */}
          <Route path="/login" element={<Login />} />
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <ProtectedRoute>
                <StockTabs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accessToken"
            element={
              <ProtectedRoute>
                <AccessToken />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/:key/:name"
            element={
              <ProtectedRoute>
                <Stock />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pl"
            element={
              <ProtectedRoute>
                <ProfitLoss />
              </ProtectedRoute>
            }
          />
          <Route
            path="/positions"
            element={
              <ProtectedRoute>
                <PositionsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orderHistory"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </>
  );
}

export default App;
