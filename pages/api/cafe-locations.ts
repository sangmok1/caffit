import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCafeLocations, fetchAllCafeLocations } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    // 모든 카페 조회인 경우
    if (req.query.all === 'true') {
      const locations = await fetchAllCafeLocations()
      res.status(200).json({ success: true, data: locations, total: locations.length })
      return
    }

    // 위치 기반 검색
    const latitude = parseFloat(req.query.latitude as string)
    const longitude = parseFloat(req.query.longitude as string)
    const radiusKm = parseFloat(req.query.radiusKm as string) || 1
    const store = (req.query.store as string) || ""

    // 필수 파라미터 검증
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ 
        success: false, 
        error: 'latitude와 longitude 파라미터가 필요합니다' 
      })
      return
    }

    const locations = await fetchCafeLocations({
      latitude,
      longitude,
      radiusKm,
      store
    })

    res.status(200).json({ 
      success: true, 
      data: locations, 
      total: locations.length,
      searchParams: { latitude, longitude, radiusKm, store }
    })

  } catch (error) {
    console.error('Cafe locations API error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cafe locations', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
} 