import mysql from "mysql2/promise"
import type { Coffee, CafeLocation } from "@/types/coffee"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
}

// Create a connection pool
const pool = mysql.createPool(dbConfig)

// Function to fetch coffee menus from the database
export async function fetchCoffeeMenus({
  page = 1,
  pageSize = 20,
  search = "",
  store = "",
  kcalMin,
  kcalMax,
  sugarMin,
  sugarMax,
  sortField = "eng_name",
  sortDirection = "asc"
}: {
  page?: number,
  pageSize?: number,
  search?: string,
  store?: string,
  kcalMin?: number,
  kcalMax?: number,
  sugarMin?: number,
  sugarMax?: number,
  sortField?: string,
  sortDirection?: string
}): Promise<{ data: Coffee[], total: number }> {
  const offset = (page - 1) * pageSize
  const connection = await pool.getConnection()
  try {
    let where = "WHERE 1=1"
    const params: any[] = []
    if (search) {
      where += " AND (name LIKE ? OR eng_name LIKE ?)"
      params.push(`%${search}%`, `%${search}%`)
    }
    if (store) {
      where += " AND store = ?"
      params.push(store)
    }
    if (kcalMin !== undefined) {
      where += " AND kcal >= ?"
      params.push(kcalMin)
    }
    if (kcalMax !== undefined) {
      where += " AND kcal <= ?"
      params.push(kcalMax)
    }
    if (sugarMin !== undefined) {
      where += " AND sugars >= ?"
      params.push(sugarMin)
    }
    if (sugarMax !== undefined) {
      where += " AND sugars <= ?"
      params.push(sugarMax)
    }
    // 정렬 필드 화이트리스트
    const allowedSortFields = ["store", "name", "eng_name", "kcal", "sugars", "sodium", "caffeine", "health_score"]
    const orderDir = sortDirection === "desc" ? "DESC" : "ASC"
    let orderBySql = "eng_name"
    if (sortField === "health_score") {
      orderBySql = `((100-LEAST(sugars/25,1)*100) + (100-LEAST(caffeine/200,1)*100) + (100-LEAST(sodium/300,1)*100))/3`
    } else if (allowedSortFields.includes(sortField)) {
      orderBySql = sortField
    }
    // 데이터 쿼리
    const [rows] = await connection.query(
      `SELECT DISTINCT name, eng_name, kcal, caffeine, sodium, sugars, protein, store FROM coffee_info ${where} ORDER BY ${orderBySql} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    // 전체 개수 쿼리
    const [countRows] = await connection.query(
      `SELECT COUNT(DISTINCT name, eng_name, kcal, caffeine, sodium, sugars, protein, store) as total FROM coffee_info ${where}`,
      params
    )
    const total = (countRows as any[])[0]?.total || 0;
    const coffees = (rows as any[]).map((row) => ({
      id: `${row.store}-${row.eng_name}`,
      name: row.name || "",
      eng_name: row.eng_name || "",
      category: "",
      kcal: Number(row.kcal) || 0,
      caffeine: Number(row.caffeine) || 0,
      sodium: Number(row.sodium) || 0,
      sugars: Number(row.sugars) || 0,
      protein: Number(row.protein) || 0,
      trans_fat: 0,
      sat_fat: 0,
      store: row.store || "",
      temperature: "",
      description: "",
    }))
    return { data: coffees, total }
  } finally {
    connection.release()
  }
}

// Function to fetch max values for filters
export async function fetchMaxValues(): Promise<{ maxKcal: number, maxSugars: number }> {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(
      "SELECT MAX(kcal) as maxKcal, MAX(sugars) as maxSugars FROM coffee_info"
    )
    const result = (rows as any[])[0]
    return {
      maxKcal: Number(result.maxKcal) || 800,
      maxSugars: Number(result.maxSugars) || 50
    }
  } finally {
    connection.release()
  }
}

// Function to fetch detailed coffee information
export async function fetchCoffeeDetails(id: string): Promise<Coffee> {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection()

    try {
      // Check if id is a number or a string identifier
      let query
      let params

      if (id.includes("-")) {
        // If it's a composite ID like "Starbucks-Americano"
        const [store, ...nameParts] = id.split("-")
        const eng_name = nameParts.join("-")
        query = "SELECT DISTINCT * FROM coffee_info WHERE store = ? AND eng_name = ? LIMIT 1"
        params = [store, eng_name]
      } else if (!isNaN(Number(id))) {
        // If it's a numeric ID
        query = "SELECT DISTINCT * FROM coffee_info WHERE id = ? LIMIT 1"
        params = [id]
      } else {
        // If it's just the eng_name
        query = "SELECT DISTINCT * FROM coffee_info WHERE eng_name = ? LIMIT 1"
        params = [id]
      }

      // Execute the query
      const [rows] = await connection.query(query, params)

      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as any
        return {
          id: row.id?.toString() || `${row.store}-${row.eng_name}`,
          name: row.name || "",
          eng_name: row.eng_name || "",
          category: row.category || "",
          kcal: Number(row.kcal) || 0,
          caffeine: Number(row.caffeine) || 0,
          sodium: Number(row.sodium) || 0,
          sugars: Number(row.sugars) || 0,
          protein: Number(row.protein) || 0,
          trans_fat: Number(row.trans_fat) || 0,
          sat_fat: Number(row.sat_fat) || 0,
          store: row.store || "",
          temperature: row.temperature || "",
          description: row.description || "",
        }
      } else {
        throw new Error("Coffee not found")
      }
    } finally {
      // Release the connection back to the pool
      connection.release()
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch coffee details from database")
  }
}

// Function to fetch cafe locations within radius
export async function fetchCafeLocations({
  latitude,
  longitude,
  radiusKm = 1,
  store = ""
}: {
  latitude: number,
  longitude: number,
  radiusKm?: number,
  store?: string
}): Promise<CafeLocation[]> {
  const connection = await pool.getConnection()
  try {
    // 위도 1km ≈ 0.009도, 경도 1km ≈ 0.011도 (한국 기준)
    const latDelta = (radiusKm * 0.009)
    const lngDelta = (radiusKm * 0.011)
    
    let query = `
      SELECT * FROM coffee_location 
      WHERE lat BETWEEN ? AND ? 
      AND lon BETWEEN ? AND ?
    `
    const params: any[] = [
      latitude - latDelta,
      latitude + latDelta,
      longitude - lngDelta,
      longitude + lngDelta
    ]

    if (store) {
      query += " AND store = ?"
      params.push(store)
    }

    query += " ORDER BY ((lat - ?) * (lat - ?) + (lon - ?) * (lon - ?)) ASC"
    params.push(latitude, latitude, longitude, longitude)

    const [rows] = await connection.query(query, params)
    
    return (rows as any[]).map((row, index) => ({
      id: index + 1, // id 컬럼이 없으므로 인덱스 사용
      name: row.store_name || "",
      brand: row.store || "",
      address: row.address || "",
      phone: "", // phone 컬럼이 없음
      latitude: Number(row.lat),
      longitude: Number(row.lon),
      opening_hours: "", // opening_hours 컬럼이 없음
      created_at: "",
      updated_at: "",
    }))
  } finally {
    connection.release()
  }
}

// Function to fetch all cafe locations (for testing)
export async function fetchAllCafeLocations(): Promise<CafeLocation[]> {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query("SELECT * FROM coffee_location ORDER BY store, store_name")
    
    return (rows as any[]).map((row, index) => ({
      id: index + 1, // id 컬럼이 없으므로 인덱스 사용
      name: row.store_name || "",
      brand: row.store || "",
      address: row.address || "",
      phone: "", // phone 컬럼이 없음
      latitude: Number(row.lat),
      longitude: Number(row.lon),
      opening_hours: "", // opening_hours 컬럼이 없음
      created_at: "",
      updated_at: "",
    }))
  } finally {
    connection.release()
  }
}
