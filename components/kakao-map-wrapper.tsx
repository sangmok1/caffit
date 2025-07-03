"use client"

import { useEffect, useState } from "react"
import { Map, MapMarker } from "react-kakao-maps-sdk"

declare global {
  interface Window {
    kakao: any
  }
}

interface CafeLocation {
  id: number
  store_name: string
  branch_name: string
  latitude: number
  longitude: number
  address: string
  store_type?: string
  store?: string
  distance?: number
  phone?: string
  business_hours?: string
}

interface KakaoMapWrapperProps {
  onCafeSelect?: (cafe: CafeLocation | null) => void
}

export default function KakaoMapWrapper({ onCafeSelect }: KakaoMapWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [cafes, setCafes] = useState<CafeLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [locationRequested, setLocationRequested] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [selectedCafeId, setSelectedCafeId] = useState<number | null>(null)
  const [targetCafe, setTargetCafe] = useState<CafeLocation | null>(null)
  const [directions, setDirections] = useState<any>(null)
  const [routeOverlay, setRouteOverlay] = useState<any>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationMode, setNavigationMode] = useState<'walking' | 'driving'>('walking')
  const [isFullscreenNav, setIsFullscreenNav] = useState(false)
  const [currentRoute, setCurrentRoute] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [remainingDistance, setRemainingDistance] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [isDestinationReached, setIsDestinationReached] = useState(false)
  const [autoEndTimer, setAutoEndTimer] = useState<NodeJS.Timeout | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [userHeading, setUserHeading] = useState<number>(0)
  const [routePath, setRoutePath] = useState<any[]>([])
  const [lastRouteCheck, setLastRouteCheck] = useState<Date>(new Date())
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(null)

  // 카카오맵 API 로드 확인
  useEffect(() => {
    const checkKakaoMaps = () => {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
        // 이미 로드된 경우
        setIsLoaded(true)
      } else if (typeof window !== 'undefined' && window.kakao) {
        // kakao 객체는 있지만 maps가 아직 로드되지 않은 경우
        window.kakao.maps.load(() => {
          setIsLoaded(true)
        })
      } else {
        // 아직 스크립트가 로드되지 않은 경우, 잠시 후 다시 시도
        setTimeout(checkKakaoMaps, 100)
      }
    }

    checkKakaoMaps()
  }, [])

  // 위치 정보 요청 함수
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
      setError("브라우저에서 위치 서비스를 지원하지 않습니다. 서울역으로 설정했습니다.")
      return
    }

    setLocationRequested(true)
    setError("📍 위치 권한을 요청하고 있습니다...")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setError("") // 에러 메시지 제거
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error)
        let errorMessage = ""
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다."
            break
          case error.TIMEOUT:
            errorMessage = "위치 정보 요청 시간이 초과되었습니다."
            break
          default:
            errorMessage = "알 수 없는 오류가 발생했습니다."
            break
        }
        
        // 기본값: 서울역 좌표
        setUserLocation({ lat: 37.5665, lng: 126.9780 })
        setError(errorMessage + " 서울역으로 설정했습니다.")
      },
      {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // 10초 타임아웃
        maximumAge: 300000 // 5분 동안 캐시된 위치 사용
      }
    )
  }

  // 페이지 로드시 자동으로 위치 요청
  useEffect(() => {
    if (!isLoaded) return
    requestLocation()
  }, [isLoaded])

  // 주변 카페 정보 가져오기 (임시 데이터)
  useEffect(() => {
    if (!userLocation) return

    const fetchNearbyCafes = async () => {
      try {
        // 실제 DB에서 500m 반경 카페 정보 가져오기
        const response = await fetch('/api/coffee-locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: 500 // 500m 반경
          })
        })

        if (!response.ok) {
          throw new Error(`API 오류: ${response.status}`)
        }

        const data = await response.json()
        console.log(`500m 내 카페 ${data.count}개 발견:`, data.locations)
        
        setCafes(data.locations)
        
      } catch (err) {
        console.error("카페 정보를 가져올 수 없습니다:", err)
        setError("카페 정보를 불러오는데 실패했습니다. DB 연결을 확인해주세요.")
        
        // DB 연결 실패시 빈 배열로 설정
        setCafes([])
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyCafes()
  }, [userLocation])

  // 컴포넌트 언마운트시 위치 추적 정리
  useEffect(() => {
    return () => {
      stopLocationTracking()
    }
  }, [])

  // 카페 브랜드별 로고 텍스트 (이모지 형태)
  const getCafeLogoText = (storeName: string) => {
    console.log('브랜드 로고 텍스트 요청:', storeName) // 디버깅용
    switch (storeName) {
      case "Starbucks": return "★" // 스타벅스 별 모양
      case "MEGA": return "M" // 메가커피 M
      case "Gong Cha": return "G" // 공차 G
      case "Compose": return "C" // 컴포즈 C
      case "Paiks": return "P" // 빽다방 P
      case "Hollys": return "H" // 할리스 H
      case "EDIYA": return "E" // 이디야 E
      default: return "☕"
    }
  }

  // 카페 브랜드별 로고 이미지 URL
  const getCafeLogoUrl = (storeName: string) => {
    const logoMap: { [key: string]: string } = {
      "Starbucks": "/starbucks-logo.png",
      "MEGA": "/mega-logo.png", 
      "Gong Cha": "/gongcha-logo.png",
      "Compose": "/compose-logo.png",
      "Paiks": "/paiks-logo.png",
      "Hollys": "/hollys-logo.png",
      "EDIYA": "/ediya-logo.png"
    }
    
    return logoMap[storeName] || "/default-cafe-logo.png"
  }

  // 카페 브랜드별 마커 색상 (로고가 없을 때 대체용)
  const getMarkerColor = (storeName: string) => {
    console.log('브랜드 색상 요청:', storeName) // 디버깅용
    switch (storeName) {
      case "Starbucks": return "#00704A" // 스타벅스 진한 녹색
      case "MEGA": return "#4A90E2"
      case "Gong Cha": return "#8B0000"
      case "Compose": return "#8B4513"
      case "Paiks": return "#191970"
      case "Hollys": return "#FF4444"
      case "EDIYA": return "#C8A27A"
      default: return "#666666" // 기본 회색
    }
  }

  // 내 위치로 돌아가기
  const goToMyLocation = () => {
    if (map && userLocation) {
      const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      map.setCenter(moveLatLon)
      map.setLevel(2) // 500m 반경으로 더 확대
    } else if (!userLocation) {
      requestLocation() // 위치 정보가 없으면 다시 요청
    }
  }

  // 선택된 카페로 이동 (토글 기능 추가)
  const goToCafe = (cafe: CafeLocation) => {
    if (map) {
      const moveLatLon = new window.kakao.maps.LatLng(cafe.latitude, cafe.longitude)
      map.setCenter(moveLatLon)
      // 주변카페 크기 고정: 확대하지 않고 현재 레벨 유지
    }
    
    // 마커 토글 기능: 이미 선택된 카페를 다시 클릭하면 선택 해제
    if (selectedCafeId === cafe.id) {
      setSelectedCafeId(null)
      onCafeSelect?.(null)
      console.log('카페 선택 해제됨:', cafe.store_name, cafe.branch_name)
    } else {
      setSelectedCafeId(cafe.id)
      onCafeSelect?.(cafe)
      console.log('카페 선택됨:', cafe.store_name, cafe.branch_name)
    }
  }

  // 경로 지우기 함수
  const clearRoute = () => {
    if (routeOverlay && map) {
      routeOverlay.setMap(null)
      setRouteOverlay(null)
    }
    setIsNavigating(false)
    setCurrentRoute(null)
    setCurrentStep(0)
    setRemainingDistance(0)
    setRemainingTime(0)
  }

  // 위치 추적 및 네비게이션 처리
  const startLocationTracking = () => {
    if (isTrackingLocation) return

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude, heading } = position.coords
      const newLocation = { lat: latitude, lng: longitude }
      
      setUserLocation(newLocation)
      
      // GPS heading이 있으면 사용, 없으면 이동 방향 계산
      if (heading !== null && heading !== undefined) {
        setUserHeading(heading)
      } else if (userLocation) {
        const calculatedHeading = calculateBearing(
          userLocation.lat, userLocation.lng, 
          latitude, longitude
        )
        setUserHeading(calculatedHeading)
      }

      // 네비게이션 모드에서는 지도를 확대하고 중심을 고정
      if (isNavigating && map) {
        // 모드별 확대 레벨 설정
        const navigationLevel = navigationMode === 'driving' ? 2 : 3 // 차량: 2, 도보: 3
        map.setLevel(navigationLevel)
        map.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
        
        // 부드러운 이동 효과
        map.panTo(new window.kakao.maps.LatLng(latitude, longitude))
      } else if (map) {
        // 일반 모드에서는 기본 레벨 유지
        map.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
      }

      // 도착 확인 (차량: 30미터, 도보: 15미터 이내)
      // 그리고 네비게이션이 최소 30초 이상 실행되었을 때만 도착 판단
      if (selectedCafeId && cafes.length > 0 && isNavigating) {
        const targetCafe = cafes.find(cafe => cafe.id === selectedCafeId)
        if (targetCafe) {
          const distanceToTarget = getDistance(
            latitude, longitude,
            targetCafe.latitude, targetCafe.longitude
          )
          
          const arrivalThreshold = navigationMode === 'driving' ? 30 : 15
          
          // 네비게이션 시작 후 최소 30초 경과했는지 확인
          const currentTime = Date.now()
          const elapsedTime = navigationStartTime ? currentTime - navigationStartTime : 0
          const hasEnoughTimeElapsed = elapsedTime > 30000 // 30초
          
          console.log(`거리 체크: ${distanceToTarget}m (임계값: ${arrivalThreshold}m), 경과시간: ${Math.round(elapsedTime/1000)}초`)
          
          if (distanceToTarget <= arrivalThreshold && hasEnoughTimeElapsed) {
            console.log(`목적지 도착 감지: ${distanceToTarget}m`)
            handleDestinationReached()
            return
          }
        }
      }

      // 경로 이탈 체크 (5초마다, 비용 절약)
      const now = new Date()
      if (now.getTime() - lastRouteCheck.getTime() > 5000) {
        setLastRouteCheck(now)
        if (selectedCafeId && cafes.length > 0) {
          const targetCafe = cafes.find(cafe => cafe.id === selectedCafeId)
          if (targetCafe) {
            checkRouteDeviation(newLocation, targetCafe)
          }
        }
      }
    }

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("위치 추적 오류:", error)
      setError("위치 추적 중 오류가 발생했습니다: " + error.message)
    }

    const watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    )
    
    setWatchId(watchId)
    setIsTrackingLocation(true)
  }

  // 실시간 위치 추적 중지
  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsTrackingLocation(false)
      console.log('실시간 위치 추적 중지됨')
    }
  }

  // 네비게이션 시작
  const startNavigation = (route: any) => {
    setIsNavigating(true)
    setNavigationStartTime(Date.now()) // 네비게이션 시작 시간 기록
    setCurrentRoute(route)
    setCurrentStep(0)
    setRemainingDistance(route.summary.distance)
    
    // 카카오 API에서 제공하는 정확한 예상시간 사용 (초 단위를 분 단위로 변환)
    const durationInMinutes = Math.round(route.summary.duration / 60)
    setRemainingTime(durationInMinutes)
    
    // API 응답 정보 로그 (디버깅용)
    console.log('카카오 길찾기 응답:', {
      distance: route.summary.distance + 'm',
      duration: route.summary.duration + '초',
      durationInMinutes: durationInMinutes + '분',
      mode: navigationMode
    })
    
    setIsDestinationReached(false)
    
    // 기존 타이머 정리
    if (autoEndTimer) {
      clearTimeout(autoEndTimer)
      setAutoEndTimer(null)
    }
    
    // 실시간 위치 추적 시작
    startLocationTracking()
    
    // 차량 모드에서 전체화면 네비게이션 시작시 경로도 함께 전달
    if (navigationMode === 'driving' && isFullscreenNav) {
      // 전체화면 모드에서는 현재 위치 중심으로 지도 설정
      if (map && userLocation) {
        const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
        map.setCenter(moveLatLon)
        map.setLevel(1) // 상세한 줌 레벨
      }
    }
    
    // 음성 안내 시작
    const modeText = navigationMode === 'driving' ? '차량' : '도보'
    speakInstruction(`${modeText} 네비게이션을 시작합니다`)
  }

  // 네비게이션 중지
  const stopNavigation = () => {
    setIsNavigating(false)
    setIsFullscreenNav(false)
    setNavigationStartTime(null) // 시작 시간 리셋
    setCurrentRoute(null)
    setCurrentStep(0)
    setIsDestinationReached(false)
    
    // 타이머 정리
    if (autoEndTimer) {
      clearTimeout(autoEndTimer)
      setAutoEndTimer(null)
    }
    
    // 실시간 위치 추적 중지
    stopLocationTracking()
    
    clearRoute()
    speakInstruction("안내를 종료합니다")
  }

  // 목적지 도착 처리
  const handleDestinationReached = () => {
    setIsDestinationReached(true)
    speakInstruction("목적지에 도착했습니다")
    
    // 자동 종료만 하고 홈으로 이동하지 않음
    const timer = setTimeout(() => {
      speakInstruction("안내를 종료합니다")
      stopNavigation()
      // 홈으로 자동 이동 제거 - 사용자가 직접 선택하도록 함
    }, 10000)
    
    setAutoEndTimer(timer)
  }

  // 음성 안내 함수 (차량 모드에서만 작동)
  const speakInstruction = (text: string) => {
    // 도보 모드에서는 음성 안내 제거
    if (navigationMode === 'walking') {
      console.log('도보 모드: 음성 안내 비활성화')
      return
    }
    
    // 차량 모드에서만 음성 안내
    if (navigationMode === 'driving' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel() // 이전 음성 중단
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // 턴바이턴 안내 텍스트 생성
  const getInstructionText = (route: any, stepIndex: number) => {
    if (!route || !route.sections || stepIndex >= route.sections.length) {
      // 목적지 도착 처리
      if (isNavigating && !isDestinationReached) {
        handleDestinationReached()
      }
      return "목적지에 도착했습니다"
    }
    
    const section = route.sections[stepIndex]
    const distance = Math.round(section.distance)
    
    // 목적지까지 20m 이하면 도착으로 간주
    if (distance <= 20 && !isDestinationReached) {
      handleDestinationReached()
      return "목적지에 도착했습니다"
    }
    
    // 거리에 따른 안내 방식 결정
    if (distance > 500) {
      return `직진 ${distance}m 계속 이동하세요`
    } else if (distance > 100) {
      return `${distance}m 앞에서 목적지 방향으로 이동하세요`
    } else if (distance > 50) {
      return `${distance}m 앞 목적지가 보입니다`
    } else if (distance > 20) {
      return `${distance}m 앞에 목적지가 있습니다`
    } else {
      return "목적지에 거의 도착했습니다"
    }
  }

  // 다음 안내 텍스트 생성 (더 현실적인 방향 안내)
  const getNextInstructionText = (route: any, stepIndex: number) => {
    if (!route || !route.sections || stepIndex + 1 >= route.sections.length) {
      return "목적지 도착 예정"
    }
    
    const nextSection = route.sections[stepIndex + 1]
    const distance = Math.round(nextSection.distance)
    
    // 다양한 방향 안내 패턴
    const directions = ['좌회전', '우회전', '직진', '유턴', '좌측 방향', '우측 방향']
    const randomDirection = directions[stepIndex % directions.length]
    
    if (distance > 1000) {
      return `${Math.round(distance/1000)}km 후 ${randomDirection}`
    } else if (distance > 100) {
      return `${distance}m 후 ${randomDirection}`
    } else {
      return `곧 ${randomDirection}`
    }
  }

  // 도보 네비게이션 시작
  const startWalkingNavigation = (cafe: CafeLocation) => {
    console.log('🚶‍♀️ 도보 네비게이션 시작:', cafe)
    
    // 기존 네비게이션이 실행 중이면 먼저 정리
    if (isNavigating) {
      console.log('기존 네비게이션 정리 중...')
      stopNavigation()
    }
    
    setNavigationMode('walking')
    setTargetCafe(cafe)
    setSelectedCafeId(cafe.id)
    setIsNavigating(true)
    onCafeSelect?.(cafe)
    
    // 도보 네비게이션 모드에서도 지도 확대
    if (map) {
      map.setLevel(3) // 도보용 확대 레벨
    }
    
    showDirectionsOnMap(cafe, 'walking')
  }

  // 차량 네비게이션 시작
  const startDrivingNavigation = (cafe: CafeLocation) => {
    console.log('🚗 차량 네비게이션 시작:', cafe)
    
    // 기존 네비게이션이 실행 중이면 먼저 정리
    if (isNavigating) {
      console.log('기존 네비게이션 정리 중...')
      stopNavigation()
    }
    
    setNavigationMode('driving')
    setTargetCafe(cafe)
    setSelectedCafeId(cafe.id)
    setIsNavigating(true)
    setIsFullscreenNav(true) // 차량 모드에서는 전체화면 네비게이션 활성화
    onCafeSelect?.(cafe)
    
    // 자동차 네비게이션 모드에서는 지도를 더 확대
    if (map) {
      map.setLevel(2) // 더 확대된 레벨
    }
    
    showDirectionsOnMap(cafe, 'driving')
  }

  // 지도 위에 실제 네비게이션 경로 표시
  const showDirectionsOnMap = async (cafe: CafeLocation, mode: 'walking' | 'driving' = 'walking') => {
    if (!userLocation || !map) return

    try {
      // 서버 사이드 API 라우트를 통해 카카오 API 호출
      const origin = { x: userLocation.lng, y: userLocation.lat }
      const destination = { x: cafe.longitude, y: cafe.latitude }
      
      // 자동차 모드에서는 우선순위를 시간 최적화로 설정
      const priority = mode === 'driving' ? 'TIME' : 'DISTANCE'
      
      const response = await fetch('/api/kakao-directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          priority,
          mode, // 도보/차량 모드 전달
          car_fuel: 'GASOLINE',
          car_hipass: false,
          alternatives: false,
          road_details: false
        })
      })

      if (!response.ok) {
        throw new Error(`길찾기 API 오류: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        setCurrentRoute(route)
        setDirections(route)
        
        // 경로 좌표 저장
        const routeCoords: any[] = []
        route.sections.forEach((section: any) => {
          section.roads.forEach((road: any) => {
            road.vertexes.forEach((vertex: number, index: number) => {
              if (index % 2 === 0) {
                const lng = vertex
                const lat = road.vertexes[index + 1]
                routeCoords.push(new window.kakao.maps.LatLng(lat, lng))
              }
            })
          })
        })
        setRoutePath(routeCoords)

        // 기존 경로 제거
        if (routeOverlay) {
          routeOverlay.setMap(null)
        }

        // 새 경로 표시
        const polyline = new window.kakao.maps.Polyline({
          path: routeCoords,
          strokeWeight: mode === 'driving' ? 8 : 5, // 자동차 모드에서는 더 굵은 선
          strokeColor: mode === 'driving' ? '#1E88E5' : '#FF5722', // 자동차는 파란색, 도보는 주황색
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        })

        polyline.setMap(map)
        setRouteOverlay(polyline)

        // 네비게이션 시작 시 현재 위치 중심으로 확대 (모든 모드)
        if (mode === 'driving') {
          map.setLevel(2) // 차량: 매우 확대
          map.setCenter(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng))
        } else {
          // 도보 모드: 차량보다는 덜 확대하지만 네비게이션 모드로 확대
          map.setLevel(3) // 도보: 적당히 확대
          map.setCenter(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng))
        }

        // 네비게이션 시작
        startNavigation(route)
        
        // 위치 추적 시작
        startLocationTracking()
        
        console.log(`${mode === 'driving' ? '자동차' : '도보'} 길찾기 성공:`, route)
      } else {
        throw new Error("경로를 찾을 수 없습니다.")
      }
    } catch (error) {
      console.error("길찾기 오류:", error)
      setError("길찾기 중 오류가 발생했습니다: " + (error as Error).message)
    }
  }

  // 두 지점 간 거리 계산 (미터)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return Math.round(R * c)
  }

  // 두 지점 간 방향각 계산 (0-360도)
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    const θ = Math.atan2(y, x)
    return (θ * 180 / Math.PI + 360) % 360 // 0-360도로 정규화
  }

  // 경로 이탈 체크 및 재계산
  const checkRouteDeviation = async (currentLocation: {lat: number, lng: number}, targetCafe: CafeLocation) => {
    if (!routePath || routePath.length === 0) return

    // 현재 위치에서 경로상 가장 가까운 지점까지의 거리 계산
    let minDistance = Infinity
    let closestPointIndex = 0

    routePath.forEach((point, index) => {
      const distance = getDistance(
        currentLocation.lat, currentLocation.lng,
        point.lat, point.lng
      )
      if (distance < minDistance) {
        minDistance = distance
        closestPointIndex = index
      }
    })

    // 경로에서 50미터 이상 벗어났으면 재계산
    if (minDistance > 50) {
      console.log('경로 이탈 감지! 새로운 경로를 계산합니다...')
      
      if (navigationMode === 'driving' && 'speechSynthesis' in window) {
        speakInstruction('경로에서 이탈했습니다. 새로운 경로를 계산중입니다.')
      }
      
      // 현재 위치에서 목적지까지 새 경로 계산
      await showDirectionsOnMap(targetCafe, navigationMode)
    }
  }

  // 카카오지도 앱으로 연결 (출발지: 내 위치, 목적지: 카페)
  const openKakaoMap = (cafe: CafeLocation) => {
    if (!userLocation) {
      alert('현재 위치를 찾을 수 없습니다. 위치 권한을 허용해주세요.')
      return
    }

    const startLat = userLocation.lat
    const startLng = userLocation.lng
    const endLat = cafe.latitude
    const endLng = cafe.longitude
    const destName = encodeURIComponent(`${cafe.store} ${cafe.store_name}`)
    
    // 카카오지도 앱 URL 스킴 (길찾기)
    const kakaoMapUrl = `kakaomap://route?sp=${startLat},${startLng}&ep=${endLat},${endLng}&by=FOOT`
    
    // 웹 카카오지도 길찾기 URL (출발지: 현재위치, 목적지: 카페)
    const webKakaoMapUrl = `https://map.kakao.com/link/to/${destName},${endLat},${endLng}?from=현재위치,${startLat},${startLng}`
    
    // 모바일에서는 앱 연결 시도, 실패하면 웹으로
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // 모바일: 앱에서 길찾기 시도
      window.location.href = kakaoMapUrl
      
      // 3초 후 앱이 안 열리면 웹으로 이동
      setTimeout(() => {
        window.open(webKakaoMapUrl, '_blank')
      }, 3000)
    } else {
      // 데스크톱: 웹 카카오지도로 바로 이동
      window.open(webKakaoMapUrl, '_blank')
    }
  }

  // 길찾기 함수 (지도 내에서 처리) - 이제 사용되지 않음
  const openDirections = (cafe: CafeLocation, mode: 'walking' | 'driving' = 'walking') => {
    if (mode === 'walking') {
      startWalkingNavigation(cafe)
    } else {
      startDrivingNavigation(cafe)
    }
  }

  // 클라이언트 사이드에서만 렌더링
  if (typeof window === 'undefined') {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-[#8D6E63]">지도 준비중...</p>
        </div>
      </div>
    )
  }

  if (!isLoaded || loading) {
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

  return (
    <div className="w-full">
      {/* 목적지 도착 알림 */}
      {isDestinationReached && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">목적지 도착!</h2>
            <p className="text-gray-600 mb-4">
              {autoEndTimer ? '10초 후 자동으로 안내가 종료됩니다.' : '안내가 종료되었습니다.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={stopNavigation}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                🚫 지금 종료
              </button>
              <button
                onClick={() => window.location.href = '/find_location'}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🗺️ 지도로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체화면 차량 네비게이션 */}
      {isFullscreenNav && isNavigating && navigationMode === 'driving' && !isDestinationReached && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* 헤더 */}
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">🚗 카핏네비</h1>
                <div className="text-sm opacity-90">
                  {Math.round(remainingDistance)}m • {remainingTime}분
                </div>
              </div>
            <button
              onClick={() => {
                setIsFullscreenNav(false)
                stopNavigation()
              }}
              className="text-white hover:text-red-300 text-xl"
            >
              ✕
            </button>
          </div>
          
          {/* 메인 지도 영역 */}
          <div className="flex-1 relative">
            <Map
              center={userLocation || { lat: 37.5665, lng: 126.9780 }}
              style={{ width: "100%", height: "100%" }}
              level={1} // 더 상세한 줌 레벨
              onCreate={(navMap) => {
                // 전체화면 네비게이션용 지도를 별도로 관리
                setMap(navMap) // 메인 map도 업데이트하여 실시간 위치 추적에 사용
                
                if (userLocation) {
                  const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
                  navMap.setCenter(moveLatLon)
                }
                
                // 전체화면 네비에서도 경로 표시
                if (routeOverlay) {
                  routeOverlay.setMap(navMap)
                }
              }}
            >
              {/* 사용자 현재 위치 마커 - 모드별 다른 디자인 */}
              {userLocation && (
                <MapMarker
                  position={userLocation}
                image={{
                  src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- 외부 원 (GPS 신호) -->
                      <circle cx="16" cy="16" r="14" fill="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" fill-opacity="0.3" stroke="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" stroke-width="1"/>
                      <!-- 내부 원 (위치) -->
                      <circle cx="16" cy="16" r="8" fill="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" stroke="#FFFFFF" stroke-width="2"/>
                      <!-- 중심점 -->
                      <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
                      <!-- 방향 표시 -->
                      <g transform="rotate(${userHeading} 16 16)">
                        ${navigationMode === 'driving' ? 
                          `<!-- 차량 모양 -->
                           <rect x="12" y="8" width="8" height="12" rx="2" fill="#FFFFFF" stroke="#2196F3" stroke-width="1"/>
                           <rect x="13" y="10" width="6" height="3" fill="#2196F3"/>
                           <circle cx="14" cy="18" r="1.5" fill="#2196F3"/>
                           <circle cx="18" cy="18" r="1.5" fill="#2196F3"/>` :
                          `<!-- 도보 화살표 -->
                           <path d="M16 6 L20 14 L16 12 L12 14 Z" fill="#FFFFFF" stroke="#2196F3" stroke-width="1"/>`
                        }
                      </g>
                    </svg>
                  `),
                  size: { width: 32, height: 32 }
                }}
              />
              )}
            </Map>
            
            {/* 메인 네비게이션 안내 카드 (왼쪽 위) */}
            <div className="absolute top-4 left-4 bg-white rounded-xl shadow-2xl p-4 max-w-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                  🧭
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">다음 안내</div>
                  <div className="font-bold text-lg text-gray-800">
                    {getInstructionText(currentRoute, currentStep)}
                  </div>
                </div>
              </div>
              
              {/* 거리 정보 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">남은 거리</span>
                </div>
                <span className="font-bold text-blue-600">
                  {Math.round(remainingDistance)}m
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">예상 시간</span>
                </div>
                <span className="font-bold text-green-600">
                  {remainingTime}분
                </span>
              </div>
              
              {/* 다음 단계 미리보기 */}
              {currentRoute && currentStep + 1 < currentRoute.sections?.length && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">그 다음</div>
                  <div className="text-sm text-gray-700">
                    {getNextInstructionText(currentRoute, currentStep)}
                  </div>
                </div>
              )}
            </div>
            
            {/* 속도계 (오른쪽 위) */}
            <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-xl">
              <div className="text-center mb-2">
                <div className="text-3xl font-bold">0</div>
                <div className="text-xs opacity-75">km/h</div>
              </div>
              {/* 위치 추적 상태 표시 */}
              <div className="flex items-center justify-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isTrackingLocation ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <div className="text-xs opacity-75">GPS</div>
              </div>
            </div>
          </div>
          
          {/* 하단 네비게이션 패널 */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl">
                  🚗
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xl mb-1">
                    {getInstructionText(currentRoute, currentStep)}
                  </div>
                  <div className="text-sm text-gray-300 flex items-center gap-4">
                    <span>📍 {getNextInstructionText(currentRoute, currentStep)}</span>
                    <span>⏱️ {remainingTime}분 남음</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => speakInstruction(getInstructionText(currentRoute, currentStep))}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full hover:from-purple-500 hover:to-blue-500 transition-all"
                >
                  🔊
                </button>
                <button
                  onClick={stopNavigation}
                  className="bg-red-600 p-3 rounded-full hover:bg-red-500 transition-all"
                  title="안내종료"
                >
                  🚫
                </button>
              </div>
            </div>
            
            {/* 진행률과 거리 정보 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행률: {Math.round(((currentRoute?.summary?.distance - remainingDistance) / currentRoute?.summary?.distance) * 100)}%</span>
                <span>남은 거리: {Math.round(remainingDistance)}m</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                  style={{ 
                    width: `${Math.round(((currentRoute?.summary?.distance - remainingDistance) / currentRoute?.summary?.distance) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex justify-between items-center">
          <span>{error}</span>
          {locationRequested && error.includes("거부") && (
            <button
              onClick={requestLocation}
              className="ml-3 px-3 py-1 bg-[#C8A27A] text-white rounded text-sm hover:bg-[#B08E6A] transition-colors"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
      
      {!userLocation && !error.includes("요청하고") && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded text-center">
          <div className="mb-3">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-medium mb-1">내 위치 정보가 필요해요!</h3>
            <p className="text-sm text-blue-600">주변 카페를 찾기 위해 현재 위치를 확인해주세요.</p>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 bg-[#C8A27A] text-white rounded hover:bg-[#B08E6A] transition-colors font-medium"
          >
            위치 정보 허용하기
          </button>
        </div>
      )}
      
      <div 
        className="relative"
        style={{ 
          touchAction: "none", // 지도 영역에서 브라우저 기본 터치 동작 방지
          userSelect: "none" // 텍스트 선택 방지로 드래그 개선
        }}
      >
        {/* 지도 컨트롤 버튼들 */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* 내 위치로 돌아가기 버튼 */}
          <button
            onClick={goToMyLocation}
            className="p-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="내 위치로 돌아가기"
          >
            <svg className="w-5 h-5 text-[#C8A27A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* 경로/네비게이션 제어 버튼 */}
          {routeOverlay && !isNavigating && (
            <button
              onClick={clearRoute}
              className="p-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="경로 지우기"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* 네비게이션 중지 버튼 */}
          {isNavigating && (
            <button
              onClick={stopNavigation}
              className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
              title="네비게이션 중지"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          )}
        </div>

        <Map
          center={userLocation || { lat: 37.5665, lng: 126.9780 }} // 기본값: 서울역
          style={{ 
            width: "100%", 
            // 길찾기 중일 때 지도 크기를 화면 절반으로 확대
            height: isNavigating ? 
              (window.innerWidth < 768 ? "50vh" : "50vh") : // 네비게이션 중: 화면 절반
              (window.innerWidth < 768 ? "250px" : "350px"), // 일반: 기존 크기
            touchAction: "auto" // 터치/마우스 이벤트 허용
          }}
          level={isNavigating ? 1 : 2} // 네비게이션 중일 때 더 확대
          maxLevel={4} // 줌아웃 더 제한
          draggable={true} // 지도 드래그 가능
          scrollwheel={true} // 마우스 휠 줌 가능
          disableDoubleClick={false} // 더블클릭 줌 가능
          keyboardShortcuts={true} // 키보드 단축키 허용
          onCreate={(map) => {
            setMap(map)
            // 웹에서 드래그 옵션 강제 활성화
            try {
              map.setDraggable(true)
              map.setZoomable(true)
              
              // 추가 옵션 설정 (카카오맵 네이티브 API)
              if (window.kakao && window.kakao.maps) {
                // 직접 메서드 호출로 안전하게 설정
                if (typeof (map as any).setDraggable === 'function') {
                  (map as any).setDraggable(true)
                }
                if (typeof (map as any).setScrollwheel === 'function') {
                  (map as any).setScrollwheel(true)
                }
                if (typeof (map as any).setKeyboardShortcuts === 'function') {
                  (map as any).setKeyboardShortcuts(true)
                }
              }
              
              console.log('지도 드래그 옵션이 활성화되었습니다.')
            } catch (error) {
              console.error('지도 옵션 설정 오류:', error)
            }
          }}
        >
          {/* 사용자 현재 위치 마커 - 모드별 다른 디자인 */}
          {userLocation && (
            <MapMarker
              position={userLocation}
            image={{
              src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 외부 원 (GPS 신호) -->
                  <circle cx="16" cy="16" r="14" fill="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" fill-opacity="0.3" stroke="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" stroke-width="1"/>
                  <!-- 내부 원 (위치) -->
                  <circle cx="16" cy="16" r="8" fill="${navigationMode === 'driving' ? '#2196F3' : '#2196F3'}" stroke="#FFFFFF" stroke-width="2"/>
                  <!-- 중심점 -->
                  <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
                  <!-- 방향 표시 -->
                  <g transform="rotate(${userHeading} 16 16)">
                    ${navigationMode === 'driving' ? 
                      `<!-- 차량 모양 -->
                       <rect x="12" y="8" width="8" height="12" rx="2" fill="#FFFFFF" stroke="#2196F3" stroke-width="1"/>
                       <rect x="13" y="10" width="6" height="3" fill="#2196F3"/>
                       <circle cx="14" cy="18" r="1.5" fill="#2196F3"/>
                       <circle cx="18" cy="18" r="1.5" fill="#2196F3"/>` :
                      `<!-- 도보 화살표 -->
                       <path d="M16 6 L20 14 L16 12 L12 14 Z" fill="#FFFFFF" stroke="#2196F3" stroke-width="1"/>`
                    }
                  </g>
                </svg>
              `),
              size: { width: 32, height: 32 }
            }}
          />
          )}
          
          {/* 카페 마커들 - 각 브랜드 로고 포함 */}
          {cafes.map((cafe) => {
            const isSelected = selectedCafeId === cafe.id
            const opacity = 1.0 // 지도에서는 모든 마커를 선명하게 표시
            const markerSize = isSelected ? { width: 32, height: 40 } : { width: 28, height: 36 }
            const circleRadius = isSelected ? 14 : 12
            const strokeWidth = isSelected ? 3 : 1
            const strokeColor = isSelected ? "#C8A27A" : "#E0E0E0"
            
            return (
              <MapMarker
                key={cafe.id}
                position={{ lat: cafe.latitude, lng: cafe.longitude }}
                title={`${cafe.store} ${cafe.store_name}`}
                onClick={() => goToCafe(cafe)}
                image={{
                  src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
                    <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="0 0 ${markerSize.width} ${markerSize.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${opacity}">
                      <!-- 흰색 원형 배경 -->
                      <circle cx="${markerSize.width/2}" cy="${circleRadius + 2}" r="${circleRadius}" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
                      <!-- 화살표 꼬리 -->
                      <path d="M${markerSize.width/2} ${circleRadius * 2 + 2} L${markerSize.width/2} ${markerSize.height - 4} L${markerSize.width/2} ${circleRadius * 2 + 2} Z" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="1"/>
                      <path d="M${markerSize.width/2} ${circleRadius * 2 + 2} L${markerSize.width/2 - 4} ${markerSize.height - 2} L${markerSize.width/2 + 4} ${markerSize.height - 2} Z" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="1"/>
                      <!-- 카페 브랜드 로고 텍스트 -->
                      <text x="${markerSize.width/2}" y="${circleRadius + 6}" text-anchor="middle" fill="${getMarkerColor(cafe.store || cafe.store_name)}" font-size="${isSelected ? 18 : 16}" font-weight="bold" font-family="Arial, sans-serif">${getCafeLogoText(cafe.store || cafe.store_name)}</text>
                    </svg>
                  `),
                  size: markerSize,
                  options: {
                    offset: { x: markerSize.width/2, y: markerSize.height }
                  }
                }}
              />
                         )
           })}
          </Map>
      </div>
      
      {/* 네비게이션 정보 패널 (도보 모드 전용) */}
      {isNavigating && currentRoute && navigationMode === 'walking' && !isFullscreenNav && (
        <div className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🚶‍♀️ 도보 네비게이션
              {/* GPS 상태 표시 */}
              <div className="flex items-center gap-1 ml-2">
                <div className={`w-2 h-2 rounded-full ${isTrackingLocation ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-xs opacity-75">GPS</span>
              </div>
            </h3>
            <button
              onClick={stopNavigation}
              className="text-white hover:text-red-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {/* 현재 안내 */}
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold mb-2 flex items-center gap-2">
                🧭 {getInstructionText(currentRoute, currentStep)}
              </div>
              <div className="text-sm opacity-90 mb-2">
                {getNextInstructionText(currentRoute, currentStep)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>남은 거리: {Math.round(remainingDistance)}m</span>
                <span>예상 시간: {remainingTime}분</span>
              </div>
            </div>
            
            {/* 네비게이션 컨트롤 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => speakInstruction(getInstructionText(currentRoute, currentStep))}
                className="bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                🔊 다시 듣기
              </button>
              <button
                onClick={stopNavigation}
                className="bg-red-500/80 px-3 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
              >
                🚫 안내종료
              </button>
              <button
                onClick={() => window.location.href = '/find_location'}
                className="bg-gray-500/80 px-3 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm font-medium"
              >
                🗺️ 지도로
              </button>
            </div>
            

          </div>
        </div>
      )}
      
      {/* 카페 목록 */}
      <div className="mt-4">
        <h3 className="text-lg font-medium text-[#5D4037] mb-3">
          주변 카페 ({cafes.length}개)
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cafes
            .sort((a, b) => {
              // 선택된 카페를 맨 위로 정렬
              if (selectedCafeId === a.id) return -1
              if (selectedCafeId === b.id) return 1
              return 0
            })
            .map((cafe) => (
            <div
              key={cafe.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                selectedCafeId === cafe.id 
                  ? 'bg-[#F8F6F2] border-[#C8A27A] shadow-lg opacity-100' 
                  : selectedCafeId !== null 
                    ? 'bg-white border-[#E6D9CC] hover:bg-[#F8F6F2] opacity-50' 
                    : 'bg-white border-[#E6D9CC] hover:bg-[#F8F6F2] opacity-100'
              }`}
              onClick={() => goToCafe(cafe)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img 
                      src={getCafeLogoUrl(cafe.store || cafe.store_name)}
                      alt={cafe.store_name}
                      className="w-4 h-4 flex-shrink-0 object-contain"
                      onError={(e) => {
                        // 로고 로드 실패시 색상 원으로 대체
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const colorDiv = document.createElement('div')
                          colorDiv.className = 'w-3 h-3 rounded-full flex-shrink-0'
                          colorDiv.style.backgroundColor = getMarkerColor(cafe.store_name)
                          parent.insertBefore(colorDiv, target)
                        }
                      }}
                    />
                    <span className="font-medium text-[#5D4037] break-words">
                      {cafe.store} {cafe.store_name}
                      {cafe.store_type && (
                        <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1 rounded">
                          {cafe.store_type}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-[#8D6E63] mb-1 line-clamp-1">{cafe.address}</p>
                  {cafe.distance !== undefined && (
                    <p className="text-xs text-[#C8A27A] font-medium mb-1">
                      📍 직선거리: {cafe.distance}m ({Math.round(cafe.distance / 80)}분)
                    </p>
                  )}
                  {cafe.business_hours && (
                    <p className="text-xs text-[#B08E6A]">
                      🕒 영업시간: {cafe.business_hours}
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500 font-medium mb-2 text-center">길찾기</div>
                  {/* 도보/차량 버튼을 한 줄로 */}
                  <div className="flex gap-2 mb-3">
                    <button 
                      className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation()
                        startWalkingNavigation(cafe)
                      }}
                    >
                      🚶‍♀️ 도보
                    </button>
                    <button 
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation()
                        startDrivingNavigation(cafe)
                      }}
                    >
                      🚗 차량
                    </button>
                  </div>
                  {/* 카카오지도 연결 버튼 */}
                  <button 
                    className="w-full px-3 py-2 bg-yellow-400 text-black text-xs rounded hover:bg-yellow-500 transition-colors font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      openKakaoMap(cafe)
                    }}
                  >
                    🗺️ 카카오지도
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 