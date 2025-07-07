import type { NextApiRequest, NextApiResponse } from 'next'

interface DirectionsRequest {
  origin: { x: number; y: number }
  destination: { x: number; y: number }
  priority?: string
  mode?: 'walking' | 'driving'
  car_fuel?: string
  car_hipass?: boolean
  alternatives?: boolean
  road_details?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    origin, 
    destination, 
    priority = 'RECOMMEND',
    mode = 'driving',
    car_fuel,
    car_hipass,
    alternatives = false,
    road_details = false 
  }: DirectionsRequest = req.body

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' })
  }

  try {
    // URL 파라미터 구성
    const params = new URLSearchParams({
      origin: `${origin.x},${origin.y}`,
      destination: `${destination.x},${destination.y}`,
      priority,
      alternatives: String(alternatives),
      road_details: String(true) // 상세 도로 정보 항상 요청
    })

    // 차량 관련 옵션 (제공된 경우에만 추가)
    if (car_fuel) params.append('car_fuel', car_fuel)
    if (car_hipass !== undefined) params.append('car_hipass', String(car_hipass))

    const response = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.KAKAO_NAVI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`)
    }

    const data = await response.json()
    
    // 도보 모드일 때 예상시간 보정
    if (mode === 'walking' && data.routes && data.routes.length > 0) {
      data.routes.forEach((route: any) => {
        // 카카오 API는 차량용이므로 도보 시간을 별도 계산
        // 평균 도보 속도 4km/h 기준으로 재계산
        const distanceKm = route.summary.distance / 1000
        const walkingTimeSeconds = (distanceKm / 4) * 3600 // 4km/h = 3600초/km * 거리
        route.summary.duration = Math.round(walkingTimeSeconds)
      })
    }
    
    res.status(200).json(data)
    
  } catch (error) {
    console.error('Kakao Directions API error:', error)
    res.status(500).json({ 
      error: 'Failed to get directions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 