import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchCoffeeDetails } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing or invalid id' })
    return
  }
  try {
    const data = await fetchCoffeeDetails(id)
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coffee details' })
  }
} 