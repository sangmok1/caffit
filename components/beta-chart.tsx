"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BetaCalculator } from "@/components/beta-calculator"
import type { Stock } from "@/components/stock-screener"

interface BetaChartProps {
  stocks: Stock[]
  loading: boolean
}

export function BetaChart({ stocks, loading }: BetaChartProps) {
  const [timeframe, setTimeframe] = useState("1y")
  const [marketIndex, setMarketIndex] = useState("NIFTY")

  // Sort stocks by beta for visualization
  const sortedStocks = [...stocks].sort((a, b) => b.beta - a.beta)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Beta Analysis</h2>
          <p className="text-muted-foreground">Compare stock volatility relative to the Indian market</p>
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

      <Tabs defaultValue="visualization">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualization">Beta Visualization</TabsTrigger>
          <TabsTrigger value="calculator">Beta Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Beta Comparison</CardTitle>
              <CardDescription>
                Beta values relative to{" "}
                {marketIndex === "NIFTY" ? "NIFTY 50" : marketIndex === "SENSEX" ? "SENSEX" : "BANK NIFTY"} over{" "}
                {timeframe === "3m"
                  ? "3 months"
                  : timeframe === "6m"
                    ? "6 months"
                    : timeframe === "1y"
                      ? "1 year"
                      : timeframe === "3y"
                        ? "3 years"
                        : "5 years"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading beta data...</span>
                </div>
              ) : sortedStocks.length === 0 ? (
                <div className="flex justify-center items-center py-12 text-muted-foreground">
                  No stocks available for beta analysis
                </div>
              ) : (
                <>
                  <div className="h-[400px] w-full">
                    <div className="flex items-center h-full">
                      <div className="w-12 h-full flex flex-col justify-between text-xs text-muted-foreground">
                        <div>3.0</div>
                        <div>2.0</div>
                        <div>1.0</div>
                        <div>0.0</div>
                      </div>
                      <div className="flex-1 h-full relative">
                        {/* Market line at beta = 1 */}
                        <div className="absolute left-0 right-0 top-[66.7%] border-t border-dashed border-yellow-500 z-10">
                          <div className="absolute -top-6 right-0 text-xs text-yellow-600 font-medium">
                            Market (β = 1.0)
                          </div>
                        </div>

                        {/* Beta bars */}
                        <div className="flex h-full items-end justify-around">
                          {sortedStocks.map((stock) => (
                            <div key={stock.symbol} className="flex flex-col items-center group">
                              <div className="text-xs mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                β = {stock.beta.toFixed(2)}
                              </div>
                              <div
                                className={`w-12 ${
                                  stock.beta < 0.8 ? "bg-green-500" : stock.beta > 1.2 ? "bg-red-500" : "bg-amber-500"
                                } rounded-t-sm relative`}
                                style={{ height: `${Math.min(stock.beta * 33.3, 100)}%` }}
                              >
                                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                                  {stock.symbol}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 dark:bg-green-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Low Volatility (β &lt; 0.8)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Stocks with beta less than 0.8 tend to be less volatile than the market. In India, these often
                          include FMCG, Pharma, and Utility stocks.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-amber-50 dark:bg-amber-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Market-like (0.8 ≤ β ≤ 1.2)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Stocks with beta between 0.8 and 1.2 tend to move similarly to the overall market. These often
                          include large-cap stocks like TCS, HDFC Bank, and Reliance.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">High Volatility (β &gt; 1.2)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Stocks with beta greater than 1.2 tend to be more volatile than the market. In India, these
                          often include small-caps, PSU banks, and metal stocks.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="mt-4">
          <BetaCalculator marketIndex={marketIndex} timeframe={timeframe} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
