// src/context/SelectedStocksContext.jsx
import { createContext, useContext, useState } from "react";

const SelectedStocksContext = createContext();

export const SelectedStocksProvider = ({ children }) => {
  const [selectedStocks, setSelectedStocks] = useState([]);

  const toggleStockSelection = (stock) => {
    setSelectedStocks((prev) => {
      const isSelected = prev.some(
        (s) => s.instrumentKey === stock.instrumentKey
      );
      if (isSelected) {
        return prev.filter((s) => s.instrumentKey !== stock.instrumentKey);
      } else {
        return [...prev, stock];
      }
    });
  };

  const saveSelectedStocks = () => {
    console.log("Selected Stocks:", selectedStocks);
  };

  return (
    <SelectedStocksContext.Provider
      value={{ selectedStocks, toggleStockSelection, saveSelectedStocks }}
    >
      {children}
    </SelectedStocksContext.Provider>
  );
};

export const useSelectedStocks = () => useContext(SelectedStocksContext);
