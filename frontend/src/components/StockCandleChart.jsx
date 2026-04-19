import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

function toChartTime(value) {
  if (!value) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor(date.getTime() / 1000);
}

function formatAxisLabel(time, timeframe = "1D") {
  if (typeof time === "string") {
    const date = new Date(`${time}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
      }).format(date);
    }
    return time;
  }

  if (typeof time === "number") {
    const date = new Date(time * 1000);
    if (!Number.isNaN(date.getTime())) {
      if (timeframe === "1D") {
        return new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
      }

      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
      }).format(date);
    }
  }

  return String(time || "");
}

function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return Math.round(num).toLocaleString("id-ID");
}

export default function StockCandleChart({ data = [], timeframe = "1D" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isIntraday = timeframe === "1D";

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.12)" },
        horzLines: { color: "rgba(148,163,184,0.12)" },
      },
      timeScale: {
        borderColor: "rgba(148,163,184,0.2)",
        timeVisible: isIntraday,
        secondsVisible: false,
        tickMarkFormatter: (time) => formatAxisLabel(time, timeframe),
      },
      localization: {
        locale: "id-ID",
        timeFormatter: (time) => formatAxisLabel(time, timeframe),
        priceFormatter: (price) => formatPrice(price),
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,0.2)",
      },
      crosshair: {
        mode: 1,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: 0,
        minMove: 1,
      },
    });

    const chartData = (Array.isArray(data) ? data : [])
      .map((item) => {
        const time = toChartTime(item?.t);

        return {
          time,
          open: Number(item?.open),
          high: Number(item?.high),
          low: Number(item?.low),
          close: Number(item?.close),
        };
      })
      .filter(
        (item) =>
          item.time !== null &&
          Number.isFinite(item.open) &&
          Number.isFinite(item.high) &&
          Number.isFinite(item.low) &&
          Number.isFinite(item.close)
      );

    if (chartData.length > 0) {
      series.setData(chartData);
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
    };
  }, [data, timeframe]);

  return <div ref={containerRef} className="h-full w-full" />;
}