import { createContext, useContext, useState, useEffect } from "react";

const SelectedStocksContext = createContext();

export const SelectedStocksProvider = ({ children, losers }) => {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [hasUserModified, setHasUserModified] = useState(false);

  useEffect(() => {
    if (!losers || !Array.isArray(losers) || hasUserModified) return;

    const preSelected = losers.filter((stock) => {
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
  }, [losers, hasUserModified]);

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

  const saveSelectedStocks = () => {
    console.log("Saving selected stocks:", selectedStocks);
    alert(`Saved ${selectedStocks.length} stocks!`);
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
