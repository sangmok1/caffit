"use client"

import { useState } from "react"
import KakaoMapWrapper from "@/components/kakao-map-wrapper"
import Link from "next/link"

export default function FindLocationPage() {
  const [selectedCafe, setSelectedCafe] = useState<any>(null)

  return (
    <>
      <style jsx global>{`
        .fixed-header-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .fixed-header-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="min-h-screen bg-white py-8 px-2 md:px-0">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 섹션 */}
          <div className="mb-8">
            <Link 
              href="/"
              className="flex items-center gap-2 text-[#8D6E63] hover:text-[#C8A27A] transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>메뉴검색으로 돌아가기</span>
            </Link>
            
            <div className="text-center space-y-4">
              <p className="text-lg text-[#8D6E63] max-w-2xl mx-auto">
                내 주변의 카페를 지도에서 찾아보세요. 위치를 허용하면 가까운 카페들을 표시해드립니다.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-[#A1887F]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#00704A] rounded-full"></span>
                  스타벅스
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#4A90E2] rounded-full"></span>
                  메가커피
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#8B4513] rounded-full"></span>
                  컴포즈
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#191970] rounded-full"></span>
                  빽다방
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#FF4444] rounded-full"></span>
                  할리스
                </span>
              </div>
            </div>
          </div>

          {/* 지도 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <KakaoMapWrapper 
              onCafeSelect={(cafe) => {
                setSelectedCafe(cafe)
                console.log('Selected cafe:', cafe)
              }}
            />
          </div>

          {/* 길찾기 안내 정보 */}
          {selectedCafe && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-[#5D4037] mb-4">
                🗺️ 길찾기 안내
              </h3>
              <div className="space-y-4">
                <div className="bg-[#F8F6F2] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: selectedCafe.store_name === 'Starbucks' ? '#00704A' :
                                       selectedCafe.store_name === 'MEGA' ? '#4A90E2' :
                                       selectedCafe.store_name === 'Compose' ? '#8B4513' :
                                       selectedCafe.store_name === 'Paiks' ? '#191970' :
                                       selectedCafe.store_name === 'Hollys' ? '#FF4444' : '#666666'
                      }}
                    ></div>
                    <span className="font-bold text-[#5D4037]">
                      목적지: {selectedCafe.store} {selectedCafe.store_name}
                    </span>
                  </div>
                  <p className="text-[#8D6E63] text-sm">
                    📍 {selectedCafe.address}
                  </p>
                </div>

                
                {/* 빠른 액션 */}
                <div className="mt-4">
                  <button 
                    onClick={() => {
                      window.location.href = `/?store=${encodeURIComponent(selectedCafe.store)}`
                    }}
                    className="py-2 px-4 bg-[#C8A27A] text-white rounded-lg font-medium hover:bg-[#B08E6A] transition-colors text-sm"
                  >
                    ☕ 메뉴 상세 정보 보기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 안내 정보 */}
          <div className="mt-8 bg-[#F8F6F2] rounded-lg p-6">
            <h3 className="text-lg font-bold text-[#5D4037] mb-3">
              📋 이용 안내
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[#8D6E63]">
              <div>
                <h4 className="font-medium mb-2">🎯 검색 범위</h4>
                <p>내 위치 주변 가까운 카페들을 표시합니다.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🏪 지원 브랜드</h4>
                <p>스타벅스, 메가커피, 컴포즈, 빽다방, 할리스</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📍 위치 정보</h4>
                <p>정확한 서비스를 위해 위치 권한이 필요합니다.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🕒 영업시간</h4>
                <p>실시간 영업 상태는 매장에 직접 확인해주세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 