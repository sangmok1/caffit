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

    // 1. 모든 테이블 조회
    const [tables] = await connection.execute("SHOW TABLES")
    console.log('테이블 목록:', tables)

    // 2. coffee로 시작하는 테이블 찾기
    const coffeeTableQuery = "SHOW TABLES LIKE 'coffee%'"
    const [coffeeTables] = await connection.execute(coffeeTableQuery)
    console.log('coffee 테이블들:', coffeeTables)

    // 3. coffee_location 테이블이 존재하는지 확인
    const checkTableQuery = "SHOW TABLES LIKE 'coffee_location'"
    const [locationTable] = await connection.execute(checkTableQuery)
    console.log('coffee_location 테이블:', locationTable)

    // 4. 만약 테이블이 존재한다면 구조 확인
    let tableStructure = null
    let sampleData = null
    
    if ((locationTable as any[]).length > 0) {
      const [structure] = await connection.execute("DESCRIBE coffee_location")
      tableStructure = structure
      
      // 샘플 데이터 1개
      const [sample] = await connection.execute("SELECT * FROM coffee_location LIMIT 1")
      sampleData = sample
    }

    await connection.end()

    res.status(200).json({
      success: true,
      message: 'DB 연결 성공',
      allTables: tables,
      coffeeTables: coffeeTables,
      locationTableExists: (locationTable as any[]).length > 0,
      tableStructure: tableStructure,
      sampleData: sampleData
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