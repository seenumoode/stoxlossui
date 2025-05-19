// src/components/StockCard.jsx
import { Card, ListGroup, Badge } from "react-bootstrap";
import { useSelectedStocks } from "../context/SelectedStocksContext";

// Utility function to format timestamp to readable date
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const StockCard = ({ stock }) => {
  const { selectedStocks, toggleStockSelection } = useSelectedStocks();

  const isSelected = selectedStocks.some(
    (s) => s.instrumentKey === stock.instrumentKey
  );

  return (
    <Card className="stock-card shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleStockSelection(stock)}
            className="me-2"
            aria-label={`Select ${stock.name}`}
          />
          <Card.Title className="mb-0">{stock.name}</Card.Title>
        </div>
        <Card.Subtitle className="mb-2 text-muted">
          {stock.percentageChange.toFixed(2)}%
          <Badge
            bg={stock.percentageChange >= 0 ? "success" : "danger"}
            className="ms-2 stylish-badge"
          >
            {stock.percentageChange >= 0 ? "▲" : "▼"}
          </Badge>
        </Card.Subtitle>
        <ListGroup variant="flush" className="historical-list">
          {stock.data && stock.data.length > 0 ? (
            stock.data.map((entry, index) => (
              <ListGroup.Item key={index}>
                <div className="d-flex justify-content-between align-items-center">
                  <span>{formatDate(entry.date)}</span>
                  <div>
                    <Badge
                      bg={entry.percentageChange >= 0 ? "success" : "danger"}
                      className="stylish-badge me-2"
                    >
                      {entry.percentageChange >= 0 ? "+" : ""}
                      {entry.percentageChange.toFixed(2)}%
                    </Badge>
                    <span className="text-muted">
                      ₹{(entry.close || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item>
              <span className="text-muted">No historical data available</span>
            </ListGroup.Item>
          )}
          <ListGroup.Item>
            <div className="d-flex justify-content-between">
              <span>
                High:{" "}
                <span className="text-primary">₹{stock.high.toFixed(2)}</span>
              </span>
              <span>
                Low:{" "}
                <span className="text-secondary">₹{stock.low.toFixed(2)}</span>
              </span>
            </div>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default StockCard;
