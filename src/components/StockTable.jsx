// src/components/StockTable.jsx
import { useState, useMemo } from "react";
import { Table, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
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

// Calculate continuous positive or negative changes
const calculateContinuousChanges = (data, type) => {
  if (!data || !Array.isArray(data)) return 0;
  let count = 0;
  for (const entry of data) {
    if (type === "positive" && entry.percentageChange > 0) {
      count++;
    } else if (type === "negative" && entry.percentageChange < 0) {
      count++;
    } else {
      break; // Stop at the first non-matching change
    }
  }
  return count;
};

const StockTable = ({ stocks, tab }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const { selectedStocks, toggleStockSelection } = useSelectedStocks();

  // Create a memoized sorted copy of stocks based on sortConfig
  const sortedStocks = useMemo(() => {
    const sorted = [...stocks]; // Create a copy of the stocks array

    if (!sortConfig.key) return sorted; // No sorting applied

    sorted.sort((a, b) => {
      let valueA = a[sortConfig.key];
      let valueB = b[sortConfig.key];

      if (sortConfig.key === "performance") {
        valueA =
          tab === "gainers"
            ? calculateContinuousChanges(a.data, "positive")
            : calculateContinuousChanges(a.data, "negative");
        valueB =
          tab === "gainers"
            ? calculateContinuousChanges(b.data, "positive")
            : calculateContinuousChanges(b.data, "negative");
      }

      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [stocks, sortConfig, tab]);

  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // Get the last 5 days of performance data
  const getPerformanceData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.slice(0, 5); // Take up to 5 most recent days
  };

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Select</th>
          <th onClick={() => sortData("name")}>Name {getSortIcon("name")}</th>
          <th onClick={() => sortData("percentageChange")}>
            % Change {getSortIcon("percentageChange")}
          </th>
          <th onClick={() => sortData("high")}>High {getSortIcon("high")}</th>
          <th onClick={() => sortData("low")}>Low {getSortIcon("low")}</th>
          <th onClick={() => sortData("performance")}>
            5-Day Performance {getSortIcon("performance")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedStocks.map((stock) => {
          const performanceData = getPerformanceData(stock.data);
          const isSelected = selectedStocks.some(
            (s) => s.instrumentKey === stock.instrumentKey
          );
          return (
            <tr key={stock.instrumentKey}>
              <td>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStockSelection(stock)}
                  aria-label={`Select ${stock.name}`}
                />
              </td>
              <td>{stock.name}</td>
              <td>{stock.percentageChange.toFixed(2)}%</td>
              <td>₹{stock.high.toFixed(2)}</td>
              <td>₹{stock.low.toFixed(2)}</td>
              <td className="table-performance">
                {performanceData.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {performanceData.map((entry, index) => (
                      <OverlayTrigger
                        key={index}
                        placement="top"
                        overlay={
                          <Tooltip>
                            <div>
                              <div>{formatDate(entry.date)}</div>
                              <div>Close: ₹{(entry.close || 0).toFixed(2)}</div>
                              <div>
                                Change: {entry.percentageChange >= 0 ? "+" : ""}
                                {entry.percentageChange.toFixed(2)}%
                              </div>
                            </div>
                          </Tooltip>
                        }
                      >
                        <span
                          className={
                            entry.percentageChange >= 0
                              ? "performance-bar positive"
                              : "performance-bar negative"
                          }
                        />
                      </OverlayTrigger>
                    ))}
                  </div>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default StockTable;
