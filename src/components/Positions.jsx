import React, { useEffect, useState } from "react";
import { Card, Col, Row, Badge, Container, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import SessionData from "../services/sessionData";
import "./css/Positions.css";

const sessionData = new SessionData();

const Positions = ({ position }) => {
  const {
    trading_symbol,
    last_price,
    buy_price,
    sell_price,
    quantity,
    multiplier,
    overnight_buy_quantity,
  } = position;

  // Determine if position is closed (sell_price > 0)
  const isClosed = sell_price > 0;

  // Calculate P&L
  const plFromClose = isClosed
    ? ((sell_price - buy_price) * overnight_buy_quantity * multiplier).toFixed(
        2
      )
    : ((last_price - buy_price) * quantity * multiplier).toFixed(2);
  const plColor = plFromClose >= 0 ? "text-profit" : "text-loss";

  // Calculate P&L percentage
  const plPercentage = isClosed
    ? (((sell_price - buy_price) / buy_price) * 100).toFixed(2)
    : (((last_price - buy_price) / buy_price) * 100).toFixed(2);
  const plPercentageBg = plPercentage >= 0 ? "bg-profit" : "bg-loss";

  return (
    <Card className="position-card shadow-sm rounded mb-3">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0 trading-symbol">{trading_symbol}</h5>
        <div className="badge-container">
          <Badge bg="status" className="me-2">
            {isClosed ? "Closed" : "Open"}
          </Badge>
          <Badge className={plPercentageBg}>
            {plPercentage}%{" "}
            <i
              className={`fas ${
                plPercentage >= 0 ? "fa-arrow-up" : "fa-arrow-down"
              }`}
            ></i>
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="card-body">
        <Row>
          <Col xs={6} md={4} className="mb-3">
            <div className="info-box bg-gradient-info">
              <span className="info-label">Last Price</span>
              <h6 className="info-value">₹{last_price.toFixed(2)}</h6>
            </div>
          </Col>
          <Col xs={6} md={4} className="mb-3">
            <div className="info-box bg-gradient-warning">
              <span className="info-label">Buy Price</span>
              <h6 className="info-value">₹{buy_price.toFixed(2)}</h6>
            </div>
          </Col>
          <Col xs={6} md={4} className="mb-3">
            <div className="info-box bg-gradient-danger">
              <span className="info-label">Sell Price</span>
              <h6 className="info-value">₹{sell_price.toFixed(2)}</h6>
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={12} className="mb-3">
            <div className="info-box bg-gradient-primary">
              <span className="info-label">P&L (Last Price)</span>
              <h6 className={`info-value ${plColor}`}>
                ₹{plFromClose}{" "}
                <i
                  className={`fas ${
                    plFromClose >= 0 ? "fa-arrow-up" : "fa-arrow-down"
                  }`}
                ></i>
              </h6>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

// Wrapper component to render multiple positions
const PositionsList = () => {
  const [positions, setPositions] = useState([]);
  useEffect(() => {
    const url = "https://api.upstox.com/v2/portfolio/short-term-positions";
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + sessionData.getData("accessToken"),
    };
    fetch(url, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched positions:", data);
        if (Array.isArray(data.data)) {
          setPositions(data.data);
        } else {
          console.error("Unexpected data format:", data);
          setPositions([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching positions:", error);
        setPositions([]);
      });
  }, []);
  return (
    <Container fluid className="my-5 dashboard-container">
      <h2 className="text-center mb-4 dashboard-title">Positions Dashboard</h2>
      <Row className="justify-content-center">
        {positions.length === 0 ? (
          <Col xs={12} md={6}>
            <Alert variant="warning" className="text-center alert-warning">
              <h4>Unable to Load Positions</h4>
              <p>
                Token is expired or not initiated. Please log in again or
                contact support.
              </p>
            </Alert>
          </Col>
        ) : (
          positions.map((position, index) => (
            <Col key={index} xs={12} md={6} lg={4}>
              <Positions position={position} />
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default PositionsList;
