import React, { useEffect, useState } from "react";
import { Card, Col, Row, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import SessionData from "../services/sessionData";
const sessionData = new SessionData();

const Positions = ({ position }) => {
  const {
    trading_symbol,
    last_price,
    close_price,
    average_price,
    quantity,
    multiplier,
    buy_price,
    sell_price,
    overnight_buy_quantity,
  } = position;

  // Determine if position is closed (sell_price > 0)
  const isClosed = sell_price > 0;

  // Calculate P&L
  const plFromClose = isClosed
    ? ((sell_price - buy_price) * overnight_buy_quantity * multiplier).toFixed(
        2
      )
    : ((last_price - average_price) * quantity * multiplier).toFixed(2);
  const plColor = plFromClose >= 0 ? "text-profit" : "text-loss";

  // Calculate P&L percentage
  const plPercentage = isClosed
    ? (((sell_price - buy_price) / buy_price) * 100).toFixed(2)
    : (((last_price - average_price) / average_price) * 100).toFixed(2);
  const plPercentageColor = plPercentage >= 0 ? "text-profit" : "text-loss";
  const plPercentageBg =
    plPercentage >= 0 ? "bg-gradient-profit" : "bg-gradient-loss";

  return (
    <Card className="position-card shadow-lg mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{trading_symbol}</h5>
        <Badge bg="light" text="dark">
          {isClosed ? "Closed" : "Open"}
        </Badge>
      </Card.Header>
      <Card.Body className="bg-light">
        <Row>
          <Col xs={6} md={3} className="mb-3">
            <div className="info-box bg-gradient-info">
              <span className="info-label">Last Price</span>
              <h6 className="info-value">₹{last_price.toFixed(2)}</h6>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <div className="info-box bg-gradient-blue">
              <span className="info-label">Close Price</span>
              <h6 className="info-value">₹{close_price.toFixed(2)}</h6>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <div className="info-box bg-gradient-warning">
              <span className="info-label">Average Price</span>
              <h6 className="info-value">₹{average_price.toFixed(2)}</h6>
            </div>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <div className="info-box bg-gradient-danger">
              <span className="info-label">Quantity</span>
              <h6 className="info-value">{quantity}</h6>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={6} className="mb-3">
            <div className="info-box bg-gradient-primary">
              <span className="info-label">P&L (Last Price)</span>
              <h6 className={`info-value ${plColor}`}>
                ₹{plFromClose} {plFromClose >= 0 ? "↑" : "↓"}
              </h6>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className={`info-box ${plPercentageBg}`}>
              <span className="info-label">P&L Percentage</span>
              <h6 className={`info-value ${plPercentageColor}`}>
                {plPercentage}% {plPercentage >= 0 ? "↑" : "↓"}
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
        if (Array.isArray(data.data)) {
          setPositions(data.data);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching positions:", error);
      });
  }, []);
  return (
    <div className="container py-4">
      <Row className="justify-content-center">
        {positions.map((position, index) => (
          <Col key={index} xs={12} md={8} lg={6}>
            <Positions position={position} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PositionsList;
