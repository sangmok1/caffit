"use client"

import { useEffect, useState } from "react"
import { Map, MapMarker } from "react-kakao-maps-sdk"

interface CafeLocation {
  id: number
  store_name: string
  branch_name: string
  latitude: number
  longitude: number
  address: string
  phone?: string
  business_hours?: string
}

interface KakaoMapProps {
  onCafeSelect?: (cafe: CafeLocation) => void
}

export default function KakaoMap({ onCafeSelect }: KakaoMapProps) {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [cafes, setCafes] = useState<CafeLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 사용자 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error("위치 정보를 가져올 수 없습니다:", error)
          // 기본값: 서울역 좌표
          setUserLocation({ lat: 37.5665, lng: 126.9780 })
          setError("위치 정보를 가져올 수 없어 서울역으로 설정했습니다.")
        }
      )
    } else {
      // 기본값: 서울역 좌표
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
      setError("브라우저에서 위치 서비스를 지원하지 않습니다.")
    }
  }, [])

  // 주변 카페 정보 가져오기
  useEffect(() => {
    if (!userLocation) return

    const fetchNearbyCafes = async () => {
      try {
        const response = await fetch(
          `/api/cafes?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=1000`
        )
        if (response.ok) {
          const data = await response.json()
          setCafes(data.cafes || [])
        } else {
          // API가 아직 없으면 임시 데이터
          setCafes([
            {
              id: 1,
              store_name: "Starbucks",
              branch_name: "강남역점",
              latitude: userLocation.lat + 0.001,
              longitude: userLocation.lng + 0.001,
              address: "서울특별시 강남구 강남대로",
              phone: "02-1234-5678",
              business_hours: "06:00-22:00"
            },
            {
              id: 2,
              store_name: "MEGA",
              branch_name: "역삼점",
              latitude: userLocation.lat - 0.001,
              longitude: userLocation.lng + 0.002,
              address: "서울특별시 강남구 역삼로",
              phone: "02-2345-6789",
              business_hours: "07:00-23:00"
            }
          ])
        }
      } catch (err) {
        console.error("카페 정보를 가져올 수 없습니다:", err)
        setError("카페 정보를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyCafes()
  }, [userLocation])

  // 카페 브랜드별 마커 색상
  const getMarkerColor = (storeName: string) => {
    switch (storeName) {
      case "Starbucks": return "#00704A"
      case "MEGA": return "#4A90E2"
      case "Gong Cha": return "#8B0000"
      case "Compose": return "#8B4513"
      case "Paiks": return "#191970"
      case "Hollys": return "#FF4444"
      default: return "#666666"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-[#8D6E63]">지도 로딩중...</p>
        </div>
      </div>
    )
  }

  if (!userLocation) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">위치 정보를 가져올 수 없습니다.</p>
          <p className="text-gray-600 text-sm">브라우저 설정에서 위치 서비스를 허용해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {error}
        </div>
      )}
      
      <div className="relative">
        <Map
          center={userLocation}
          style={{ width: "100%", height: "400px" }}
          level={5} // 1km 반경 정도 보이는 줌 레벨
          maxLevel={7} // 너무 멀리 줌아웃 방지
        >
          {/* 사용자 현재 위치 마커 */}
          <MapMarker
            position={userLocation}
            image={{
              src: "data:image/svg+xml;base64," + btoa(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#FF4444" stroke="#FFFFFF" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
                </svg>
              `),
              size: { width: 24, height: 24 }
            }}
          />
          
          {/* 카페 마커들 */}
          {cafes.map((cafe) => (
            <MapMarker
              key={cafe.id}
              position={{ lat: cafe.latitude, lng: cafe.longitude }}
              title={`${cafe.store_name} ${cafe.branch_name}`}
              onClick={() => onCafeSelect?.(cafe)}
              image={{
                src: "data:image/svg+xml;base64," + btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="${getMarkerColor(cafe.store_name)}" stroke="#FFFFFF" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">☕</text>
                  </svg>
                `),
                size: { width: 32, height: 32 }
              }}
            />
          ))}
        </Map>
      </div>
      
      {/* 카페 목록 */}
      <div className="mt-4">
        <h3 className="text-lg font-medium text-[#5D4037] mb-3">
          주변 카페 ({cafes.length}개)
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cafes.map((cafe) => (
            <div
              key={cafe.id}
              className="p-3 bg-white border border-[#E6D9CC] rounded-lg hover:bg-[#F8F6F2] cursor-pointer transition-colors"
              onClick={() => onCafeSelect?.(cafe)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getMarkerColor(cafe.store_name) }}
                    ></div>
                    <span className="font-medium text-[#5D4037]">
                      {cafe.store_name} {cafe.branch_name}
                    </span>
                  </div>
                  <p className="text-sm text-[#8D6E63] mt-1">{cafe.address}</p>
                  {cafe.business_hours && (
                    <p className="text-xs text-[#B08E6A]">
                      영업시간: {cafe.business_hours}
                    </p>
                  )}
                </div>
                <button className="text-[#C8A27A] hover:text-[#B08E6A] transition-colors">
                  길찾기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 