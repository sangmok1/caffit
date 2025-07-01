import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCoffeeMenus } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 최대값 요청인 경우
  if (req.query.getMaxValues === 'true') {
    try {
      const { data } = await fetchCoffeeMenus({ page: 1, pageSize: 10000 }) // 모든 데이터 가져오기
      const maxKcal = Math.max(...data.map(item => item.kcal || 0))
      const maxSugar = Math.max(...data.map(item => item.sugars || 0))
      res.status(200).json({ maxKcal, maxSugar })
      return
    } catch (error) {
      console.error('Max values API error:', error)
      res.status(500).json({ error: 'Failed to fetch max values' })
      return
    }
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const search = (req.query.search as string) || ""
  const store = (req.query.store as string) || ""
  const kcalMin = req.query.kcalMin ? Number(req.query.kcalMin) : undefined
  const kcalMax = req.query.kcalMax ? Number(req.query.kcalMax) : undefined
  const sugarMin = req.query.sugarMin ? Number(req.query.sugarMin) : undefined
  const sugarMax = req.query.sugarMax ? Number(req.query.sugarMax) : undefined
  const sortField = (req.query.sortField as string) || "eng_name"
  const sortDirection = (req.query.sortDirection as string) || "asc"
  try {
    const { data, total } = await fetchCoffeeMenus({
      page, pageSize, search, store, kcalMin, kcalMax, sugarMin, sugarMax, sortField, sortDirection
    })
    res.status(200).json({ data, total })
  } catch (error) {
    console.error('Coffee menus API error:', error)
    res.status(500).json({ error: 'Failed to fetch coffee menus', details: error instanceof Error ? error.message : 'Unknown error' })
  }
} 