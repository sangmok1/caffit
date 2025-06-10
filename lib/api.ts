import mysql from "mysql2/promise"
import type { Coffee } from "@/types/coffee"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
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
      `SELECT name, eng_name, kcal, caffeine, sodium, sugars, store FROM coffee_info ${where} ORDER BY ${orderBySql} ${orderDir} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    // 전체 개수 쿼리
    const [countRows] = await connection.query(
      `SELECT COUNT(*) as total FROM coffee_info ${where}`,
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
      protein: 0,
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
        query = "SELECT * FROM coffee_info WHERE store = ? AND eng_name = ? LIMIT 1"
        params = [store, eng_name]
      } else if (!isNaN(Number(id))) {
        // If it's a numeric ID
        query = "SELECT * FROM coffee_info WHERE id = ? LIMIT 1"
        params = [id]
      } else {
        // If it's just the eng_name
        query = "SELECT * FROM coffee_info WHERE eng_name = ? LIMIT 1"
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
