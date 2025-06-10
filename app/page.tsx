import type { Metadata } from "next"
import CoffeeScreener from "@/components/coffee-screener"

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F8F3E9] text-[#5D4037]">
      <div className="container mx-auto py-8 px-4">
        {/* 로고 이미지만 최상단, 왼쪽 정렬 */}
        <div className="max-w-5xl mx-auto flex justify-start mb-0">
          <img src="/caffit-logo.png" alt="Caffit Logo" style={{ width: 170, height: 100, objectFit: 'contain', display: 'block' }} />
        </div>
        <header className="text-center mb-8">
          <div className="flex justify-center mt-4">
            <div className="h-1 w-24 bg-[#C8A27A] rounded-full"></div>
          </div>
        </header>
        <CoffeeScreener />
      </div>
    </div>
  )
}
