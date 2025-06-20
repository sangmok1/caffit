'use client'

import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 1.5초 후 스플래시 화면 숨기기
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onFinish, 300) // 페이드아웃 애니메이션 후 완전히 제거
    }, 1500)

    return () => clearTimeout(timer)
  }, [onFinish])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#F8F6F2] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        background: 'linear-gradient(135deg, #F8F6F2 0%, #F0EDE7 100%)'
      }}
    >
      <div className="flex flex-col items-center justify-center text-center px-8">
        {/* 스플래시 이미지 */}
        <div className="mb-8 animate-pulse">
          <img 
            src="/logo-back-no.png" 
            alt="Caffit Splash" 
            className="w-20 h-20 object-contain mx-auto"
            style={{ 
              filter: 'drop-shadow(0 10px 30px rgba(200, 162, 122, 0.3))',
              animation: 'fadeInScale 1s ease-out'
            }}
          />
        </div>

        {/* 로딩 인디케이터 */}
        <div className="flex space-x-2 mb-4">
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* 텍스트 */}
        <p className="text-[#8D6E63] text-sm font-medium opacity-80">
          Smart Coffee, Better Health
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
} 