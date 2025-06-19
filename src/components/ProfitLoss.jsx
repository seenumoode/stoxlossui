import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Pagination,
  Form,
  Alert,
} from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import SessionData from "../services/sessionData";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { getUpstoxUrl } from "../utils/utils";

const sessionData = new SessionData();
// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ProfitLoss = () => {
  // State for trade data, sorting, and pagination
  const [tradeData, setTradeData] = useState([]);
  const todayDate = new Date();
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [sortConfig, setSortConfig] = useState({
    key: "profit_loss",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch trade data
  useEffect(() => {
    const formattedDate = selectedDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");
    fetch(
      getUpstoxUrl(`profitLoss?toDate=${encodeURIComponent(formattedDate)}`),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setTradeData(data);
      })
      .catch((error) => console.error("Error:", error));
  }, [selectedDate]);

  // Calculate profit/loss and profit/loss percentage for each trade
  const tradesWithProfitLoss = tradeData.map((trade) => ({
    ...trade,
    profit_loss: trade.sell_amount - trade.buy_amount,
    profit_loss_percentage:
      ((trade.sell_amount - trade.buy_amount) / trade.buy_amount) * 100,
  }));

  // Calculate total invested amount and total profit/loss
  const totalInvested = tradesWithProfitLoss.reduce(
    (sum, trade) => sum + trade.buy_amount,
    0
  );
  const totalProfitLoss = tradesWithProfitLoss.reduce(
    (sum, trade) => sum + trade.profit_loss,
    0
  );

  // Sorting function
  const sortTrades = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sorted trades
  const sortedTrades = [...tradesWithProfitLoss].sort((a, b) => {
    if (sortConfig.key === "buy_date") {
      const dateA = new Date(a.buy_date.split("-").reverse().join("-"));
      const dateB = new Date(b.buy_date.split("-").reverse().join("-"));
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    return sortConfig.direction === "asc"
      ? a[sortConfig.key] - b[sortConfig.key]
      : b[sortConfig.key] - a[sortConfig.key];
  });

  // Pagination logic
  const totalItems = sortedTrades.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTrades = sortedTrades.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value));
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Pie chart data
  const pieData = {
    labels: ["Total Invested", "Total Profit/Loss"],
    datasets: [
      {
        data: [totalInvested, Math.abs(totalProfitLoss)],
        backgroundColor: [
          "#FF6F61",
          totalProfitLoss >= 0 ? "#28A745" : "#DC3545",
        ],
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
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ₹${context.raw.toFixed(2)}`,
        },
      },
    },
  };

  // Pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }
  const disabledFutureDates = (current) => {
    // Disable dates after today
    return current && current > dayjs().endOf("day");
  };

  const formattedDate = todayDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .replace(/ /g, "-");

  const onDateChange = (date, dateString) => {
    setSelectedDate(new Date(date));
  };

  // Render message if no trade data is available
  if (tradeData.length === 0) {
    return (
      <Container fluid className="my-5">
        <h2 className="text-center mb-4" style={{ color: "#007BFF" }}>
          Trade Analysis Dashboard
        </h2>
        <Row className="justify-content-center">
          <Col xs={12} md={6}>
            <Alert variant="warning" className="text-center">
              <h4>Unable to Load Trade Data</h4>
              <p>
                Token is expired or not initiated. Please log in again or
                contact support.
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="my-5">
      <h2 className="text-center mb-4" style={{ color: "#007BFF" }}>
        Trade Analysis Dashboard
      </h2>
      <Row className="justify-content-center">
        {/* Pie Chart */}
        <Col xs={12} md={6} lg={4} className="mb-4">
          <DatePicker
            disabledDate={disabledFutureDates}
            onChange={onDateChange}
            defaultValue={dayjs(formattedDate, "DD-MMM-YY")}
            format={"DD-MMM-YY"}
          />
          <div
            className="p-4 shadow rounded"
            style={{ backgroundColor: "#F8F9FA", height: "300px" }}
          >
            <h4
              className="text-center"
              style={{ color: "#343A40", fontSize: "1.2rem" }}
            >
              Profit/Loss vs Invested Amount
            </h4>
            <div style={{ height: "200px" }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
            <p
              className="text-center mt-3"
              style={{
                color: totalProfitLoss >= 0 ? "#28A745" : "#DC3545",
                fontSize: "1rem",
              }}
            >
              Total Profit/Loss: ₹{totalProfitLoss.toFixed(2)}
            </p>
          </div>
        </Col>
      </Row>
      <Row>
        {/* Table */}
        <Col xs={12}>
          <div
            className="p-4 shadow rounded"
            style={{ backgroundColor: "#F8F9FA" }}
          >
            <h4 className="text-center" style={{ color: "#343A40" }}>
              Trade Details
            </h4>
            <div className="d-flex justify-content-end mb-3">
              <Form.Group controlId="pageSizeSelect" style={{ width: "150px" }}>
                <Form.Label>Rows per page:</Form.Label>
                <Form.Select value={pageSize} onChange={handlePageSizeChange}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </Form.Select>
              </Form.Group>
            </div>
            <Table striped bordered hover responsive>
              <thead style={{ backgroundColor: "#007BFF", color: "#FFFFFF" }}>
                <tr>
                  <th>Scrip Name</th>
                  <th>Quantity</th>
                  <th>Buy Date</th>
                  <th>Buy Amount</th>
                  <th>Sell Amount</th>
                  <th>
                    Profit/Loss{" "}
                    <Button
                      variant="link"
                      onClick={() => sortTrades("profit_loss")}
                    >
                      {sortConfig.key === "profit_loss" &&
                      sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"}
                    </Button>
                  </th>
                  <th>
                    Profit/Loss %{" "}
                    <Button
                      variant="link"
                      onClick={() => sortTrades("profit_loss_percentage")}
                    >
                      {sortConfig.key === "profit_loss_percentage" &&
                      sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"}
                    </Button>
                  </th>
                  <th>
                    Buy Date{" "}
                    <Button
                      variant="link"
                      onClick={() => sortTrades("buy_date")}
                    >
                      {sortConfig.key === "buy_date" &&
                      sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"}
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade, index) => (
                  <tr key={index}>
                    <td>{trade.scrip_name}</td>
                    <td>{trade.quantity}</td>
                    <td>{trade.buy_date}</td>
                    <td>₹{trade.buy_amount.toFixed(2)}</td>
                    <td>₹{trade.sell_amount.toFixed(2)}</td>
                    <td
                      style={{
                        color: trade.profit_loss >= 0 ? "#28A745" : "#DC3545",
                      }}
                    >
                      ₹{trade.profit_loss.toFixed(2)}
                    </td>
                    <td
                      style={{
                        color:
                          trade.profit_loss_percentage >= 0
                            ? "#28A745"
                            : "#DC3545",
                      }}
                    >
                      {trade.profit_loss_percentage.toFixed(2)}%
                    </td>
                    <td>{trade.buy_date}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-center mt-3">
              <Pagination>{paginationItems}</Pagination>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfitLoss;
