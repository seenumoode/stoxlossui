import { Card, ListGroup, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const cardSelect = async () => {
    navigate("/stock/" + stock.instrumentKey + "/" + stock.name);
  };

  return (
    <Card className="stock-card shadow-sm" onClick={cardSelect}>
      <Card.Body>
        <Card.Title className="mb-2">{stock.name}</Card.Title>
        <Card.Subtitle className="mb-3 text-muted d-flex align-items-center">
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
              <ListGroup.Item key={index} className="py-2">
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
            <ListGroup.Item className="py-2">
              <span className="text-muted">No historical data available</span>
            </ListGroup.Item>
          )}
          <ListGroup.Item className="py-2">
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
