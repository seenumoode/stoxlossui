import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SessionData from "../services/sessionData";

const sessionData = new SessionData();

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  // Fetch data from Upstox API
  useEffect(() => {
    const url = "https://api.upstox.com/v2/charges/historical-trades";
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + sessionData.getData("accessToken"),
    };
    const params = new URLSearchParams({
      segment: "FO",
      start_date: "2025-06-01",
      end_date: formattedDate,
      page_number: "1",
      page_size: "100",
    });
    fetch(`${url}?${params}`, {
      method: "GET",
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching Orders:", error);
      });
  }, []);

  // Calculate Profit/Loss (only for SELL)
  const calculateProfitLoss = (order) => {
    if (order.transaction_type === "SELL") {
      const matchingBuy = orders.find(
        (o) =>
          o.transaction_type === "BUY" &&
          o.instrument_token === order.instrument_token &&
          o.strike_price === order.strike_price &&
          o.expiry === order.expiry
      );
      if (matchingBuy) {
        const profitLoss = (order.price - matchingBuy.price) * order.quantity;
        return {
          profitLoss: profitLoss.toFixed(2),
          buyAmount: matchingBuy.amount,
        };
      }
    }
    return { profitLoss: "N/A", buyAmount: 0 };
  };

  // Calculate total profit/loss and total investment
  const { totalProfitLoss, totalInvestment } = orders.reduce(
    (acc, order) => {
      const { profitLoss, buyAmount } = calculateProfitLoss(order);
      if (profitLoss !== "N/A") {
        acc.totalProfitLoss += parseFloat(profitLoss);
        acc.totalInvestment += buyAmount;
      }
      return acc;
    },
    { totalProfitLoss: 0, totalInvestment: 0 }
  );

  const formattedTotalProfitLoss = totalProfitLoss.toFixed(2);
  const roi =
    totalInvestment > 0
      ? ((totalProfitLoss / totalInvestment) * 100).toFixed(2)
      : "N/A";

  // Prepare data for Bar Chart (Profit/Loss per Scrip from SELL)
  const scripProfitLoss = {};
  orders.forEach((order) => {
    if (order.transaction_type === "SELL") {
      const pl = calculateProfitLoss(order).profitLoss;
      if (pl !== "N/A") {
        const scrip = order.scrip_name;
        scripProfitLoss[scrip] = (scripProfitLoss[scrip] || 0) + parseFloat(pl);
      }
    }
  });

  const barChartData = {
    labels: Object.keys(scripProfitLoss),
    datasets: [
      {
        label: "Profit/Loss (₹)",
        data: Object.values(scripProfitLoss),
        backgroundColor: Object.values(scripProfitLoss).map((pl) =>
          pl >= 0 ? "rgba(39, 174, 96, 0.6)" : "rgba(231, 76, 60, 0.6)"
        ),
        borderColor: Object.values(scripProfitLoss).map((pl) =>
          pl >= 0 ? "rgba(39, 174, 96, 1)" : "rgba(231, 76, 60, 1)"
        ),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for Line Chart (Cumulative Profit/Loss over Time from SELL)
  const tradeDates = [
    ...new Set(orders.map((order) => order.trade_date)),
  ].sort();
  const cumulativeProfitLoss = [];
  let runningTotal = 0;

  tradeDates.forEach((date) => {
    const dailySellOrders = orders.filter(
      (order) => order.trade_date === date && order.transaction_type === "SELL"
    );
    const dailyPL = dailySellOrders.reduce((sum, order) => {
      const pl = calculateProfitLoss(order).profitLoss;
      return pl !== "N/A" ? sum + parseFloat(pl) : sum;
    }, 0);
    runningTotal += dailyPL;
    cumulativeProfitLoss.push(runningTotal.toFixed(2));
  });

  const lineChartData = {
    labels: tradeDates,
    datasets: [
      {
        label: "Cumulative Profit/Loss (₹)",
        data: cumulativeProfitLoss,
        fill: false,
        borderColor: "rgba(52, 152, 219, 1)",
        backgroundColor: "rgba(52, 152, 219, 0.2)",
        tension: 0.1,
      },
    ],
  };

  if (orders.length === 0) {
    return (
      <Container fluid className="my-5">
        <h2 className="text-center mb-4" style={{ color: "#007BFF" }}>
          Dashboard
        </h2>
        <Row className="justify-content-center">
          <Col xs={12} md={6}>
            <Alert variant="warning" className="text-center">
              <h4>Unable to Load Dashboard</h4>
              <p>
                Token is expired or not initiated. Please go to Initiate
                Websocket.
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="py-4"
      style={{ backgroundColor: "#f0f4f8", minHeight: "100vh" }}
    >
      <Row className="mb-4">
        <Col>
          <Card
            className="shadow-sm"
            style={{ backgroundColor: "#ffffff", borderRadius: "15px" }}
          >
            <Card.Body>
              <Card.Title
                className="text-center mb-4"
                style={{ color: "#2c3e50", fontWeight: "bold" }}
              >
                Dashboard
              </Card.Title>
              <Row className="mb-4">
                <Col md={6} className="text-center">
                  <h4 style={{ color: "#34495e" }}>Total Profit/Loss</h4>
                  <h3
                    style={{
                      color: totalProfitLoss >= 0 ? "#27ae60" : "#e74c3c",
                      fontWeight: "bold",
                    }}
                  >
                    ₹{formattedTotalProfitLoss}
                  </h3>
                </Col>
                <Col md={6} className="text-center">
                  <h4 style={{ color: "#34495e" }}>ROI</h4>
                  <h3
                    style={{
                      color:
                        roi === "N/A"
                          ? "#7f8c8d"
                          : roi >= 0
                          ? "#27ae60"
                          : "#e74c3c",
                      fontWeight: "bold",
                    }}
                  >
                    {roi === "N/A" ? roi : `${roi}%`}
                  </h3>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Card
                    className="shadow-sm"
                    style={{ backgroundColor: "#ffffff", borderRadius: "10px" }}
                  >
                    <Card.Body>
                      <Card.Title style={{ color: "#2c3e50" }}>
                        Profit/Loss by Scrip
                      </Card.Title>
                      <Bar
                        data={barChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "top" },
                            title: {
                              display: true,
                              text: "Profit/Loss Distribution",
                            },
                          },
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card
                    className="shadow-sm"
                    style={{ backgroundColor: "#ffffff", borderRadius: "10px" }}
                  >
                    <Card.Body>
                      <Card.Title style={{ color: "#2c3e50" }}>
                        Profit/Loss Over Time
                      </Card.Title>
                      <Line
                        data={lineChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "top" },
                            title: {
                              display: true,
                              text: "Cumulative Profit/Loss by Date",
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: { display: true, text: "Profit/Loss (₹)" },
                            },
                          },
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
