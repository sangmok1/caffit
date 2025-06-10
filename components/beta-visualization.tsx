"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { fetchStockReturns } from "@/lib/api"
import type { Stock } from "@/components/stock-screener"

interface BetaVisualizationProps {
  stock: Stock
  loading?: boolean
}

export function BetaVisualization({ stock, loading }: BetaVisualizationProps) {
  const [timeframe, setTimeframe] = useState("1y")
  const [marketIndex, setMarketIndex] = useState("NIFTY")
  const [returns, setReturns] = useState<any[]>([])
  const [rollingBeta, setRollingBeta] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Fetch returns data
  useEffect(() => {
    const loadReturns = async () => {
      setDataLoading(true)
      try {
        const data = await fetchStockReturns(stock.symbol, marketIndex, timeframe)
        setReturns(data.returns)
        setRollingBeta(data.rollingBeta)
      } catch (err) {
        console.error("Failed to fetch returns data:", err)
      }
      setDataLoading(false)
    }

    loadReturns()
  }, [stock.symbol, marketIndex, timeframe])

  // Calculate regression line
  const regressionLine = useMemo(() => {
    if (returns.length === 0) return []

    const xValues = returns.map((r) => r.marketReturn)
    const yValues = returns.map((r) => r.stockReturn)

    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length
    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < xValues.length; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean)
      denominator += Math.pow(xValues[i] - xMean, 2)
    }

    const slope = numerator / denominator
    const intercept = yMean - slope * xMean

    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)

    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ]
  }, [returns])

  // Calculate R-squared
  const rSquared = useMemo(() => {
    if (returns.length === 0) return 0

    const xValues = returns.map((r) => r.marketReturn)
    const yValues = returns.map((r) => r.stockReturn)
    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length

    let totalSS = 0
    let residualSS = 0

    for (let i = 0; i < returns.length; i++) {
      const yPred =
        regressionLine[0].y +
        ((regressionLine[1].y - regressionLine[0].y) * (xValues[i] - regressionLine[0].x)) /
          (regressionLine[1].x - regressionLine[0].x)

      totalSS += Math.pow(yValues[i] - yMean, 2)
      residualSS += Math.pow(yValues[i] - yPred, 2)
    }

    return 1 - residualSS / totalSS
  }, [returns, regressionLine])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Beta Analysis for {stock.symbol}</CardTitle>
            <CardDescription>
              Analyzing stock's relationship with{" "}
              {marketIndex === "NIFTY" ? "NIFTY 50" : marketIndex === "SENSEX" ? "SENSEX" : "BANK NIFTY"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={marketIndex} onValueChange={setMarketIndex}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Market Index" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NIFTY">NIFTY 50</SelectItem>
                <SelectItem value="SENSEX">SENSEX</SelectItem>
                <SelectItem value="BANKNIFTY">BANK NIFTY</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="3y">3 Years</SelectItem>
                <SelectItem value="5y">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scatter">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scatter">Regression Analysis</TabsTrigger>
            <TabsTrigger value="rolling">Rolling Beta</TabsTrigger>
          </TabsList>

          <TabsContent value="scatter" className="space-y-4">
            {dataLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading data...</span>
              </div>
            ) : (
              <>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20,
                      }}
                    >
                      <CartesianGrid />
                      <XAxis
                        type="number"
                        dataKey="marketReturn"
                        name="Market Return"
                        unit="%"
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        type="number"
                        dataKey="stockReturn"
                        name="Stock Return"
                        unit="%"
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`]}
                      />
                      <Scatter name="Returns" data={returns} fill="hsl(var(--primary))" />
                      {/* Regression line */}
                      <Scatter
                        name="Regression"
                        data={regressionLine}
                        line
                        lineType="fitting"
                        shape="none"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">Beta</CardTitle>
                      <CardDescription>Slope of regression line</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div
                        className={`text-2xl font-bold ${
                          stock.beta < 0.8 ? "text-green-600" : stock.beta > 1.2 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {stock.beta.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">R-Squared</CardTitle>
                      <CardDescription>Goodness of fit</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{(rSquared * 100).toFixed(1)}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">Correlation</CardTitle>
                      <CardDescription>Return correlation</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="text-2xl font-bold">
                        {(Math.sqrt(rSquared) * (stock.beta >= 0 ? 1 : -1)).toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="rolling" className="space-y-4">
            {dataLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading data...</span>
              </div>
            ) : (
              <>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rollingBeta}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, "auto"]} />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(2), "Beta"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="beta" stroke="hsl(var(--primary))" dot={false} />
                      {/* Market beta line (1.0) */}
                      <Line
                        type="monotone"
                        data={[
                          { date: rollingBeta[0]?.date, beta: 1 },
                          { date: rollingBeta[rollingBeta.length - 1]?.date, beta: 1 },
                        ]}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Rolling Beta Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    The chart shows how {stock.symbol}'s beta changes over time using a 60-day rolling window. Values
                    above the dashed line (β = 1.0) indicate periods of higher volatility relative to the market, while
                    values below indicate lower volatility.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
