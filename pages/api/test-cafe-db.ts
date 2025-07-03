import type { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('DB 연결 시도...')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    })

    console.log('DB 연결 성공!')

    // 1. coffee_location 테이블 구조 확인
    const [structure] = await connection.execute("DESCRIBE coffee_location")
    console.log('테이블 구조:', structure)

    // 2. 데이터 개수 확인
    const [countResult] = await connection.execute("SELECT COUNT(*) as total FROM coffee_location")
    console.log('데이터 개수:', countResult)

    // 3. 샘플 데이터 5개
    const [sampleData] = await connection.execute("SELECT * FROM coffee_location LIMIT 5")
    console.log('샘플 데이터:', sampleData)

    // 4. 컬럼 확인 후 브랜드별 개수 (brand 컬럼이 있는 경우에만)
    let brandCount = null
    try {
      const [brandResult] = await connection.execute("SELECT store, COUNT(*) as count FROM coffee_location GROUP BY store LIMIT 10")
      brandCount = brandResult
    } catch (brandError) {
      console.log('브랜드/스토어 컬럼 확인 실패:', brandError)
      brandCount = { error: 'brand 또는 store 컬럼이 없습니다' }
    }

    await connection.end()

    res.status(200).json({
      success: true,
      message: 'coffee_location 테이블 조회 성공',
      tableStructure: structure,
      totalCount: countResult,
      sampleData: sampleData,
      brandCount: brandCount
    })

  } catch (error) {
    console.error('DB 테스트 오류:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    })
  }
} 