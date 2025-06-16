import { useEffect, useState } from "react";
import { Tabs, Tab, Row, Col, Form, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import StockCard from "./StockCard";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { getApiUrl } from "../utils/utils";
import SessionData from "../services/sessionData";
// Adjust path if needed

const sessionData = new SessionData();

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

// Filter function for Bearish Engulfing Pattern
const findBearishEngulfing = (data) => {
  return data.filter((stock) => {
    const candles = inferOpenPrice(stock.data);
    if (candles.length < 2) return false;

    const currentCandle = candles[0];
    const previousCandle = candles[1];
    const twoCandlesAgo = candles[2] || null;

    const isPreviousBullish = previousCandle.close > previousCandle.open;
    const isCurrentBearish = currentCandle.close < currentCandle.open;
    const isEngulfing =
      currentCandle.open > previousCandle.close &&
      currentCandle.close < previousCandle.open;
    const isUptrend = twoCandlesAgo
      ? twoCandlesAgo.close < previousCandle.close
      : true;

    return isPreviousBullish && isCurrentBearish && isEngulfing && isUptrend;
  });
};

// utils/inferOpenPrice.js or in StockTabs.js before the component
function inferOpenPrice(candles) {
  return candles.map((candle, index, arr) => {
    if (candle.open !== 0) {
      return { ...candle };
    }

    let inferredOpen;

    if (index === arr.length - 1) {
      const nextCandle = arr[index - 1];
      if (nextCandle) {
        const prevClose =
          nextCandle.close / (1 + nextCandle.percentageChange / 100);
        inferredOpen = Math.min(candle.high, Math.max(candle.low, prevClose));
      } else {
        inferredOpen = candle.close;
      }
    } else {
      const prevClose = candle.close / (1 + candle.percentageChange / 100);
      if (candle.percentageChange > 0) {
        inferredOpen = Math.min(
          candle.close,
          Math.max(candle.low, prevClose * 0.995)
        );
      } else {
        inferredOpen = Math.min(
          candle.high,
          Math.max(candle.close, prevClose * 1.005)
        );
      }
    }

    return { ...candle, open: inferredOpen };
  });
}

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

  const filterCallOptions = (stocks) => {
    return stocks.filter((stock) => {
      if (
        stock.data &&
        Array.isArray(stock.data) &&
        stock.data.length >= 3 &&
        typeof stock.high === "number" &&
        typeof stock.data[2].close === "number"
      ) {
        const highGreaterThanClose = stock.high > stock.data[2].close;
        const allNegativePercentageChange =
          typeof stock.data[0].percentageChange === "number" &&
          typeof stock.data[1].percentageChange === "number" &&
          typeof stock.data[2].percentageChange === "number" &&
          stock.data[0].percentageChange < 0 &&
          stock.data[1].percentageChange < 0 &&
          stock.data[2].percentageChange < 0;
        return highGreaterThanClose && allNegativePercentageChange;
      }
      return false;
    });
  };

  const filterPutOptions = (stocks) => {
    return stocks.filter((obj) => {
      const dataArray = obj.data;
      if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 3)
        return false;

      const first = dataArray[0].percentageChange;
      const second = dataArray[1].percentageChange;
      const third = dataArray[2].percentageChange;

      return (
        typeof first === "number" &&
        typeof second === "number" &&
        typeof third === "number" &&
        first < 0 &&
        second < 0 &&
        third > 0 &&
        first < second &&
        Math.abs(third) > Math.abs(second)
      );
    });
  };

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
          ? calculateContinuousChanges(b.data, "positive")
          : calculateContinuousChanges(b.data, "negative");
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
  const filteredEngulfing = sortStocks(
    filterStocks(findBearishEngulfing(losers)),
    "engulfing"
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
          <div className="option-counter engulfing">
            <span className="option-label">Engulfing</span>
            <span className="option-count">
              {findBearishEngulfing(losers).length}
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
        <Tab eventKey="engulfing" title="Engulfing">
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredEngulfing.length > 0 ? (
              filteredEngulfing.map((stock) => (
                <Col key={stock.instrumentKey}>
                  <StockCard stock={stock} />
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-muted text-center">
                  No stocks match Engulfing criteria.
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
