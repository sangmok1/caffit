"use client"
import { X, Coffee, Droplet, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Coffee as CoffeeType } from "@/components/coffee-screener"

const cafes = [
  { name: "Starbucks", color: "#00704A", emoji: "☕" },
  { name: "EDIYA", color: "#0F4C81", emoji: "🥤" },
  { name: "Paik's", color: "#8B4513", emoji: "🍵" },
  { name: "Gong Cha", color: "#FF6B35", emoji: "🧋" },
  { name: "MEGA", color: "#4A90E2", emoji: "🥛" },
]

export function CoffeeDetails({ coffee, onClose }: { coffee: CoffeeType; onClose: () => void }) {
  const cafe = cafes.find((c) => c.name === coffee.store)

  return (
    <Dialog open={!!coffee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-[#FBF7F0] border-[#E6D9CC]">
        <DialogHeader className="border-b border-[#E6D9CC] pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cafe?.emoji}</span>
              <div>
                <span className="font-serif font-bold text-[#5D4037]">{coffee.eng_name}</span>
                <div className="text-sm text-[#8D6E63]">{coffee.name}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#F5E9D9]"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge style={{ backgroundColor: cafe?.color, color: "white" }}>{coffee.store}</Badge>
              <Badge variant="outline" className="border-[#C8A27A] text-[#8D6E63]">
                {coffee.category}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          <div className="relative">
            <div className="absolute -top-6 -left-6 text-[#E6D9CC] opacity-20">
              <Coffee size={80} />
            </div>

            <Card className="border-[#E6D9CC] bg-white shadow-sm overflow-hidden relative z-10">
              <CardHeader className="bg-[#F5E9D9] border-b border-[#E6D9CC]">
                <CardTitle className="font-serif text-[#5D4037] flex items-center">
                  <Coffee className="h-5 w-5 mr-2 text-[#C8A27A]" />
                  Nutritional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div className="text-2xl font-bold text-[#5D4037]">{coffee.kcal}</div>
                    <div className="text-sm text-[#8D6E63]">Calories</div>
                  </div>
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div
                      className={`text-2xl font-bold ${
                        coffee.sugars <= 10 ? "text-green-600" : coffee.sugars <= 25 ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {coffee.sugars}g
                    </div>
                    <div className="text-sm text-[#8D6E63]">Sugar</div>
                  </div>
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div className="text-2xl font-bold text-[#5D4037]">{coffee.protein}g</div>
                    <div className="text-sm text-[#8D6E63]">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div
                      className={`text-2xl font-bold ${
                        coffee.sodium <= 100
                          ? "text-green-600"
                          : coffee.sodium <= 200
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {coffee.sodium}mg
                    </div>
                    <div className="text-sm text-[#8D6E63]">Sodium</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 text-[#E6D9CC] opacity-20">
              <Droplet size={80} />
            </div>

            <Card className="border-[#E6D9CC] bg-white shadow-sm overflow-hidden relative z-10">
              <CardHeader className="bg-[#F5E9D9] border-b border-[#E6D9CC]">
                <CardTitle className="font-serif text-[#5D4037] flex items-center">
                  <Droplet className="h-5 w-5 mr-2 text-[#C8A27A]" />
                  Fat Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div className="text-2xl font-bold text-[#5D4037]">{coffee.trans_fat}g</div>
                    <div className="text-sm text-[#8D6E63]">Trans Fat</div>
                  </div>
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div className="text-2xl font-bold text-[#5D4037]">{coffee.sat_fat}g</div>
                    <div className="text-sm text-[#8D6E63]">Saturated Fat</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -left-6 text-[#E6D9CC] opacity-20">
              <Leaf size={80} />
            </div>

            <Card className="border-[#E6D9CC] bg-white shadow-sm overflow-hidden relative z-10">
              <CardHeader className="bg-[#F5E9D9] border-b border-[#E6D9CC]">
                <CardTitle className="font-serif text-[#5D4037] flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-[#C8A27A]" />
                  Caffeine Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <div
                      className={`text-2xl font-bold ${
                        coffee.caffeine <= 100
                          ? "text-green-600"
                          : coffee.caffeine <= 200
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {coffee.caffeine}mg
                    </div>
                    <div className="text-sm text-[#8D6E63]">Caffeine</div>
                  </div>

                  <div className="text-sm text-[#8D6E63] space-y-1 p-4 bg-[#F8F3E9] rounded-lg border border-[#E6D9CC]">
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2"></span> WHO recommends
                      limiting daily sugar intake to 25g
                    </p>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-600 mr-2"></span> Daily sodium limit:
                      2,300mg (about 1 teaspoon of salt)
                    </p>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2"></span> Safe daily caffeine
                      limit: 400mg for healthy adults
                    </p>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#C8A27A] mr-2"></span> Protein helps with
                      satiety and muscle maintenance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
