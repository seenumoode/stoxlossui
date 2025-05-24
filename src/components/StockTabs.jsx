import { useState } from "react";
import { Tabs, Tab, Row, Col, Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import StockCard from "./StockCard";
import StockTable from "./StockTable";
import StockViewToggle from "./StockViewToggle";
import { useSelectedStocks } from "../context/SelectedStocksContext";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const calculateContinuousChanges = (data, type) => {
  if (!data || !Array.isArray(data)) return 0;
  let count = 0;
  for (const entry of data) {
    if (type === "positive" && entry.percentageChange > 0) {
      count++;
    } else if (type === "negative" && entry.percentageChange < 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

const StockTabs = ({ gainers, losers, onDateChange }) => {
  const [view, setView] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const { selectedStocks, saveSelectedStocks } = useSelectedStocks();
  const todayDate = new Date();
  const formattedDate = todayDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .replace(/ /g, "-");

  const validateStocks = (stocks) => {
    return stocks.filter(
      (stock) =>
        stock &&
        typeof stock.name === "string" &&
        stock.instrumentKey &&
        typeof stock.percentageChange === "number" &&
        typeof stock.high === "number" &&
        typeof stock.low === "number"
    );
  };

  const filterStocks = (stocks) => {
    const validStocks = validateStocks(stocks);
    if (!searchQuery.trim()) return validStocks;
    return validStocks.filter((stock) =>
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const sortStocks = (stocks, tab) => {
    if (sortOption === "default") return [...stocks];

    if (sortOption === "selected") {
      // Separate selected and unselected stocks
      const selected = [];
      const unselected = [];
      stocks.forEach((stock) => {
        if (
          selectedStocks.some((s) => s.instrumentKey === stock.instrumentKey)
        ) {
          selected.push(stock);
        } else {
          unselected.push(stock);
        }
      });

      // Sort unselected stocks by continuous change (descending)
      const sortedUnselected = unselected.sort((a, b) => {
        const aCount =
          tab === "gainers"
            ? calculateContinuousChanges(a.data, "positive")
            : calculateContinuousChanges(a.data, "negative");
        const bCount =
          tab === "gainers"
            ? calculateContinuousChanges(b.data, "positive")
            : calculateContinuousChanges(b.data, "negative");
        return bCount - aCount;
      });

      // Combine: selected stocks first, then sorted unselected stocks
      return [...selected, ...sortedUnselected];
    }

    // Existing "Continuous Change" sorting
    return [...stocks].sort((a, b) => {
      const aCount =
        tab === "gainers"
          ? calculateContinuousChanges(a.data, "positive")
          : calculateContinuousChanges(a.data, "negative");
      const bCount =
        tab === "gainers"
          ? calculateContinuousChanges(b.data, "positive")
          : calculateContinuousChanges(b.data, "negative");
      return bCount - aCount;
    });
  };

  const filteredGainers = sortStocks(filterStocks(gainers), "gainers");
  const filteredLosers = sortStocks(filterStocks(losers), "losers");

  return (
    <div>
      <Row className="mb-3 align-items-center">
        <Col xs={12} md={4}>
          <Form className="search-input">
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search stocks by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search stocks"
              />
            </InputGroup>
          </Form>
        </Col>
        <Col xs={12} md={4}>
          <DatePicker
            defaultValue={dayjs(formattedDate, "DD-MMM-YY")}
            onChange={onDateChange}
            format={"DD-MMM-YY"}
          />
        </Col>
        <Col xs={12} md={4}>
          {view === "card" && (
            <Form.Group className="sort-group" controlId="sortSelect">
              <Form.Label className="me-2 fw-semibold">Sort By:</Form.Label>
              <Form.Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{ maxWidth: "200px", display: "inline-block" }}
                aria-label="Sort stocks"
              >
                <option value="default">Default</option>
                <option value="continuous">Continuous Change</option>
                <option value="selected">Selected</option>
              </Form.Select>
            </Form.Group>
          )}
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <StockViewToggle view={view} setView={setView} />
        <Button
          variant="success"
          onClick={saveSelectedStocks}
          disabled={selectedStocks.length === 0}
        >
          Save Selected ({selectedStocks.length})
        </Button>
      </div>

      <Tabs defaultActiveKey="gainers" id="stock-tabs" className="mb-3">
        <Tab eventKey="gainers" title="Gainers">
          {view === "card" ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {filteredGainers.length > 0 ? (
                filteredGainers.map((stock) => (
                  <Col key={stock.instrumentKey}>
                    <StockCard stock={stock} />
                  </Col>
                ))
              ) : (
                <Col>
                  <p className="text-muted text-center">
                    No gainers match your search.
                  </p>
                </Col>
              )}
            </Row>
          ) : (
            <StockTable stocks={gainers} tab="gainers" />
          )}
        </Tab>
        <Tab eventKey="losers" title="Losers">
          {view === "card" ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {filteredLosers.length > 0 ? (
                filteredLosers.map((stock) => (
                  <Col key={stock.instrumentKey}>
                    <StockCard stock={stock} />
                  </Col>
                ))
              ) : (
                <Col>
                  <p className="text-muted text-center">
                    No losers match your search.
                  </p>
                </Col>
              )}
            </Row>
          ) : (
            <StockTable stocks={losers} tab="losers" />
          )}
        </Tab>
      </Tabs>
    </div>
  );
};

export default StockTabs;
