export interface Coffee {
  id: string
  name: string
  eng_name: string
  category: string
  kcal: number
  caffeine: number
  sodium: number
  sugars: number
  protein: number
  trans_fat: number
  sat_fat: number
  store: string
  temperature: string
  description: string
}

// 카페 위치 정보 타입 추가
export interface CafeLocation {
  id: number
  name: string
  brand: string
  address: string
  phone: string
  latitude: number
  longitude: number
  opening_hours?: string
  created_at?: string
  updated_at?: string
} 