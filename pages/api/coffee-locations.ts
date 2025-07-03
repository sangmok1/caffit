import type { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'

interface CoffeeLocation {
  id: number
  store_name: string
  lat: number
  lon: number
  store_type: string
  address: string
  store: string
}

interface LocationRequest {
  lat: number
  lng: number
  radius?: number // 미터 단위, 기본값 500m
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lat, lng, radius = 500 }: LocationRequest = req.body

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' })
  }

  try {
    // DB 연결
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    })

    // 500m 반경 계산 (위도/경도 차이)
    // 1도 ≈ 111km이므로 500m = 0.0045도 (위도)
    // 경도는 위치에 따라 다르지만 한국에서는 약 0.006도
    const latDiff = radius / 111000 // 위도 차이
    const lngDiff = radius / (111000 * Math.cos(lat * Math.PI / 180)) // 경도 차이 (위도 보정)

    const query = `
      SELECT 
        store_name,
        lat,
        lon,
        store_type,
        address,
        store
      FROM coffee_location 
      WHERE lat BETWEEN ? AND ? 
      AND lon BETWEEN ? AND ?
      ORDER BY store_name
    `

    const [rows] = await connection.execute(query, [
      lat - latDiff,  // 최소 위도
      lat + latDiff,  // 최대 위도
      lng - lngDiff,  // 최소 경도
      lng + lngDiff   // 최대 경도
    ])

    await connection.end()

    // 실제 직선거리로 필터링 (더 정확한 계산)
    const locations = (rows as any[]).filter((location, index) => {
      const distance = calculateDistance(lat, lng, location.lat, location.lon)
      return distance <= radius
    }).map((location, index) => ({
      id: index + 1, // 간단하게 인덱스 기반 ID 생성
      store_name: location.store_name,
      branch_name: location.store_name, // 매장명을 branch_name으로도 사용
      latitude: location.lat,
      longitude: location.lon,
      address: location.address,
      store_type: location.store_type,
      store: location.store,
      distance: Math.round(calculateDistance(lat, lng, location.lat, location.lon))
    }))

    // 거리순 정렬
    locations.sort((a, b) => a.distance - b.distance)

    res.status(200).json({
      locations,
      count: locations.length,
      center: { lat, lng },
      radius
    })

  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch coffee locations',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// 두 지점 간 거리 계산 (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // 미터 단위
} 