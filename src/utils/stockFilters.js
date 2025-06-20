// src/utils/stockFilters.js

// Utility to calculate continuous percentage changes (positive or negative)
export const calculateContinuousChanges = (data, type) => {
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

// Utility to infer open price for candlestick patterns
export const inferOpenPrice = (candles) => {
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
};

// Filter for Bearish Engulfing pattern
export const findBearishEngulfing = (data) => {
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

// Filter for Bullish Engulfing pattern
export const findBullishEngulfing = (data) => {
  return data.filter((stock) => {
    const candles = inferOpenPrice(stock.data);
    if (candles.length < 2) return false;

    const currentCandle = candles[0];
    const previousCandle = candles[1];
    const priorCandle = candles[2] || null;

    const isPreviousBearish = previousCandle.close < previousCandle.open;
    const isCurrentBullish = currentCandle.close > currentCandle.open;
    const isEngulfing =
      currentCandle.open < previousCandle.close &&
      currentCandle.close > previousCandle.open;
    const isDowntrend = priorCandle
      ? priorCandle.close > previousCandle.close
      : true;

    return isPreviousBearish && isCurrentBullish && isEngulfing && isDowntrend;
  });
};

// Filter for Call Options
export const filterCallOptions = (stocks) => {
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

// Filter for Put Options
export const filterPutOptions = (stocks) => {
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

// Filter for Three Black Crows pattern
export const findThreeBlackCrows = (data) => {
  return data.filter((stock) => {
    const candles = inferOpenPrice(stock.data);
    if (candles.length < 3) return false;

    const thirdCandle = candles[0];
    const secondCandle = candles[1];
    const firstCandle = candles[2];
    const priorCandle = candles[3] || null;

    const isFirstBearish = firstCandle.close < firstCandle.open;
    const isSecondBearish = secondCandle.close < secondCandle.open;
    const isThirdBearish = thirdCandle.close < thirdCandle.open;

    const isDescending =
      thirdCandle.close < secondCandle.close &&
      secondCandle.close < firstCandle.close;

    const minBodySize = 0.5;
    const isFirstSignificant =
      Math.abs(firstCandle.close - firstCandle.open) >=
      minBodySize * (firstCandle.high - firstCandle.low);
    const isSecondSignificant =
      Math.abs(secondCandle.close - secondCandle.open) >=
      minBodySize * (secondCandle.high - secondCandle.low);
    const isThirdSignificant =
      Math.abs(thirdCandle.close - thirdCandle.open) >=
      minBodySize * (thirdCandle.high - thirdCandle.low);

    const isUptrend = priorCandle
      ? priorCandle.close < firstCandle.close
      : true;

    return (
      isFirstBearish &&
      isSecondBearish &&
      isThirdBearish &&
      isDescending &&
      isFirstSignificant &&
      isSecondSignificant &&
      isThirdSignificant &&
      isUptrend
    );
  });
};

// Filter for Dark Cloud Cover pattern
export const findDarkCloudCover = (data) => {
  return data.filter((stock) => {
    const candles = inferOpenPrice(stock.data);
    if (candles.length < 2) return false;

    const currentCandle = candles[0];
    const previousCandle = candles[1];
    const priorCandle = candles[2] || null;

    const isPreviousBullish = previousCandle.close > previousCandle.open;
    const isCurrentBearish = currentCandle.close < currentCandle.open;

    const isAboveClose = currentCandle.open > previousCandle.close;
    const isBelowMidpoint =
      currentCandle.close < (previousCandle.open + previousCandle.close) / 2;

    const isUptrend = priorCandle
      ? priorCandle.close < previousCandle.close
      : true;

    return (
      isPreviousBullish &&
      isCurrentBearish &&
      isAboveClose &&
      isBelowMidpoint &&
      isUptrend
    );
  });
};

// Validate stock data
export const validateStocks = (stocks) => {
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
