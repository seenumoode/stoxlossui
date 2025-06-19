import { useEffect, useState } from "react";
import { Tabs, Tab, Row, Col, Form, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import StockCard from "./StockCard";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { getApiUrl } from "../utils/utils";
import SessionData from "../services/sessionData";
import {
  calculateContinuousChanges,
  findBearishEngulfing,
  findBullishEngulfing,
  filterCallOptions,
  filterPutOptions,
  validateStocks,
} from "../utils/stockFilters";

const sessionData = new SessionData();

const StockTabs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const todayDate = new Date();
  const selectedDate = sessionData.getData("selectedDate");

  const formattedDate = selectedDate
    ? selectedDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
        .replace(/ /g, "-")
    : todayDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
        .replace(/ /g, "-");

  useEffect(() => {
    loadData();
  }, []);

  const onDateChange = (date, dateString) => {
    const data = { date };
    sessionData.setData({ selectedDate: new Date(date) });
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    fetch(getApiUrl("getPastData"), options)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setGainers(data.gainers);
        setLosers(data.losers);
      })
      .catch((error) => console.error("Error:", error));
  };

  const loadData = async () => {
    if (
      selectedDate &&
      todayDate.getDate() !== new Date(selectedDate).getDate()
    ) {
      console.log("Fetching past data for date:", selectedDate);
      const data = { date: selectedDate };
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
      fetch(getApiUrl("getPastData"), options)
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          setGainers(data.gainers);
          setLosers(data.losers);
        })
        .catch((error) => console.error("Error:", error));
    } else {
      console.log("Fetching today's data");
      try {
        const response = await fetch(getApiUrl("data"));
        const data = await response.json();
        setGainers(data.gainers);
        setLosers(data.losers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
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

    return [...stocks].sort((a, b) => {
      const aCount =
        tab === "gainers"
          ? calculateContinuousChanges(a.data, "positive")
          : calculateContinuousChanges(a.data, "negative");
      const bCount =
        tab === "gainers"
          ? calculateContinuousChanges(a.data, "positive")
          : calculateContinuousChanges(a.data, "negative");
      return bCount - aCount;
    });
  };

  const filteredGainers = sortStocks(filterStocks(gainers), "gainers");
  const filteredLosers = sortStocks(filterStocks(losers), "losers");
  const filteredCallOptions = sortStocks(
    filterStocks(filterCallOptions(losers)),
    "callOptions"
  );
  const filteredPutOptions = sortStocks(
    filterStocks(filterPutOptions(losers)),
    "putOptions"
  );
  const filteredBearishEngulfing = sortStocks(
    filterStocks(findBearishEngulfing(losers)),
    "bearishEngulfing"
  );
  const filteredBullishEngulfing = sortStocks(
    filterStocks(findBullishEngulfing(gainers)),
    "bullishEngulfing"
  );

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
        <Col
          xs={12}
          md={4}
          className="d-flex align-items-center gap-2 flex-wrap"
        >
          <div className="option-counter call-options">
            <span className="option-label">Call Options</span>
            <span className="option-count">
              {filterCallOptions(losers).length}
            </span>
          </div>
          <div className="option-counter put-options">
            <span className="option-label">Put Options</span>
            <span className="option-count">
              {filterPutOptions(losers).length}
            </span>
          </div>
          <div className="option-counter bearish-engulfing">
            <span className="option-label">Bearish Engulfing</span>
            <span className="option-count">
              {findBearishEngulfing(losers).length}
            </span>
          </div>
          <div className="option-counter bullish-engulfing">
            <span className="option-label">Bullish Engulfing</span>
            <span className="option-count">
              {findBullishEngulfing(gainers).length}
            </span>
          </div>
        </Col>
      </Row>

      <Row className="mb-3 align-items-center">
        <Col>
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
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Tabs defaultActiveKey="gainers" id="stock-tabs" className="mb-3">
        <Tab eventKey="gainers" title="Gainers">
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
        </Tab>
        <Tab eventKey="losers" title="Losers">
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
        </Tab>
        <Tab eventKey="callOptions" title="Call Options">
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredCallOptions.length > 0 ? (
              filteredCallOptions.map((stock) => (
                <Col key={stock.instrumentKey}>
                  <StockCard stock={stock} />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-muted text-center">
                  No stocks match Call Options criteria.
                </p>
              </Col>
            )}
          </Row>
        </Tab>
        <Tab eventKey="putOptions" title="Put Options">
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredPutOptions.length > 0 ? (
              filteredPutOptions.map((stock) => (
                <Col key={stock.instrumentKey}>
                  <StockCard stock={stock} />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-muted text-center">
                  No stocks match Put Options criteria.
                </p>
              </Col>
            )}
          </Row>
        </Tab>
        <Tab eventKey="bearishEngulfing" title="Bearish Engulfing">
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredBearishEngulfing.length > 0 ? (
              filteredBearishEngulfing.map((stock) => (
                <Col key={stock.instrumentKey}>
                  <StockCard stock={stock} />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-muted text-center">
                  No stocks match Bearish Engulfing criteria.
                </p>
              </Col>
            )}
          </Row>
        </Tab>
        <Tab eventKey="bullishEngulfing" title="Bullish Engulfing">
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredBullishEngulfing.length > 0 ? (
              filteredBullishEngulfing.map((stock) => (
                <Col key={stock.instrumentKey}>
                  <StockCard stock={stock} />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-muted text-center">
                  No stocks match Bullish Engulfing criteria.
                </p>
              </Col>
            )}
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default StockTabs;
