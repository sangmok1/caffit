"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, ZoomIn, ZoomOut, ArrowLeftRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { Stock } from "@/components/stock-screener"
import { fetchCandleData } from "@/lib/api"

interface StockChartProps {
  stock: Stock
  loading?: boolean
}

interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const technicalIndicators = [
  { value: "sma", label: "Simple Moving Average" },
  { value: "ema", label: "Exponential Moving Average" },
  { value: "rsi", label: "Relative Strength Index" },
  { value: "macd", label: "MACD" },
]

export function StockChart({ stock, loading }: StockChartProps) {
  const [timeframe, setTimeframe] = useState("1y")
  const [chartType, setChartType] = useState("candle")
  const [indicators, setIndicators] = useState<string[]>([])
  const [candleData, setCandleData] = useState<CandleData[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState(0)

  // Fetch candle data
  useEffect(() => {
    const loadCandleData = async () => {
      setDataLoading(true)
      try {
        const data = await fetchCandleData(stock.symbol, timeframe)
        setCandleData(data)
      } catch (err) {
        console.error("Failed to fetch candle data:", err)
      }
      setDataLoading(false)
    }

    loadCandleData()
  }, [stock.symbol, timeframe])

  // Calculate technical indicators
  const calculateIndicators = (data: CandleData[]) => {
    const result = [...data]

    if (indicators.includes("sma")) {
      const period = 20
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0)
        result[i].sma = sum / period
      }
    }

    if (indicators.includes("ema")) {
      const period = 20
      const multiplier = 2 / (period + 1)
      let ema = data[0].close

      for (let i = 1; i < data.length; i++) {
        ema = (data[i].close - ema) * multiplier + ema
        result[i].ema = ema
      }
    }

    if (indicators.includes("rsi")) {
      const period = 14
      let gains = 0
      let losses = 0

      for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close
        if (change >= 0) {
          gains += change
        } else {
          losses -= change
        }

        if (i >= period) {
          const rs = gains / losses
          result[i].rsi = 100 - 100 / (1 + rs)

          const oldChange = data[i - period].close - data[i - period - 1].close
          if (oldChange >= 0) {
            gains -= oldChange
          } else {
            losses += oldChange
          }
        }
      }
    }

    if (indicators.includes("macd")) {
      const ema12 = []
      const ema26 = []
      let prevEma12 = data[0].close
      let prevEma26 = data[0].close

      for (let i = 1; i < data.length; i++) {
        // Calculate 12-day EMA
        prevEma12 = (data[i].close - prevEma12) * (2 / 13) + prevEma12
        ema12.push(prevEma12)

        // Calculate 26-day EMA
        prevEma26 = (data[i].close - prevEma26) * (2 / 27) + prevEma26
        ema26.push(prevEma26)

        // Calculate MACD line
        result[i].macd = prevEma12 - prevEma26
      }
    }

    return result
  }

  const processedData = calculateIndicators(candleData)
  const visibleData = processedData.slice(
    Math.max(0, panOffset),
    Math.min(processedData.length, panOffset + Math.floor(processedData.length / zoomLevel)),
  )

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 4))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 1))
  }

  const handlePan = (direction: "left" | "right") => {
    setPanOffset((prev) => {
      const step = Math.floor(processedData.length / zoomLevel / 4)
      const newOffset =
        direction === "left"
          ? Math.max(0, prev - step)
          : Math.min(processedData.length - Math.floor(processedData.length / zoomLevel), prev + step)
      return newOffset
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Price Chart - {stock.symbol}</CardTitle>
            <CardDescription>
              {chartType === "candle" ? "Candlestick" : "Line"} chart with technical indicators
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="5d">5 Days</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="5y">5 Years</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candle">Candlestick</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => handlePan("left")} disabled={panOffset === 0}>
                <ArrowLeftRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 4}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 1}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePan("right")}
                disabled={panOffset >= processedData.length - Math.floor(processedData.length / zoomLevel)}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {technicalIndicators.map((indicator) => (
                  <Button
                    key={indicator.value}
                    variant={indicators.includes(indicator.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIndicators((prev) =>
                        prev.includes(indicator.value)
                          ? prev.filter((i) => i !== indicator.value)
                          : [...prev, indicator.value],
                      )
                    }}
                  >
                    {indicator.label}
                  </Button>
                ))}
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading price data...</span>
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visibleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <YAxis domain={["auto", "auto"]} />
                      <Tooltip
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, "Price"]}
                      />

                      {/* Price Area */}
                      <Area
                        type="monotone"
                        dataKey="close"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                      />

                      {/* Technical Indicators */}
                      {indicators.includes("sma") && (
                        <Area
                          type="monotone"
                          dataKey="sma"
                          stroke="hsl(var(--warning))"
                          fill="none"
                          strokeDasharray="5 5"
                        />
                      )}

                      {indicators.includes("ema") && (
                        <Area
                          type="monotone"
                          dataKey="ema"
                          stroke="hsl(var(--success))"
                          fill="none"
                          strokeDasharray="3 3"
                        />
                      )}

                      {indicators.includes("rsi") && (
                        <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                      )}

                      {indicators.includes("macd") && (
                        <Area type="monotone" dataKey="macd" stroke="hsl(var(--info))" fill="none" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="volume">
            {dataLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading volume data...</span>
              </div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M`, "Volume"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
