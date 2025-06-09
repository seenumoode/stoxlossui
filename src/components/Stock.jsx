import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ReactApexChart from "react-apexcharts";
import HistoricData from "./HistoricData";

function Stock() {
  let { name, key } = useParams();
  const [data, setData] = useState([]);

  const todayDate = new Date();
  const formattedDate = todayDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .replace(/ /g, "-");
  const options = {
    chart: {
      type: "candlestick",
      height: 350,
    },
    title: {
      text: name,
      align: "middle",
    },
    tooltip: {
      x: {
        format: "dd:MMM:yyyy HH:mm:ss",
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "HH:mm:ss",
        datetimeUTC: false,
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  };

  const series = [
    {
      data: data,
    },
  ];

  async function getData() {
    const intraDay =
      "https://api.upstox.com/v2/historical-candle/intraday/" +
      key +
      "/1minute";
    const todayDate = new Date().toLocaleDateString("en-CA");
    const daily =
      "https://api.upstox.com/v2/historical-candle/" +
      key +
      "/1minute/" +
      todayDate +
      "/" +
      todayDate;

    const response = await fetch(intraDay);
    const resdata = await response.json();
    const candles = resdata.data.candles;

    let resMd = candles.map((ele) => {
      //ele[0] = new Date(ele[0]).getTime();
      ele.pop();
      ele.pop();
      return ele;
    });
    //resMd.reverse();

    setData(resMd);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <ReactApexChart
        options={options}
        series={series}
        type="candlestick"
        height={350}
      />

      <HistoricData
        insKey={key}
        name={name}
        close={data.length > 0 ? data[0][4] : 0}
      />
    </>
  );
}

export default Stock;
