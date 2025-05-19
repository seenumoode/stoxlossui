// src/components/SelectedStocksPage.jsx
import { Row, Col } from "react-bootstrap";
import StockCard from "./StockCard";
import { useSelectedStocks } from "../context/SelectedStocksContext";

const SelectedStocksPage = () => {
  const { selectedStocks } = useSelectedStocks();

  return (
    <div>
      <h2 className="mb-4">Selected Stocks</h2>
      {selectedStocks.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {selectedStocks.map((stock) => (
            <Col key={stock.instrumentKey}>
              <StockCard stock={stock} />
            </Col>
          ))}
        </Row>
      ) : (
        <p className="text-muted text-center">No stocks selected.</p>
      )}
    </div>
  );
};

export default SelectedStocksPage;
