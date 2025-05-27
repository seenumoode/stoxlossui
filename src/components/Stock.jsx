import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ReactApexChart from "react-apexcharts";

function Stock() {
  let { name, key } = useParams();
  const [data, setData] = useState([
    ["Day", "", "", "", ""],
    ["Mon", 20, 28, 38, 45],
    ["Tue", 31, 38, 55, 66],
    ["Wed", 50, 55, 77, 80],
    ["Thu", 77, 77, 66, 50],
    ["Fri", 68, 66, 22, 15],
  ]);

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
    console.log(JSON.stringify(resMd));
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
    </>
  );
}

export default Stock;
