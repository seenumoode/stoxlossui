import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import SessionData from "../services/sessionData";

const sessionData = new SessionData();

const { RangePicker } = DatePicker;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs("2025-06-01"),
    dayjs("2025-06-11"),
  ]);
  const [isLoading, setIsLoading] = useState(false);
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
          setFilteredOrders(data.data);
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching Orders:", error);
      });
  }, []);

  // Handle DatePicker change
  const handleDateChange = (dates) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].format("YYYY-MM-DD");
      const endDate = dates[1].format("YYYY-MM-DD");
      const filtered = orders.filter((order) => {
        return order.trade_date >= startDate && order.trade_date <= endDate;
      });
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  };

  // Disable future dates
  const disabledDate = (current) => {
    return current && current > dayjs().endOf("day");
  };

  // Calculate Profit/Loss (only for SELL)
  const calculateProfitLoss = (order) => {
    if (order.transaction_type === "SELL") {
      const matchingBuy = filteredOrders.find(
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
          tradeDate: order.trade_date,
        };
      }
    }
    return { profitLoss: "N/A", buyAmount: 0, tradeDate: null };
  };

  // Calculate open positions (unmatched BUY trades)
  const openPositions = filteredOrders.filter((order) => {
    if (order.transaction_type === "BUY") {
      const hasMatchingSell = filteredOrders.some(
        (o) =>
          o.transaction_type === "SELL" &&
          o.instrument_token === order.instrument_token &&
          o.strike_price === order.strike_price &&
          o.expiry === order.expiry
      );
      return !hasMatchingSell;
    }
    return false;
  }).length;

  // Calculate trade metrics
  const tradeMetrics = filteredOrders.reduce(
    (acc, order) => {
      // Count all trades (BUY and SELL) for trade frequency
      acc.tradeFrequency[order.trade_date] =
        (acc.tradeFrequency[order.trade_date] || 0) + 1;

      // Process SELL orders for profit/loss metrics
      if (order.transaction_type === "SELL") {
        const { profitLoss, buyAmount } = calculateProfitLoss(order);
        if (profitLoss !== "N/A") {
          acc.totalProfitLoss += parseFloat(profitLoss);
          acc.totalInvestment += buyAmount;
          acc.totalTrades += 1;
          if (parseFloat(profitLoss) > 0) {
            acc.winningTrades += 1;
          } else if (parseFloat(profitLoss) < 0) {
            acc.losingTrades += 1;
          }
        }
      }
      return acc;
    },
    {
      totalProfitLoss: 0,
      totalInvestment: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      tradeFrequency: {},
    }
  );

  const {
    totalProfitLoss,
    totalInvestment,
    totalTrades,
    winningTrades,
    losingTrades,
    tradeFrequency,
  } = tradeMetrics;
  const formattedTotalProfitLoss = totalProfitLoss.toFixed(2);
  const roi =
    totalInvestment > 0
      ? ((totalProfitLoss / totalInvestment) * 100).toFixed(2)
      : "N/A";
  const winPercentage =
    totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : "N/A";

  // Prepare data for Pie Chart (Win/Lose Ratio)
  const pieData = {
    labels: [`Wins: ${winningTrades}`, `Losses: ${losingTrades}`],
    datasets: [
      {
        data: [winningTrades, losingTrades],
        backgroundColor: ["#28A745", "#DC3545"],
        borderColor: ["#FFFFFF", "#FFFFFF"],
        borderWidth: 2,
      },
    ],
  };

  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 12, weight: "bold" }, color: "#333" },
      },
      title: {
        display: true,
        text: `Win Percentage: ${winPercentage}%`,
        color: "#2c3e50",
        font: { size: 14, weight: "600" },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const percentage =
              totalTrades > 0 ? ((value / totalTrades) * 100).toFixed(2) : 0;
            return `${label} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Prepare data for Bar Chart (Profit/Loss per Scrip from SELL)
  const scripProfitLoss = {};
  filteredOrders.forEach((order) => {
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

  // Prepare data for Line Chart (Cumulative Profit/Loss Over Time from SELL)
  const tradeDates = [
    ...new Set(filteredOrders.map((order) => order.trade_date)),
  ].sort();
  const cumulativeProfitLoss = [];
  let runningTotal = 0;

  tradeDates.forEach((date) => {
    const dailySellOrders = filteredOrders.filter(
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

  // Prepare data for Area Chart (Trade Frequency by Date)
  const tradeFrequencyData = {
    labels: tradeDates,
    datasets: [
      {
        label: "Number of Trades",
        data: tradeDates.map((date) => tradeFrequency[date] || 0),
        fill: true,
        borderColor: "rgba(142, 68, 173, 1)", // #8e44ad
        backgroundColor: "rgba(142, 68, 173, 0.2)",
        tension: 0.3,
      },
    ],
  };

  if (filteredOrders.length === 0 && orders.length > 0) {
    return (
      <Container fluid className="my-5">
        <h2 className="text-center mb-4" style={{ color: "#007BFF" }}>
          Dashboard
        </h2>
        <Row className="justify-content-center">
          <Col xs={12} md={6}>
            <Alert variant="info" className="text-center">
              <h4>No Trades in Selected Date Range</h4>
              <p>Please select a different date range to view trading data.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

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
      style={{
        background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
        minHeight: "100vh",
      }}
    >
      <Row className="mb-4">
        <Col>
          <Card
            className="shadow-lg border-0"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <Card.Header
              style={{
                background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
                border: "none",
                padding: "1.5rem",
              }}
            >
              <Card.Title
                className="text-center mb-0"
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "1.8rem",
                }}
              >
                Trading Dashboard
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="mb-4">
                <Col xs={12} md={6} lg={4} className="mb-3">
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateChange}
                    format="DD-MMM-YY"
                    disabledDate={disabledDate}
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
              <Row className="mb-4">
                <Col md={3} sm={6} xs={12} className="text-center mb-3">
                  <Card
                    className="shadow-sm border-0 hover-card"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#34495e", fontWeight: "600" }}>
                        Total Profit/Loss
                      </h5>
                      <h3
                        style={{
                          color: totalProfitLoss >= 0 ? "#27ae60" : "#e74c3c",
                          fontWeight: "700",
                          fontSize: "1.8rem",
                        }}
                      >
                        ₹{formattedTotalProfitLoss}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} xs={12} className="text-center mb-3">
                  <Card
                    className="shadow-sm border-0 hover-card"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#34495e", fontWeight: "600" }}>
                        ROI
                      </h5>
                      <h3
                        style={{
                          color:
                            roi === "N/A"
                              ? "#7f8c8d"
                              : roi >= 0
                              ? "#27ae60"
                              : "#e74c3c",
                          fontWeight: "700",
                          fontSize: "1.8rem",
                        }}
                      >
                        {roi === "N/A" ? roi : `${roi}%`}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} xs={12} className="text-center mb-3">
                  <Card
                    className="shadow-sm border-0 hover-card"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#34495e", fontWeight: "600" }}>
                        Open Positions
                      </h5>
                      <h3
                        style={{
                          color: openPositions > 0 ? "#27ae60" : "#7f8c8d",
                          fontWeight: "700",
                          fontSize: "1.8rem",
                        }}
                      >
                        {openPositions}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} sm={6} xs={12} className="text-center mb-3">
                  <Card
                    className="shadow-sm border-0 hover-card"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#34495e", fontWeight: "600" }}>
                        Win/Lose Ratio
                      </h5>
                      <div>
                        <span
                          style={{
                            color: "#28A745",
                            fontWeight: "600",
                            fontSize: "1.2rem",
                            marginRight: "10px",
                          }}
                        >
                          {winningTrades} Wins
                        </span>
                        <span
                          style={{
                            color: "#DC3545",
                            fontWeight: "600",
                            fontSize: "1.2rem",
                          }}
                        >
                          {losingTrades} Losses
                        </span>
                      </div>
                      <h6
                        style={{
                          color: "#34495e",
                          fontWeight: "500",
                          margin: "5px 0",
                        }}
                      >
                        Total: {totalTrades} Trades
                      </h6>
                      {totalTrades > 0 ? (
                        <div
                          className="p-2 shadow rounded"
                          style={{
                            backgroundColor: "#F8F9FA",
                            height: "200px",
                            marginTop: "10px",
                          }}
                        >
                          <Pie data={pieData} options={pieOptions} />
                        </div>
                      ) : (
                        <h6 style={{ color: "#7f8c8d", marginTop: "10px" }}>
                          N/A
                        </h6>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row>
                <Col md={6} className="mb-4">
                  <Card
                    className="shadow-sm border-0"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#2c3e50", fontWeight: "600" }}>
                        Profit/Loss by Scrip
                      </h5>
                      <Bar
                        data={barChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { color: "#2c3e50" },
                            },
                            title: {
                              display: true,
                              text: "Profit/Loss Distribution",
                              color: "#2c3e50",
                              font: { size: 16, weight: "600" },
                            },
                          },
                          scales: {
                            y: {
                              ticks: { color: "#2c3e50" },
                              title: {
                                display: true,
                                text: "Profit/Loss (₹)",
                                color: "#2c3e50",
                              },
                            },
                            x: { ticks: { color: "#2c3e50" } },
                          },
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card
                    className="shadow-sm border-0"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#2c3e50", fontWeight: "600" }}>
                        Profit/Loss Over Time
                      </h5>
                      <Line
                        data={lineChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { color: "#2c3e50" },
                            },
                            title: {
                              display: true,
                              text: "Cumulative Profit/Loss by Date",
                              color: "#2c3e50",
                              font: { size: 16, weight: "600" },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { color: "#2c3e50" },
                              title: {
                                display: true,
                                text: "Profit/Loss (₹)",
                                color: "#2c3e50",
                              },
                            },
                            x: { ticks: { color: "#2c3e50" } },
                          },
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card
                    className="shadow-sm border-0"
                    style={{ borderRadius: "15px" }}
                  >
                    <Card.Body>
                      <h5 style={{ color: "#2c3e50", fontWeight: "600" }}>
                        Trade Frequency by Date
                      </h5>
                      <Line
                        data={tradeFrequencyData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: { color: "#2c3e50" },
                            },
                            title: {
                              display: true,
                              text: "Trade Frequency by Date",
                              color: "#2c3e50",
                              font: { size: 16, weight: "600" },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return `${context.dataset.label}: ${
                                    context.raw
                                  } trade${context.raw !== 1 ? "s" : ""}`;
                                },
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { color: "#2c3e50" },
                              title: {
                                display: true,
                                text: "Number of Trades",
                                color: "#2c3e50",
                              },
                            },
                            x: { ticks: { color: "#2c3e50" } },
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
      <style jsx>{`
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
          transition: transform 0.3s, box-shadow 0.3s;
        }
      `}</style>
    </Container>
  );
};

export default Dashboard;
