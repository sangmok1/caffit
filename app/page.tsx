'use client'

import { useState, useEffect } from "react"
import type { Metadata } from "next"
import CoffeeScreener from "@/components/coffee-screener"
import PWARegister from "@/components/pwa-register"
import SplashScreen from "@/components/splash-screen"

export default function Page() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // 모바일 환경 감지 (PWA 또는 모바일 브라우저)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true

    // 모바일이거나 PWA로 실행된 경우에만 스플래시 화면 표시
    if (isMobile || isPWA) {
      setShowSplash(true)
    }
  }, [])

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <div className="min-h-screen bg-[#F8F3E9] text-[#5D4037]">
        <div className="container mx-auto py-8 px-4">
          {/* 로고 이미지만 최상단, 왼쪽 정렬 */}
          <div className="max-w-5xl mx-auto flex justify-start mb-0">
            <img src="/logo-back-no.png" alt="Caffit Logo" className="hidden md:block" style={{ width: 170, height: 100, objectFit: 'contain' }} />
          </div>
          <header className="text-center mb-8">
            <div className="flex justify-center mt-4">
              <div className="h-1 w-24 bg-[#C8A27A] rounded-full"></div>
            </div>
          </header>
          <CoffeeScreener />
          <PWARegister />
        </div>
      </div>
    </>
  )
}
