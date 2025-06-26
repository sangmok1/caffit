'use client'

import { useState, useEffect } from "react"
import type { Metadata } from "next"
import CoffeeScreener from "@/components/coffee-screener"
import PWARegister from "@/components/pwa-register"
import SplashScreen from "@/components/splash-screen"
import ContactUs from "@/components/contact-us"

export default function Page() {
  const [showSplash, setShowSplash] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)

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
        
        {/* 하단 링크 - 더 명확하게 표시 */}
        <div className="max-w-5xl mx-auto text-center mt-16 mb-12 py-8 border-t border-[#E6D9CC]">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#8D6E63]">
            <a 
              href="/privacy-policy" 
              className="hover:text-[#C8A27A] transition-colors underline"
            >
              개인정보 처리방침
            </a>
            <span className="hidden sm:inline">|</span>
            <button
              onClick={() => setIsContactOpen(true)}
              className="hover:text-[#C8A27A] transition-colors underline"
            >
              Contact Us
            </button>
            <span className="hidden sm:inline">|</span>
            <span>ⓒ Caffit.</span>
          </div>
        </div>
        
        <PWARegister />
        
        {/* Contact Us 팝업 */}
        <ContactUs 
          isOpen={isContactOpen} 
          onClose={() => setIsContactOpen(false)} 
        />
      </div>
    </div>
    </>
  )
}
