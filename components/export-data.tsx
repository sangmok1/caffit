"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileSpreadsheet, FileText, FileCode, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface Coffee {
  cafe: string
  name: string
  nameKorean: string
  category: string
  temperature: string
  size: string
  price: number
  sugar: number
  calories: number
  caffeine: number
  description: string
}

interface ExportDataProps {
  coffees: Coffee[]
  loading?: boolean
}

interface ExportOptions {
  includePrice: boolean
  includeBeta: boolean
  includeVolume: boolean
  includeMarketCap: boolean
  includePE: boolean
}

export function ExportData({ coffees, loading }: ExportDataProps) {
  const [exporting, setExporting] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    includePrice: true,
    includeBeta: true,
    includeVolume: true,
    includeMarketCap: true,
    includePE: true,
  })

  // Helper function to format data based on options
  const formatData = () => {
    return coffees.map((coffee) => {
      const data: any = {
        Cafe: coffee.cafe,
        "Drink Name": coffee.name,
        "Korean Name": coffee.nameKorean,
        Category: coffee.category,
        Temperature: coffee.temperature,
        Size: coffee.size,
      }

      if (options.includePrice) {
        data.Price = `₩${coffee.price.toLocaleString()}`
      }

      if (options.includeBeta) {
        data["Sugar (g)"] = coffee.sugar
      }

      if (options.includeVolume) {
        data.Calories = coffee.calories
      }

      if (options.includeMarketCap) {
        data["Caffeine (mg)"] = coffee.caffeine
      }

      if (options.includePE) {
        data.Description = coffee.description
      }

      return data
    })
  }

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setExporting(true)
      const data = formatData()
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Stocks")
      XLSX.writeFile(wb, "coffee-menu-data.xlsx")
    } catch (err) {
      console.error("Failed to export Excel:", err)
    } finally {
      setExporting(false)
    }
  }

  // Export to PDF
  const exportToPDF = async () => {
    try {
      setExporting(true)
      const data = formatData()
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text("Indian Stock Market Data", 14, 15)

      // Add timestamp
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)

      // Convert data to format suitable for autotable
      const headers = Object.keys(data[0])
      const rows = data.map((item) => Object.values(item))

      // Add table
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }, // Blue header
        margin: { top: 15 },
      })

      doc.save("coffee-menu-data.pdf")
    } catch (err) {
      console.error("Failed to export PDF:", err)
    } finally {
      setExporting(false)
    }
  }

  // Export to HTML
  const exportToHTML = async () => {
    try {
      setExporting(true)
      const data = formatData()

      // Create HTML content
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Coffee Menu Data</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 2rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2980b9; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .header { margin-bottom: 1rem; }
            .timestamp { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Coffee Menu Data</h1>
            <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0])
                  .map((header) => `<th>${header}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${Object.values(row)
                    .map((value) => `<td>${value}</td>`)
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "coffee-menu-data.html"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to export HTML:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Download coffee menu data in various formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Include Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="price"
                  checked={options.includePrice}
                  onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includePrice: checked as boolean }))}
                />
                <Label htmlFor="price">Price & Change</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="beta"
                  checked={options.includeBeta}
                  onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includeBeta: checked as boolean }))}
                />
                <Label htmlFor="beta">Beta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="volume"
                  checked={options.includeVolume}
                  onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includeVolume: checked as boolean }))}
                />
                <Label htmlFor="volume">Volume</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketCap"
                  checked={options.includeMarketCap}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, includeMarketCap: checked as boolean }))
                  }
                />
                <Label htmlFor="marketCap">Market Cap</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pe"
                  checked={options.includePE}
                  onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includePE: checked as boolean }))}
                />
                <Label htmlFor="pe">P/E Ratio</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={exportToExcel} disabled={exporting || loading} className="flex items-center gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Export to Excel
            </Button>

            <Button onClick={exportToPDF} disabled={exporting || loading} className="flex items-center gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export to PDF
            </Button>

            <Button onClick={exportToHTML} disabled={exporting || loading} className="flex items-center gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCode className="h-4 w-4" />}
              Export to HTML
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
