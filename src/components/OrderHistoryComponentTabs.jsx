import React, { useState, useEffect } from "react";
import {
  Container,
  Tabs,
  Tab,
  Table,
  Card,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
  Collapse,
  Form,
  Button,
  Pagination,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/OrderHistoryTabs.css";
import { getUpstoxUrl } from "../utils/utils";

const OrderHistoryTabs = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [profitPositions, setProfitPositions] = useState([]);
  const [lossPositions, setLossPositions] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalLoss, setTotalLoss] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [pagination, setPagination] = useState({
    open: { page: 1, pageSize: 10 },
    profit: { page: 1, pageSize: 10 },
    loss: { page: 1, pageSize: 10 },
  });
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  useEffect(() => {
    fetch(
      getUpstoxUrl(
        `historicalTrades?endDate=${encodeURIComponent(formattedDate)}`
      ),
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
        setOrderHistory(data);
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    processOrders();
  }, [orderHistory]);

  const processOrders = () => {
    const buys = orderHistory.filter(
      (order) => order.transaction_type === "BUY"
    );
    const sells = orderHistory.filter(
      (order) => order.transaction_type === "SELL"
    );
    const open = [];
    const profits = [];
    const losses = [];
    let profitSum = 0;
    let lossSum = 0;

    buys.forEach((buy) => {
      const matchingSell = sells.find(
        (sell) =>
          sell.instrument_token === buy.instrument_token &&
          sell.strike_price === buy.strike_price &&
          sell.option_type === buy.option_type &&
          sell.quantity === buy.quantity
      );

      if (!matchingSell) {
        open.push(buy);
      } else {
        const pl = matchingSell.amount - buy.amount;
        const plPercentage = buy.amount === 0 ? 0 : (pl / buy.amount) * 100;
        const position = {
          ...buy,
          sellPrice: matchingSell.price,
          sellAmount: matchingSell.amount,
          sellDate: matchingSell.trade_date,
          pl,
          plPercentage,
        };

        if (pl > 0) {
          profits.push(position);
          profitSum += pl;
        } else {
          losses.push(position);
          lossSum += Math.abs(pl);
        }
      }
    });

    setOpenPositions(open);
    setProfitPositions(profits);
    setLossPositions(losses);
    setTotalProfit(profitSum);
    setTotalLoss(lossSum);
  };

  const handleRowClick = (order) => {
    setSelectedOrder(
      selectedOrder && selectedOrder.trade_id === order.trade_id ? null : order
    );
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorter = (a, b) => {
      if (key === "option_type") {
        return direction === "asc"
          ? a.option_type.localeCompare(b.option_type)
          : b.option_type.localeCompare(a.option_type);
      } else if (key === "pl") {
        return direction === "asc" ? a.pl - b.pl : b.pl - a.pl;
      } else if (key === "plPercentage") {
        return direction === "asc"
          ? a.plPercentage - b.plPercentage
          : b.plPercentage - a.plPercentage;
      } else if (key === "trade_date") {
        return direction === "asc"
          ? new Date(a.trade_date) - new Date(b.trade_date)
          : new Date(b.trade_date) - new Date(a.trade_date);
      } else if (key === "sellDate") {
        return direction === "asc"
          ? new Date(a.sellDate) - new Date(b.sellDate)
          : new Date(b.sellDate) - new Date(a.sellDate);
      }
      return 0;
    };

    setOpenPositions([...openPositions].sort(sorter));
    setProfitPositions([...profitPositions].sort(sorter));
    setLossPositions([...lossPositions].sort(sorter));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const handlePageChange = (tab, page) => {
    setPagination((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], page },
    }));
  };

  const handlePageSizeChange = (tab, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      [tab]: { page: 1, pageSize: parseInt(pageSize) },
    }));
  };

  const getPaginatedData = (data, tab) => {
    const { page, pageSize } = pagination[tab];
    const startIndex = (page - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  };

  const renderPagination = (data, tab) => {
    const { page, pageSize } = pagination[tab];
    const totalPages = Math.ceil(data.length / pageSize);
    const pageSizeOptions = [10, 20, 30, 40];

    return (
      <div className="pagination-controls d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center">
          <span className="me-2">Show:</span>
          <Form.Select
            size="sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(tab, e.target.value)}
            style={{ width: "auto" }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Form.Select>
          <span className="ms-2">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, data.length)} of {data.length} entries
          </span>
        </div>
        <Pagination className="mb-0">
          <Pagination.First
            onClick={() => handlePageChange(tab, 1)}
            disabled={page === 1}
          />
          <Pagination.Prev
            onClick={() => handlePageChange(tab, page - 1)}
            disabled={page === 1}
          />
          {[...Array(totalPages).keys()].map((num) => (
            <Pagination.Item
              key={num + 1}
              active={num + 1 === page}
              onClick={() => handlePageChange(tab, num + 1)}
            >
              {num + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={() => handlePageChange(tab, page + 1)}
            disabled={page === totalPages}
          />
          <Pagination.Last
            onClick={() => handlePageChange(tab, totalPages)}
            disabled={page === totalPages}
          />
        </Pagination>
      </div>
    );
  };

  const renderTooltip = (props) => (
    <Tooltip {...props}>{props.children}</Tooltip>
  );

  const renderTable = (data, isPL = false, tabKey) => {
    const paginatedData = getPaginatedData(data, tabKey);

    return (
      <>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Symbol</th>
              <th
                onClick={() => handleSort("option_type")}
                style={{ cursor: "pointer" }}
              >
                Option Type {getSortIcon("option_type")}
              </th>
              <th>Strike Price</th>
              <th>Quantity</th>
              <th>Buy Price</th>
              <th>Buy Amount</th>
              <th
                onClick={() => handleSort("trade_date")}
                style={{ cursor: "pointer" }}
              >
                Buy Date {getSortIcon("trade_date")}
              </th>
              {isPL && (
                <>
                  <th>Sell Price</th>
                  <th>Sell Amount</th>
                  <th
                    onClick={() => handleSort("sellDate")}
                    style={{ cursor: "pointer" }}
                  >
                    Sell Date {getSortIcon("sellDate")}
                  </th>
                  <th
                    onClick={() => handleSort("pl")}
                    style={{ cursor: "pointer" }}
                  >
                    P/L {getSortIcon("pl")}
                  </th>
                  <th
                    onClick={() => handleSort("plPercentage")}
                    style={{ cursor: "pointer" }}
                  >
                    P/L % {getSortIcon("plPercentage")}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                onClick={() => isPL && handleRowClick(item)}
                style={{ cursor: isPL ? "pointer" : "default" }}
              >
                <td>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip({ children: `ISIN: ${item.isin}` })}
                  >
                    <span>{item.symbol}</span>
                  </OverlayTrigger>
                </td>
                <td>{item.option_type}</td>
                <td>{item.strike_price}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{item.amount}</td>
                <td>{item.trade_date}</td>
                {isPL && (
                  <>
                    <td>{item.sellPrice}</td>
                    <td>{item.sellAmount}</td>
                    <td>{item.sellDate}</td>
                    <td style={{ color: item.pl > 0 ? "#28a745" : "#dc3545" }}>
                      ₹{item.pl.toFixed(2)}
                    </td>
                    <td style={{ color: item.pl > 0 ? "#28a745" : "#dc3545" }}>
                      {item.plPercentage.toFixed(2)}%
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {data.length > 0 && renderPagination(data, tabKey)}
      </>
    );
  };

  const renderSelectedOrderCard = () => (
    <Collapse in={!!selectedOrder}>
      <div>
        <Card className="selected-order-card mb-4">
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center">
              <span>Order Details: {selectedOrder?.symbol}</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </Card.Title>
            <Row>
              <Col md={4}>
                <p>
                  <strong>Option Type:</strong> {selectedOrder?.option_type}
                </p>
                <p>
                  <strong>Strike Price:</strong> {selectedOrder?.strike_price}
                </p>
                <p>
                  <strong>Quantity:</strong> {selectedOrder?.quantity}
                </p>
              </Col>
              <Col md={4}>
                <p>
                  <strong>Buy Price:</strong> ₹{selectedOrder?.price}
                </p>
                <p>
                  <strong>Buy Amount:</strong> ₹{selectedOrder?.amount}
                </p>
                <p>
                  <strong>Trade Date:</strong> {selectedOrder?.trade_date}
                </p>
              </Col>
              <Col md={4}>
                <p>
                  <strong>Sell Price:</strong> ₹{selectedOrder?.sellPrice}
                </p>
                <p>
                  <strong>P/L:</strong>{" "}
                  <span
                    style={{
                      color: selectedOrder?.pl > 0 ? "#28a745" : "#dc3545",
                    }}
                  >
                    ₹{selectedOrder?.pl?.toFixed(2)}
                  </span>
                </p>
                <p>
                  <strong>P/L %:</strong>{" "}
                  <span
                    style={{
                      color: selectedOrder?.pl > 0 ? "#28a745" : "#dc3545",
                    }}
                  >
                    {selectedOrder?.plPercentage?.toFixed(2)}%
                  </span>
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </Collapse>
  );

  return (
    <Container fluid className="order-history-container">
      <h1 className="text-center my-4">Order History Dashboard</h1>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="summary-card">
            <Card.Body>
              <Card.Title>Open Positions</Card.Title>
              <Card.Text>{openPositions.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="summary-card">
            <Card.Body>
              <Card.Title>Total Profit</Card.Title>
              <Card.Text style={{ color: "#28a745" }}>
                ₹{totalProfit.toFixed(2)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="summary-card">
            <Card.Body>
              <Card.Title>Total Loss</Card.Title>
              <Card.Text style={{ color: "#dc3545" }}>
                ₹{totalLoss.toFixed(2)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Tabs
        defaultActiveKey="open"
        id="order-tabs"
        className="mb-3 custom-tabs"
      >
        <Tab eventKey="open" title="Open Positions">
          {openPositions.length > 0 ? (
            renderTable(openPositions, false, "open")
          ) : (
            <p className="text-center">No open positions found.</p>
          )}
        </Tab>
        <Tab eventKey="profit" title="Profit">
          {renderSelectedOrderCard()}
          {profitPositions.length > 0 ? (
            renderTable(profitPositions, true, "profit")
          ) : (
            <p className="text-center">No profitable trades found.</p>
          )}
        </Tab>
        <Tab eventKey="loss" title="Loss">
          {renderSelectedOrderCard()}
          {lossPositions.length > 0 ? (
            renderTable(lossPositions, true, "loss")
          ) : (
            <p className="text-center">No loss-making trades found.</p>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default OrderHistoryTabs;
