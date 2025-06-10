"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, ArrowUpDown, Info, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BetaChart } from "@/components/beta-chart"
import { StockDetails } from "@/components/stock-details"
import { fetchIndianStocks, fetchStockDetails } from "@/lib/api"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { ExportData } from "@/components/export-data"

// Define stock type
export type Stock = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  beta: number
  sector: string
  pe: number
  exchange: string
}

const indianSectors = [
  "All Sectors",
  "Information Technology",
  "Banking & Financial Services",
  "Oil & Gas",
  "Pharmaceuticals",
  "Automotive",
  "Consumer Goods",
  "Metals & Mining",
  "Power",
  "Telecom",
  "Infrastructure",
]

const exchanges = ["All Exchanges", "NSE", "BSE"]

const indices = ["All Indices", "NIFTY 50", "SENSEX", "NIFTY BANK", "NIFTY IT", "NIFTY PHARMA"]

export default function StockScreener() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("symbol")
  const [sortDirection, setSortDirection] = useState("asc")
  const [selectedSector, setSelectedSector] = useState("All Sectors")
  const [selectedExchange, setSelectedExchange] = useState("All Exchanges")
  const [selectedIndex, setSelectedIndex] = useState("All Indices")
  const [betaRange, setBetaRange] = useState([0, 3])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const { toast } = useToast()

  // Fetch stocks on initial load
  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoading(true)
        const data = await fetchIndianStocks()
        setStocks(data)
        setLoading(false)
      } catch (err) {
        setError("Failed to load stock data. Please try again later.")
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to load stock data. Please try again later.",
          variant: "destructive",
        })
      }
    }

    loadStocks()
  }, [toast])

  // Filter and sort stocks
  useEffect(() => {
    let result = [...stocks]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sector filter
    if (selectedSector !== "All Sectors") {
      result = result.filter((stock) => stock.sector === selectedSector)
    }

    // Apply exchange filter
    if (selectedExchange !== "All Exchanges") {
      result = result.filter((stock) => stock.exchange === selectedExchange)
    }

    // Apply index filter
    if (selectedIndex !== "All Indices") {
      // In a real implementation, this would filter based on index membership
      // For now, we'll simulate this with a subset of stocks
      if (selectedIndex === "NIFTY 50") {
        result = result.filter((stock) => stock.marketCap > 500) // Just a simulation
      } else if (selectedIndex === "SENSEX") {
        result = result.filter((stock) => stock.marketCap > 800) // Just a simulation
      }
    }

    // Apply beta range filter
    result = result.filter((stock) => stock.beta >= betaRange[0] && stock.beta <= betaRange[1])

    // Sort stocks
    result.sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField as keyof Stock] > b[sortField as keyof Stock] ? 1 : -1
      } else {
        return a[sortField as keyof Stock] < b[sortField as keyof Stock] ? 1 : -1
      }
    })

    setFilteredStocks(result)
    setTotalPages(Math.ceil(result.length / itemsPerPage))

    // Reset to first page when filters change
    setPage(1)
  }, [stocks, searchTerm, sortField, sortDirection, selectedSector, selectedExchange, selectedIndex, betaRange])

  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get paginated stocks
  const getPaginatedStocks = () => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStocks.slice(startIndex, endIndex)
  }

  // Handle stock selection for details
  const handleStockSelect = async (stock: Stock) => {
    try {
      setLoading(true)
      const detailedStock = await fetchStockDetails(stock.symbol)
      setSelectedStock(detailedStock)
      setLoading(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load stock details. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by symbol or company name"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Stocks</SheetTitle>
              <SheetDescription>Customize your Indian stock screening criteria</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exchange</label>
                <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    {exchanges.map((exchange) => (
                      <SelectItem key={exchange} value={exchange}>
                        {exchange}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Index</label>
                <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select index" />
                  </SelectTrigger>
                  <SelectContent>
                    {indices.map((index) => (
                      <SelectItem key={index} value={index}>
                        {index}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sector</label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianSectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Beta Range</label>
                  <span className="text-sm text-muted-foreground">
                    {betaRange[0].toFixed(1)} - {betaRange[1].toFixed(1)}
                  </span>
                </div>
                <Slider defaultValue={betaRange} min={0} max={3} step={0.1} onValueChange={setBetaRange} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low Volatility</span>
                  <span>High Volatility</span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="beta">Beta Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading && stocks.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading stock data...</span>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-12 text-destructive">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("symbol")}>
                            Symbol
                            {sortField === "symbol" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                            Company
                            {sortField === "name" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("exchange")}>
                            Exchange
                            {sortField === "exchange" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("price")}>
                            Price (₹)
                            {sortField === "price" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("changePercent")}>
                            Change %
                            {sortField === "changePercent" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("marketCap")}>
                            Market Cap (Cr)
                            {sortField === "marketCap" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                          </TableHead>
                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort("beta")}>
                            Beta
                            {sortField === "beta" && (
                              <ArrowUpDown
                                className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`}
                              />
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Beta Explained</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Beta measures a stock's volatility compared to the overall market (NIFTY 50). A beta
                                    of 1 indicates the stock moves with the market. A beta greater than 1 indicates
                                    higher volatility, while less than 1 indicates lower volatility.
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedStocks().map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium">{stock.symbol}</TableCell>
                            <TableCell>
                              {stock.name}
                              <Badge variant="outline" className="ml-2">
                                {stock.sector}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{stock.exchange}</TableCell>
                            <TableCell className="text-right">₹{stock.price.toFixed(2)}</TableCell>
                            <TableCell
                              className={`text-right ${stock.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {stock.changePercent >= 0 ? "+" : ""}
                              {stock.changePercent.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">₹{stock.marketCap.toFixed(0)}</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`
                                ${stock.beta < 0.8 ? "text-green-600" : ""}
                                ${stock.beta >= 0.8 && stock.beta <= 1.2 ? "text-amber-600" : ""}
                                ${stock.beta > 1.2 ? "text-red-600" : ""}
                              `}
                              >
                                {stock.beta.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStockSelect(stock)}
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Details"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredStocks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No stocks match your criteria
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredStocks.length > 0 && (
                    <div className="py-4 flex justify-center">
                      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beta" className="mt-4">
          <BetaChart stocks={filteredStocks.slice(0, 20)} loading={loading} />
        </TabsContent>
      </Tabs>

      <ExportData stocks={filteredStocks} loading={loading} />

      {selectedStock && <StockDetails stock={selectedStock} onClose={() => setSelectedStock(null)} />}
    </div>
  )
}
