import { useEffect, useState } from "react";
import { Tabs, Tab, Row, Col, Form, InputGroup, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import StockCard from "./StockCard";
import StockTable from "./StockTable";
import StockViewToggle from "./StockViewToggle";
import { useSelectedStocks } from "../hooks/useSelectedStocks";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { getApiUrl, getWebSocketUrl, getAuthUrl } from "../utils/utils";

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

const StockTabs = () => {
  const [view, setView] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [hasUserModified, setHasUserModified] = useState(false);
  //const { selectedStocks, saveSelectedStocks } = useSelectedStocks(losers);
  const todayDate = new Date();
  useEffect(() => {
    loadData();
  }, []);

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
  const onDateChange = (date, dateString) => {
    const data = {
      date,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    fetch(getApiUrl("getPastData"), options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setGainers(data.gainers);
        setLosers(data.losers);
        const preSelected = data.losers.filter((stock) => {
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

        setSelectedStocks(preSelected);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const toggleStockSelection = (stock) => {
    setHasUserModified(true);
    setSelectedStocks((prevSelected) => {
      const isSelected = prevSelected.some(
        (s) => s.instrumentKey === stock.instrumentKey
      );
      if (isSelected) {
        return prevSelected.filter(
          (s) => s.instrumentKey !== stock.instrumentKey
        );
      } else {
        return [...prevSelected, stock];
      }
    });
  };

  const saveSelectedStocks = () => {};
  const loadData = async () => {
    try {
      const response = await fetch(getApiUrl("data"));
      const data = await response.json();
      setGainers(data.gainers);
      setLosers(data.losers);
      if (!data.losers || !Array.isArray(data.losers) || hasUserModified)
        return;

      const preSelected = data.losers.filter((stock) => {
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

      setSelectedStocks(preSelected);
    } catch (error) {
      console.error("Error fetching data:", error);
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
                    <StockCard stock={stock} losers={losers} />
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
                    <StockCard
                      stock={stock}
                      selectedStocks={selectedStocks}
                      toggleStockSelection={toggleStockSelection}
                    />
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
