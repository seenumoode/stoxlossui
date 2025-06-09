import React, { useState, useEffect } from "react";
import { Table, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const HistoricData = ({ insKey, name, close }) => {
  const [candles, setCandles] = useState([]);
  const [error, setError] = useState(null);
  const [todayPL, setTodayPL] = useState(0);

  // Calculate startDate (1 month back) and endDate (today)
  const calculateDates = () => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0]; // YYYY-MM-DD format
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 1);
    return {
      startDate: startDate.toISOString().split("T")[0], // YYYY-MM-DD format
      endDate,
    };
  };

  // Fetch candlestick data using Fetch API
  useEffect(() => {
    const { startDate, endDate } = calculateDates();
    const url = `https://api.upstox.com/v2/historical-candle/${insKey}/day/${endDate}/${startDate}`;
    const headers = {
      Accept: "application/json",
    };

    fetch(url, {
      method: "GET",
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Assuming the API response has a structure like { data: { candles: [...] } }
        setCandles(data.data.candles || []);
      })
      .catch((error) => {
        console.error("Fetch error:", error.message);
        setError(error.message);
      });
  }, []);

  // Calculate P/L percentage based on current day's close and previous day's close
  const calculatePLPercentage = (currentClose, prevClose) => {
    if (!prevClose || prevClose === 0) return 0; // No previous close or avoid division by zero
    return (((currentClose - prevClose) / prevClose) * 100).toFixed(2);
  };

  if (error) {
    return (
      <div className="container mt-4">
        <h2>Candlestick Data</h2>
        <p className="text-danger">Error: {error}</p>
      </div>
    );
  }

  const todayPLPercentage = calculatePLPercentage(
    close,
    candles.length > 0 ? candles[0][4] : 0
  );

  return (
    <div className="container mt-4">
      <h4>
        Historic Data - {name} -{" "}
        {todayPLPercentage != 0 ? (
          <Badge bg={todayPLPercentage > 0 ? "success" : "danger"}>
            {todayPLPercentage > 0 ? "+" : ""}
            {todayPLPercentage}%
          </Badge>
        ) : (
          <Badge bg="secondary">0.00%</Badge>
        )}
      </h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>P/L (%)</th>
          </tr>
        </thead>
        <tbody>
          {candles.map((candle, index) => {
            const date = new Date(candle[0]).toLocaleDateString();
            const open = candle[1];
            const high = candle[2];
            const low = candle[3];
            const close = candle[4];
            const prevClose =
              index < candles.length - 1 ? candles[index + 1][4] : null;
            const plPercentage = calculatePLPercentage(close, prevClose);
            const isProfit = plPercentage > 0;

            return (
              <tr key={index}>
                <td>{date}</td>
                <td>{open.toFixed(2)}</td>
                <td>{high.toFixed(2)}</td>
                <td>{low.toFixed(2)}</td>
                <td>{close.toFixed(2)}</td>
                <td>
                  {plPercentage != 0 ? (
                    <Badge bg={isProfit ? "success" : "danger"}>
                      {isProfit ? "+" : ""}
                      {plPercentage}%
                    </Badge>
                  ) : (
                    <Badge bg="secondary">0.00%</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default HistoricData;
