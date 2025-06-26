import { NextApiRequest, NextApiResponse } from 'next'
import { fetchMaxValues } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const maxValues = await fetchMaxValues()
    res.status(200).json(maxValues)
  } catch (error) {
    console.error('Error fetching max values:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 