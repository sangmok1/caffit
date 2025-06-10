"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Stock } from "@/components/stock-screener"
import { BetaVisualization } from "@/components/beta-visualization"
import { StockChart } from "@/components/stock-chart"

export function StockDetails({ stock, onClose }: { stock: Stock; onClose: () => void }) {
  return (
    <Dialog open={!!stock} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="font-bold">{stock.symbol}</span>
              <span className="ml-2 text-muted-foreground">{stock.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">₹{stock.price.toFixed(2)}</div>
              <div className={`${stock.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stock.changePercent >= 0 ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.changePercent >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Price Chart</TabsTrigger>
              <TabsTrigger value="beta">Beta Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              <StockChart stock={stock} />
            </TabsContent>

            <TabsContent value="beta">
              <BetaVisualization stock={stock} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
