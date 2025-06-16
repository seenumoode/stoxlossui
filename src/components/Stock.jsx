import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ReactApexChart from "react-apexcharts";
import HistoricData from "./HistoricData";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import SessionData from "../services/sessionData";

const sessionData = new SessionData();

function Stock() {
  let { name, key } = useParams();
  const [data, setData] = useState([]);
  const selectedDate = sessionData.getData("selectedDate");

  const todayDate = new Date();
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
    console.log("Selexted Date: ", selectedDate);
    console.log("Today Date: ", todayDate);
    const intraDay =
      "https://api.upstox.com/v2/historical-candle/intraday/" +
      key +
      "/1minute";
    const datePayload = selectedDate.toLocaleDateString("en-CA");
    const daily =
      "https://api.upstox.com/v2/historical-candle/" +
      key +
      "/1minute/" +
      datePayload +
      "/" +
      datePayload;
    if (todayDate.getDate() !== new Date(selectedDate).getDate()) {
      const response = await fetch(daily);
      const resdata = await response.json();
      const candles = resdata.data.candles;

      let resMd = candles.map((ele) => {
        //ele[0] = new Date(ele[0]).getTime();
        ele.pop();
        ele.pop();
        return ele;
      });
      setData(resMd);
    } else {
      const response = await fetch(intraDay);
      const resdata = await response.json();
      const candles = resdata.data.candles;

      let resMd = candles.map((ele) => {
        //ele[0] = new Date(ele[0]).getTime();
        ele.pop();
        ele.pop();
        return ele;
      });
      setData(resMd);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const onDateChange = async (date, dateString) => {
    const dateSelected = new Date(date);
    console.log(dateSelected);
    const datePayload = dateSelected.toLocaleDateString("en-CA");
    const daily =
      "https://api.upstox.com/v2/historical-candle/" +
      key +
      "/1minute/" +
      datePayload +
      "/" +
      datePayload;
    const headers = {
      Accept: "application/json",
    };

    const response = await fetch(daily);
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
  };

  return (
    <>
      <DatePicker
        defaultValue={dayjs(formattedDate, "DD-MMM-YY")}
        onChange={onDateChange}
        format={"DD-MMM-YY"}
      />

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
