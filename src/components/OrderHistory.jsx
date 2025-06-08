import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Badge,
  Button,
  Pagination,
} from "react-bootstrap";
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

const OrderHistory = () => {
  // Sample data
  const [orders, setOrders] = useState([]); // Initialize with empty array

  useEffect(() => {
    const url = "https://api.upstox.com/v2/charges/historical-trades";
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + sessionData.getData("accessToken"),
    };
    const params = new URLSearchParams({
      segment: "FO",
      start_date: "2025-06-01",
      end_date: "2025-06-08",
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

  // State for filters, sorting, pagination, and unmatched BUY filter
  const [transactionFilter, setTransactionFilter] = useState("ALL");
  const [scripFilter, setScripFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc");
  const [cardsPerPage, setCardsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUnmatchedBuy, setShowUnmatchedBuy] = useState(false);

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
        return profitLoss.toFixed(2);
      }
    }
    return "N/A";
  };

  // Find unmatched BUY orders
  const unmatchedBuyOrders = orders.filter((order) => {
    if (order.transaction_type !== "BUY") return false;
    return !orders.some(
      (o) =>
        o.transaction_type === "SELL" &&
        o.instrument_token === order.instrument_token &&
        o.strike_price === order.strike_price &&
        o.expiry === order.expiry
    );
  });

  // Filter orders for trade cards (includes scrip filter and unmatched BUY)
  const filteredOrders = orders
    .filter((order) => {
      if (showUnmatchedBuy) return unmatchedBuyOrders.includes(order);
      return (
        (transactionFilter === "ALL" ||
          order.transaction_type === transactionFilter) &&
        (scripFilter === "ALL" || order.scrip_name === scripFilter)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.trade_date);
      const dateB = new Date(b.trade_date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Filter orders for charts (only transaction type filter)
  const chartFilteredOrders = orders
    .filter(
      (order) =>
        transactionFilter === "ALL" ||
        order.transaction_type === transactionFilter
    )
    .sort((a, b) => {
      const dateA = new Date(a.trade_date);
      const dateB = new Date(b.trade_date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Calculate total profit/loss (based on chart-filtered orders)
  const totalProfitLoss = chartFilteredOrders
    .reduce((total, order) => {
      const pl = calculateProfitLoss(order);
      return pl !== "N/A" ? total + parseFloat(pl) : total;
    }, 0)
    .toFixed(2);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / cardsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  // Prepare data for Bar Chart (Profit/Loss per Scrip from SELL)
  const scripProfitLoss = {};
  chartFilteredOrders.forEach((order) => {
    if (order.transaction_type === "SELL") {
      const pl = calculateProfitLoss(order);
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
    const dailySellOrders = chartFilteredOrders.filter(
      (order) => order.trade_date === date && order.transaction_type === "SELL"
    );
    const dailyPL = dailySellOrders.reduce((sum, order) => {
      const pl = calculateProfitLoss(order);
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

  // Unique scrip names for filter dropdown
  const scripNames = [
    "ALL",
    ...new Set(orders.map((order) => order.scrip_name)),
  ];

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
                Order History Dashboard
              </Card.Title>
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group controlId="transactionFilter">
                    <Form.Label style={{ color: "#34495e" }}>
                      Filter by Transaction Type
                    </Form.Label>
                    <Form.Select
                      value={transactionFilter}
                      onChange={(e) => {
                        setTransactionFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page
                      }}
                      style={{ backgroundColor: "#ecf0f1", color: "#2c3e50" }}
                    >
                      <option value="ALL">All</option>
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="sortOrder">
                    <Form.Label style={{ color: "#34495e" }}>
                      Sort by Trade Date
                    </Form.Label>
                    <Form.Select
                      value={sortOrder}
                      onChange={(e) => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1); // Reset to first page
                      }}
                      style={{ backgroundColor: "#ecf0f1", color: "#2c3e50" }}
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="text-center">
                  <h4 style={{ color: "#34495e" }}>Total Profit/Loss</h4>
                  <h3
                    style={{
                      color: totalProfitLoss >= 0 ? "#27ae60" : "#e74c3c",
                      fontWeight: "bold",
                    }}
                  >
                    ₹{totalProfitLoss}
                  </h3>
                </Col>
              </Row>

              {/* Charts */}
              <Row className="mb-4">
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

              {/* Scrip Filter and Unmatched BUY Button */}
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group controlId="scripFilter">
                    <Form.Label style={{ color: "#34495e" }}>
                      Filter by Scrip Name
                    </Form.Label>
                    <Form.Select
                      value={scripFilter}
                      onChange={(e) => {
                        setScripFilter(e.target.value);
                        setShowUnmatchedBuy(false); // Reset unmatched BUY filter
                        setCurrentPage(1); // Reset to first page
                      }}
                      style={{ backgroundColor: "#ecf0f1", color: "#2c3e50" }}
                    >
                      {scripNames.map((scrip) => (
                        <option key={scrip} value={scrip}>
                          {scrip}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant={showUnmatchedBuy ? "danger" : "primary"}
                    onClick={() => {
                      setShowUnmatchedBuy(!showUnmatchedBuy);
                      setScripFilter("ALL"); // Reset scrip filter
                      setCurrentPage(1); // Reset to first page
                    }}
                    style={{
                      backgroundColor: showUnmatchedBuy ? "#e74c3c" : "#3498db",
                      borderColor: showUnmatchedBuy ? "#e74c3c" : "#3498db",
                    }}
                  >
                    {showUnmatchedBuy
                      ? "Show All Trades"
                      : "Show Unmatched BUY Trades"}
                  </Button>
                </Col>
              </Row>

              {/* Pagination Controls */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group controlId="cardsPerPage">
                    <Form.Label style={{ color: "#34495e" }}>
                      Cards Per Page
                    </Form.Label>
                    <Form.Select
                      value={cardsPerPage}
                      onChange={(e) => {
                        setCardsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page
                      }}
                      style={{
                        backgroundColor: "#ecf0f1",
                        color: "#2c3e50",
                        width: "150px",
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="text-end">
                  <Pagination>
                    <Pagination.Prev
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    />
                    {[...Array(totalPages)].map((_, i) => (
                      <Pagination.Item
                        key={i + 1}
                        active={i + 1 === currentPage}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </Col>
              </Row>

              {/* Trade Cards */}
              <h4 style={{ color: "#34495e", marginBottom: "20px" }}>
                Trade Details
              </h4>
              <Row>
                {paginatedOrders.map((order) => {
                  const pl = calculateProfitLoss(order);
                  return (
                    <Col
                      md={4}
                      sm={6}
                      xs={12}
                      key={order.trade_id}
                      className="mb-4"
                    >
                      <Card
                        className="shadow-sm"
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          borderLeft: `5px solid ${
                            order.transaction_type === "BUY"
                              ? "#27ae60"
                              : "#e74c3c"
                          }`,
                        }}
                      >
                        <Card.Body>
                          <Card.Title style={{ color: "#2c3e50" }}>
                            {order.scrip_name}
                          </Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {order.symbol}
                          </Card.Subtitle>
                          <Card.Text>
                            <strong>Trade ID:</strong> {order.trade_id}
                            <br />
                            <strong>Date:</strong> {order.trade_date}
                            <br />
                            <strong>Type:</strong>{" "}
                            <Badge
                              bg={
                                order.transaction_type === "BUY"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {order.transaction_type}
                            </Badge>
                            <br />
                            <strong>Option:</strong> {order.option_type}
                            <br />
                            <strong>Strike Price:</strong> ₹{order.strike_price}
                            <br />
                            <strong>Expiry:</strong> {order.expiry}
                            <br />
                            <strong>Quantity:</strong> {order.quantity}
                            <br />
                            <strong>Price:</strong> ₹{order.price}
                            <br />
                            <strong>Amount:</strong> ₹{order.amount}
                            <br />
                            <strong>Profit/Loss:</strong>{" "}
                            <span
                              style={{
                                color:
                                  pl === "N/A"
                                    ? "#7f8c8d"
                                    : pl >= 0
                                    ? "#27ae60"
                                    : "#e74c3c",
                                fontWeight: "bold",
                              }}
                            >
                              {pl === "N/A" ? pl : `₹${pl}`}
                            </span>
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderHistory;
