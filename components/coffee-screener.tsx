"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Coffee as CoffeeIcon, Search, Filter, ArrowUpDown, Info } from "lucide-react"
import type { Coffee } from "@/types/coffee"
import Link from "next/link"

interface CafeItem {
  name: string;
  store: string;
  color: string;
  image?: string;
  emoji?: string;
}

const mainCafes: CafeItem[] = [
  { name: "Starbucks", store: "Starbucks", color: "#00704A", image: "/starbucks-logo.png" },
  { name: "Gong Cha", store: "gongcha", color: "#8B0000", image: "/gongcha-logo.png" },
  { name: "MEGA", store: "Mega", color: "#4A90E2", image: "/mega-logo.png" },
  { name: "Compose", store: "Compose", color: "#8B4513", image: "/compose-logo.png" },
]

const additionalCafes: CafeItem[] = [
  { name: "Paiks", store: "Paiks", color: "#191970", image: "/paiks-logo.png" },
  { name: "Hollys", store: "Hollys", color: "#FF4444", image: "/hollys-logo.png" },
]

const cafeSortOrder = ["Starbucks", "EDIYA", "Paik's", "Gong Cha", "MEGA"]

const PAGE_SIZE = 20

// 툴팁 컴포넌트 추가
function Tooltip({ content, children }: { content: React.ReactNode, children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          zIndex: 20,
          top: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          color: '#5D4037',
          border: '1px solid #E0C9A6',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          padding: 16,
          minWidth: 260,
          maxWidth: 340,
          fontSize: 13,
          whiteSpace: 'pre-line',
        }}>
          {content}
        </div>
      )}
    </span>
  )
}

function CoffeeScreener() {
  const searchParams = useSearchParams()
  
  // 상태
  const [coffees, setCoffees] = useState<Coffee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null)
  const [showMoreCafes, setShowMoreCafes] = useState(false)
  const [kcalRange, setKcalRange] = useState([0, 1000])
  const [sugarRange, setSugarRange] = useState([0, 100])
  const [maxKcal, setMaxKcal] = useState(1000)
  const [maxSugar, setMaxSugar] = useState(100)
  const [debouncedKcalRange, setDebouncedKcalRange] = useState([0, 1000])
  const [debouncedSugarRange, setDebouncedSugarRange] = useState([0, 100])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFixedHeader, setShowFixedHeader] = useState(false)
  const [columnWidths, setColumnWidths] = useState<number[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // URL 파라미터에서 초기 필터 설정
  useEffect(() => {
    if (searchParams) {
      const storeParam = searchParams.get('store')
      if (storeParam) {
        setSelectedCafe(storeParam)
      }
    }
  }, [searchParams])

  // 최대값 가져오기 (최초 로드시)
  useEffect(() => {
    const fetchMaxValues = async () => {
      try {
        const res = await fetch('/api/coffee-menus?getMaxValues=true')
        const result = await res.json()
        if (result.maxKcal) {
          setMaxKcal(result.maxKcal)
          setKcalRange([0, result.maxKcal])
          setDebouncedKcalRange([0, result.maxKcal])
        }
        if (result.maxSugar) {
          setMaxSugar(result.maxSugar)
          setSugarRange([0, result.maxSugar])
          setDebouncedSugarRange([0, result.maxSugar])
        }
      } catch (err) {
        console.error('Failed to fetch max values:', err)
      }
    }
    fetchMaxValues()
  }, [])

  // 디바운스 로직
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKcalRange(kcalRange)
    }, 800)
    return () => clearTimeout(timer)
  }, [kcalRange])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSugarRange(sugarRange)
    }, 800)
    return () => clearTimeout(timer)
  }, [sugarRange])

  // 데이터 fetch
  useEffect(() => {
    const loadCoffees = async () => {
      try {
        // 초기 로딩이 아닐 때는 filterLoading만 사용
        const isInitialLoad = coffees.length === 0 && !searchTerm && !selectedCafe
        const loadingStartTime = Date.now()
        
        if (isInitialLoad) {
          setLoading(true)
        } else {
          setFilterLoading(true)
        }
        
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          sortField,
          sortDirection,
        })
        if (searchTerm) params.append('search', searchTerm)
        if (selectedCafe) params.append('store', selectedCafe)
        if (debouncedKcalRange[0] > 0) params.append('kcalMin', String(debouncedKcalRange[0]))
        if (debouncedKcalRange[1] < maxKcal) params.append('kcalMax', String(debouncedKcalRange[1]))
        if (debouncedSugarRange[0] > 0) params.append('sugarMin', String(debouncedSugarRange[0]))
        if (debouncedSugarRange[1] < maxSugar) params.append('sugarMax', String(debouncedSugarRange[1]))
        const res = await fetch(`/api/coffee-menus?${params.toString()}`)
        const result = await res.json()
        setCoffees(result.data)
        setTotal(result.total)
        
        // 최소 500ms는 로딩을 보여주기
        const loadingTime = Date.now() - loadingStartTime
        const minLoadingTime = 500
        const remainingTime = Math.max(0, minLoadingTime - loadingTime)
        
        setTimeout(() => {
          if (isInitialLoad) {
            setLoading(false)
          } else {
            setFilterLoading(false)
          }
        }, remainingTime)
        
      } catch (err) {
        setError("Failed to load coffee menu data. Please try again later.")
        setLoading(false)
        setFilterLoading(false)
      }
    }
    loadCoffees()
  }, [page, searchTerm, selectedCafe, debouncedKcalRange, debouncedSugarRange, sortField, sortDirection, maxKcal, maxSugar])

  // 스크롤 이벤트로 고정 헤더 표시/숨김 처리 + 컬럼 너비 동기화
  useEffect(() => {
    const updateColumnWidths = () => {
      const mainTable = document.getElementById('main-table')
      if (mainTable) {
        const headerCells = mainTable.querySelectorAll('thead th')
        const widths = Array.from(headerCells).map(cell => (cell as HTMLElement).offsetWidth)
        setColumnWidths(widths)
      }
    }

    const handleScroll = () => {
      const mainTable = document.getElementById('main-table')
      if (mainTable) {
        const tableRect = mainTable.getBoundingClientRect()
        const shouldShow = tableRect.top < -20
        
        if (shouldShow && !showFixedHeader) {
          updateColumnWidths()
        }
        
        setShowFixedHeader(shouldShow)
      }
    }

    const handleResize = () => {
      if (showFixedHeader) {
        updateColumnWidths()
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(updateColumnWidths, 100)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [showFixedHeader])

  const handleSort = (field: string) => {
    // 현재 스크롤 위치 저장
    const currentScrollY = window.scrollY
    
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    if (page !== 1) setPage(1)
    
    // 정렬 후 스크롤 위치 복원 (고정 헤더가 보이는 상태라면 위치 유지)
    setTimeout(() => {
      if (showFixedHeader) {
        window.scrollTo(0, currentScrollY)
      }
    }, 100)
  }

  const getCafeColor = (storeName: string): string => {
    const cafeMap: { [key: string]: string } = {
      'Starbucks': '#00704A', // 스타벅스 녹색
      'starbucks': '#00704A', // 스타벅스 녹색 (소문자)
      'gongcha': '#8B0000',   // 공차 어두운 레드
      'Mega': '#FFD700',      // 메가커피 노랑
      'Compose': 'linear-gradient(to bottom, #FFD700 50%, #8B4513 50%)', // 컴포즈 그라데이션 (노랑+갈색)
      'Paiks': 'linear-gradient(to bottom, #FFD700 50%, #191970 50%)',   // 빽다방 그라데이션 (노랑+남색)
      'Paik\'s': 'linear-gradient(to bottom, #FFD700 50%, #191970 50%)', // 빽다방 (다른 표기)
      'Hollys': '#FF4444'     // 할리스 밝은 레드
    }
    return cafeMap[storeName] || '#6B7280' // 기본 컬러
  }

  const TableHeader = ({ isFixed = false }: { isFixed?: boolean }) => (
    <thead className="sticky top-0 z-10">
      <tr className={`bg-[#F5E9D9] text-[#5D4037] ${isFixed ? "" : "border-b"}`}>
        <th className="py-2 text-center cursor-pointer w-[25%] md:w-auto text-base font-normal" 
            onClick={() => handleSort("name")}
            style={isFixed && columnWidths[0] ? { width: `${columnWidths[0]}px`, minWidth: `${columnWidths[0]}px` } : {}}> 
          <div className="flex flex-col items-center md:flex-row md:justify-center">
            <span className="text-xl md:text-base">☕</span>
            <span className="text-xs md:text-base md:ml-1">Menu</span>
            <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
          </div>
        </th>
        <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" 
            onClick={() => handleSort("sugars")}
            style={isFixed && columnWidths[1] ? { width: `${columnWidths[1]}px`, minWidth: `${columnWidths[1]}px` } : {}}> 
          <div className="flex flex-col items-center md:flex-row md:justify-center">
            <span className="text-xl md:text-base">🍬</span>
            <span className="text-xs md:text-base md:ml-1">Sugar</span>
            <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
            {!isFixed && (
              <Tooltip content={
                <div>
                  <b>기준 수치: 하루 권장 당류 섭취량</b><br/>
                  세계보건기구(WHO) 기준:<br/>
                  성인 하루 섭취 권장량: <b>25g 이하</b> (총 에너지 섭취량의 5%)<br/>
                  최대 상한선: <b>50g</b> (총 에너지 섭취량의 10%)<br/>
                  <br/>
                  <b>커피 1잔 기준 주의 구간 (Caffit 기준)</b>
                  <table style={{marginTop: 6, fontSize: 12, borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid #E0C9A6'}}>
                        <th style={{padding: '2px 6px'}}>등급</th>
                        <th style={{padding: '2px 6px'}}>수치(당류)</th>
                        <th style={{padding: '2px 6px'}}>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>🟢 양호</td><td>0~8g</td><td>거의 무당, 주로 블랙/아메리카노류</td></tr>
                      <tr><td>🟡 보통</td><td>9~17g</td><td>설탕/시럽 조금 포함된 라떼류</td></tr>
                      <tr><td>🟠 주의</td><td>18~24g</td><td>크림/시럽 많은 음료. 하루 섭취량의 70~100%</td></tr>
                      <tr><td>🔴 위험</td><td>25g 이상</td><td>하루 권장량 초과. 설탕+휘핑 조합</td></tr>
                    </tbody>
                  </table>
                </div>
              }>
                <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
              </Tooltip>
            )}
          </div>
        </th>
        <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" 
            onClick={() => handleSort("caffeine")}
            style={isFixed && columnWidths[2] ? { width: `${columnWidths[2]}px`, minWidth: `${columnWidths[2]}px` } : {}}> 
          <div className="flex flex-col items-center md:flex-row md:justify-center">
            <span className="text-xl md:text-base">⚡</span>
            <span className="text-xs md:text-base md:ml-1">Caffeine</span>
            <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
            {!isFixed && (
              <Tooltip content={
                <div>
                  <b>카페인 신호등 (Caffeine Traffic Light)</b><br/>
                  FDA(미국 식약청): 성인 하루 권장량 최대 <b>400mg</b><br/>
                  커피 1잔(354ml 기준) 약 80~150mg<br/>
                  <br/>
                  <b>카페인 등급표</b>
                  <table style={{marginTop: 6, fontSize: 12, borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid #E0C9A6'}}>
                        <th style={{padding: '2px 6px'}}>등급</th>
                        <th style={{padding: '2px 6px'}}>수치(mg)</th>
                        <th style={{padding: '2px 6px'}}>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>🟢 저카페인</td><td>0~70mg</td><td>디카페인, 연한 커피류</td></tr>
                      <tr><td>🟡 보통</td><td>71~140mg</td><td>일반 라떼, 콜드브루 소용량</td></tr>
                      <tr><td>🟠 주의</td><td>141~200mg</td><td>콜드브루/더블샷 등 고카페인</td></tr>
                      <tr><td>🔴 고위험</td><td>201mg 이상</td><td>에너지 음료 수준, 하루치 절반 이상</td></tr>
                    </tbody>
                  </table>
                </div>
              }>
                <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
              </Tooltip>
            )}
          </div>
        </th>
        <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" 
            onClick={() => handleSort("sodium")}
            style={isFixed && columnWidths[3] ? { width: `${columnWidths[3]}px`, minWidth: `${columnWidths[3]}px` } : {}}> 
          <div className="flex flex-col items-center md:flex-row md:justify-center">
            <span className="text-xl md:text-base">🧂</span>
            <span className="text-xs md:text-base md:ml-1">Salt</span>
            <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
            {!isFixed && (
              <Tooltip content={
                <div>
                  <b>나트륨 신호등 (Sodium Traffic Light)</b><br/>
                  WHO 권장량: 하루 <b>2,000mg 이하</b><br/>
                  한국 식약처: 나트륨 섭취 줄이기 캠페인<br/>
                  커피에 나트륨이 들어가는 이유: 시럽, 우유, 크림, 베이스 등<br/>
                  <br/>
                  <b>나트륨 등급표</b>
                  <table style={{marginTop: 6, fontSize: 12, borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{borderBottom: '1px solid #E0C9A6'}}>
                        <th style={{padding: '2px 6px'}}>등급</th>
                        <th style={{padding: '2px 6px'}}>수치(mg)</th>
                        <th style={{padding: '2px 6px'}}>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>🟢 저염</td><td>0~100mg</td><td>아메리카노, 블랙류</td></tr>
                      <tr><td>🟡 보통</td><td>101~200mg</td><td>라떼류</td></tr>
                      <tr><td>🟠 주의</td><td>201~300mg</td><td>프라푸치노류</td></tr>
                      <tr><td>🔴 고위험</td><td>301mg 이상</td><td>가공 시럽, 휘핑 첨가 음료</td></tr>
                    </tbody>
                  </table>
                </div>
              }>
                <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
              </Tooltip>
            )}
          </div>
        </th>
        <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" 
            onClick={() => handleSort("health_score")}
            style={isFixed && columnWidths[4] ? { width: `${columnWidths[4]}px`, minWidth: `${columnWidths[4]}px` } : {}}> 
          <div className="flex flex-col items-center md:flex-row md:justify-center">
            <span className="text-xl md:text-base">🩺</span>
            <span className="text-xs md:text-base md:ml-1">Health</span>
            <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
            {!isFixed && (
              <Tooltip content={
                <div style={{fontSize:13}}>
                  <b>종합 건강 점수 산출법</b><br/>
                  각 성분을 100점 만점 환산 후 평균<br/>
                  <table style={{marginTop:6, fontSize:12, borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #E0C9A6'}}>
                        <th style={{padding:'2px 6px'}}>성분</th>
                        <th style={{padding:'2px 6px'}}>기준치</th>
                        <th style={{padding:'2px 6px'}}>점수 계산</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>당류</td><td>25g</td><td>100 - (당류g/25)×100</td></tr>
                      <tr><td>카페인</td><td>200mg</td><td>100 - (카페인mg/200)×100</td></tr>
                      <tr><td>나트륨</td><td>300mg</td><td>100 - (나트륨mg/300)×100</td></tr>
                    </tbody>
                  </table>
                  <div style={{marginTop:6}}>
                    <b>등급</b><br/>
                    81~100: 🟢 매우 건강<br/>
                    61~80: 🟡 보통<br/>
                    41~60: 🟠 주의<br/>
                    0~40: 🔴 위험
                  </div>
                </div>
              }>
                <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
              </Tooltip>
            )}
          </div>
        </th>
        <th className="py-2 text-center hidden md:table-cell bg-[#F5E9D9]"
            style={isFixed && columnWidths[5] ? { width: `${columnWidths[5]}px`, minWidth: `${columnWidths[5]}px` } : {}}>🥚 Protein
          {!isFixed && (
            <Tooltip content={
              <div>
                <b>단백질(Protein)</b><br/>
                WHO 기준: 성인 하루 권장량<br/>
                <b>체중 1kg당 0.8g</b> (예: 60kg → 48g/일)
              </div>
            }>
              <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
            </Tooltip>
          )}
        </th>
        <th className="py-2 text-center hidden md:table-cell bg-[#F5E9D9]"
            style={isFixed && columnWidths[6] ? { width: `${columnWidths[6]}px`, minWidth: `${columnWidths[6]}px` } : {}}>🏪 Store</th>
      </tr>
    </thead>
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center items-center space-x-2 mb-3">
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-[#8D6E63]">커피 메뉴를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  // UI
  return (
    <>
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #C8A27A;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #8D6E63;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #C8A27A;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #8D6E63;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider-thumb::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-thumb::-moz-range-track {
          height: 8px;
          border-radius: 4px;
        }
        
        .fixed-header-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .fixed-header-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-h-screen bg-white py-8 px-2 md:px-0">
        {/* 웹 상단 네비게이션 */}
        <div className="hidden md:block max-w-5xl mx-auto mb-4">
          <div className="flex justify-end gap-1">
            <div className="px-4 py-2 bg-white text-[#5D4037] border-l border-r border-t border-[#E6D9CC] -mb-px z-10 rounded-t-lg font-medium">
              메뉴검색
            </div>
            <Link
              href="/find_location"
              className="px-4 py-2 text-[#8D6E63] hover:bg-[#F8F6F2] bg-[#F5F5F5] border border-[#E6D9CC] mt-1 rounded-t-lg font-medium transition-colors"
            >
              카페찾기
            </Link>
          </div>
        </div>

      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="relative mb-8">
          {/* 모바일 햄버거 메뉴 */}
          <div className="md:hidden absolute left-0 -top-4 z-10">
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#8D6E63] hover:text-[#C8A27A] transition-colors bg-white border border-[#E6D9CC] rounded-lg shadow-sm hover:shadow-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {isMobileMenuOpen && (
                <div className="absolute top-10 left-0 bg-white shadow-lg rounded-lg p-4 min-w-[150px] border">
                  <div className="block w-full text-left px-3 py-2 rounded bg-[#C8A27A] text-white font-medium">
                    메뉴검색
                  </div>
                  <Link
                    href="/find_location"
                    className="block w-full text-left px-3 py-2 rounded transition-colors text-[#8D6E63] hover:bg-[#F8F6F2] font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    카페찾기
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <div
              className="mb-4 px-12 md:px-0 text-sm md:text-2xl"
              style={{
                fontFamily: `'Montserrat', 'Poppins', 'Pretendard', 'Noto Sans KR', sans-serif`,
                color: '#8D6E63',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                fontStyle: 'italic',
              }}
            >
              "Smart Coffee, Better Health"
            </div>
          </div>
        </div>

            {/* 카페 필터 */}
            <div className="mb-6 max-w-4xl mx-auto">
          {/* 메인 카페들 - 웹에서는 한 줄, 모바일에서는 4개씩 */}
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-4">
            {mainCafes.map((cafe) => (
              <button
                key={cafe.name}
                onClick={() => {
                  const newCafe = selectedCafe === cafe.store ? null : cafe.store
                  setSelectedCafe(newCafe)
                  if (page !== 1) setPage(1)
                }}
                className={`cafe-button flex flex-col items-center bg-transparent border-none shadow-none outline-none transition-all
                  ${selectedCafe === cafe.store ? "scale-110 opacity-100" : selectedCafe === null ? "opacity-80 hover:opacity-100" : "opacity-50 sm:opacity-80 hover:opacity-100"}
                `}
                style={{
                  minHeight: 70,
                  background: "none",
                  boxShadow: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px"
                }}
              >
                {cafe.image ? (
                  <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-20">
                    <img 
                      src={cafe.image} 
                      alt={cafe.name} 
                      className="w-full h-full object-contain"
                      style={{ padding: 0, background: 'none' }} 
                    />
                  </div>
                ) : (
                  cafe.emoji ? <span className="text-2xl sm:text-4xl mb-1 sm:mb-2" style={{ color: cafe.color }}>{cafe.emoji}</span> : null
                )}
                                 {cafe.name !== "Starbucks" && cafe.name !== "Gong Cha" && cafe.name !== "MEGA" && cafe.name !== "Compose" && cafe.name !== "Paiks" && (
                  <span className="text-xs text-center mt-1" style={{ color: cafe.color }}>{cafe.name}</span>
                )}
              </button>
            ))}
            
            {/* 웹에서는 Paiks, Hollys를 바로 표시 */}
            {additionalCafes.map((cafe) => (
              <button
                key={cafe.name}
                onClick={() => {
                  const newCafe = selectedCafe === cafe.store ? null : cafe.store
                  setSelectedCafe(newCafe)
                  if (page !== 1) setPage(1)
                }}
                className={`cafe-button hidden sm:flex flex-col items-center bg-transparent border-none shadow-none outline-none transition-all
                  ${selectedCafe === cafe.store ? "scale-110 opacity-100" : selectedCafe === null ? "opacity-80 hover:opacity-100" : "opacity-50 sm:opacity-80 hover:opacity-100"}
                `}
                style={{
                  minHeight: 70,
                  background: "none",
                  boxShadow: "none", 
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 4px"
                }}
              >
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-20">
                  <img 
                    src={cafe.image} 
                    alt={cafe.name} 
                    className="w-full h-full object-contain"
                    style={{ padding: 0, background: 'none' }} 
                  />
                </div>
              </button>
            ))}
          </div>

          {/* 모바일에서만 보이는 + 카페더보기 버튼 */}
          <div className="flex justify-center mb-4 sm:hidden">
            <button
              onClick={() => setShowMoreCafes(!showMoreCafes)}
              className="flex items-center gap-2 text-[#8D6E63] hover:text-[#C8A27A] transition-colors text-sm font-medium"
            >
              <span className="text-lg">{showMoreCafes ? '−' : '+'}</span>
              <span>카페더보기</span>
            </button>
          </div>
          
          {/* 모바일에서 추가 카페들 (토글 가능) */}
          {showMoreCafes && (
            <div className="flex flex-wrap gap-3 justify-center sm:hidden">
              {additionalCafes.map((cafe) => (
                <button
                  key={cafe.name}
                  onClick={() => {
                    const newCafe = selectedCafe === cafe.store ? null : cafe.store
                    setSelectedCafe(newCafe)
                    if (page !== 1) setPage(1)
                  }}
                  className={`cafe-button flex flex-col items-center bg-transparent border-none shadow-none outline-none transition-all
                    ${selectedCafe === cafe.store ? "scale-110 opacity-100" : selectedCafe === null ? "opacity-80 hover:opacity-100" : "opacity-50 hover:opacity-100"}
                  `}
                  style={{
                    minHeight: 70,
                    background: "none",
                    boxShadow: "none", 
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 4px"
                  }}
                >
                  <div className="flex items-center justify-center w-12 h-12">
                    <img 
                      src={cafe.image} 
                      alt={cafe.name} 
                      className="w-full h-full object-contain"
                      style={{ padding: 0, background: 'none' }} 
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 필터 바 */}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center bg-[#F8F6F2] rounded-lg p-6 mb-10 overflow-hidden" style={{ minHeight: 70 }}>
          <input
            type="text"
            placeholder="Menu name search"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); if (page !== 1) setPage(1); }}
            className="border rounded px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A] w-full sm:w-auto mb-2 sm:mb-0 sm:flex-shrink-0"
          />
          <div className="flex flex-col w-full sm:w-48 mb-2 sm:mb-0">
            <label className="text-sm text-[#8D6E63] mb-2 text-center font-medium">
              kcal: {kcalRange[0]} ~ {kcalRange[1]}
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max={maxKcal}
                value={kcalRange[0]}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value)
                  if (newMin <= kcalRange[1]) {
                    setKcalRange([newMin, kcalRange[1]])
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb z-10"
              />
              <input
                type="range"
                min="0"
                max={maxKcal}
                value={kcalRange[1]}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value)
                  if (newMax >= kcalRange[0]) {
                    setKcalRange([kcalRange[0], newMax])
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb z-20"
              />
              <div 
                className="absolute h-2 bg-[#C8A27A] rounded-lg pointer-events-none"
                style={{
                  left: `${(kcalRange[0] / maxKcal) * 100}%`,
                  width: `${((kcalRange[1] - kcalRange[0]) / maxKcal) * 100}%`
                }}
              />
            </div>
          </div>
          <div className="flex flex-col w-full sm:w-48 mb-2 sm:mb-0">
            <label className="text-sm text-[#8D6E63] mb-2 text-center font-medium">
              Sugar: {sugarRange[0]}g ~ {sugarRange[1]}g
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max={maxSugar}
                value={sugarRange[0]}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value)
                  if (newMin <= sugarRange[1]) {
                    setSugarRange([newMin, sugarRange[1]])
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb z-10"
              />
              <input
                type="range"
                min="0"
                max={maxSugar}
                value={sugarRange[1]}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value)
                  if (newMax >= sugarRange[0]) {
                    setSugarRange([sugarRange[0], newMax])
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb z-20"
              />
              <div 
                className="absolute h-2 bg-[#C8A27A] rounded-lg pointer-events-none"
                style={{
                  left: `${(sugarRange[0] / maxSugar) * 100}%`,
                  width: `${((sugarRange[1] - sugarRange[0]) / maxSugar) * 100}%`
                }}
              />
            </div>
          </div>
          
          {/* Clear Filter 버튼 */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedCafe(null)
                setKcalRange([0, maxKcal])
                setSugarRange([0, maxSugar])
                setDebouncedKcalRange([0, maxKcal])
                setDebouncedSugarRange([0, maxSugar])
                if (page !== 1) setPage(1)
              }}
              className="w-full py-3 bg-[#C8A27A] text-white rounded px-4 text-base font-medium hover:bg-[#B08E6A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8A27A]"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4">
          {/* 고정 헤더 (스크롤 시에만 표시) */}
          {showFixedHeader && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white shadow p-4" style={{borderRadius: '8px 8px 0 0'}}>
                  <div 
                    className="overflow-x-auto bg-white fixed-header-scrollbar md:border-0 border border-[#F0F0F0]" 
                    style={{borderRadius: '8px 8px 0 0'}}
                  >
                    <table className="w-full table-fixed text-sm">
                      <TableHeader isFixed={true} />
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg">
            <table id="main-table" className="w-full table-fixed text-sm">
              <TableHeader isFixed={false} />
              <tbody>
                {filterLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex justify-center items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <p className="text-[#8D6E63]">데이터 로딩중...</p>
                    </td>
                  </tr>
                ) : (
                  coffees.map((c) => {
                    // 점수 계산
                    const score_sugar = c.sugars > 25 ? 0 : Math.max(0, Math.round(100 - (c.sugars / 25) * 100))
                    const score_caffeine = c.caffeine > 200 ? 0 : Math.max(0, Math.round(100 - (c.caffeine / 200) * 100))
                    const score_sodium = c.sodium > 300 ? 0 : Math.max(0, Math.round(100 - (c.sodium / 300) * 100))
                    const health_score = Math.round((score_sugar + score_caffeine + score_sodium) / 3)
                    let health_emoji = '🔴'
                    if (health_score >= 81) health_emoji = '🟢'
                    else if (health_score >= 61) health_emoji = '🟡'
                    else if (health_score >= 41) health_emoji = '🟠'
                    return (
                      <tr key={c.id} className="border-b hover:bg-[#F5E9D9] cursor-pointer">
                          <td className="py-2 text-[#5D4037] text-left break-words whitespace-normal w-[25%] md:w-auto relative">
                            {/* 카페 브랜드 컬러 바 - 왼쪽 세로 */}
                            <div 
                              className="absolute left-0"
                              style={{ 
                                width: '3px',
                                top: '15%',
                                bottom: '15%',
                                background: getCafeColor(c.store),
                                opacity: 0.8
                              }}
                            ></div>
                            <div className="pl-3">
                              <span className="break-words whitespace-normal block">{c.name}</span>
                              <div className="text-xs text-[#8D6E63] break-words whitespace-normal">{c.eng_name}</div>
                              <div className="text-xs text-[#B08E6A]">{c.kcal}kcal</div>
                            </div>
                          </td>
                          <td className="py-2 text-center w-[18.75%] md:w-auto">
                            <div className="flex flex-col items-center md:flex-row md:justify-center">
                              <span className="text-sm mb-1 md:mb-0 md:mr-2" style={{fontSize: '0.8em'}}>
                                {c.sugars <= 8 ? '🟢' : c.sugars <= 17 ? '🟡' : c.sugars <= 24 ? '🟠' : '🔴'}
                              </span>
                              <span className="text-sm">{c.sugars}g</span>
                            </div>
                          </td>
                          <td className="py-2 text-center w-[18.75%] md:w-auto">
                            <div className="flex flex-col items-center md:flex-row md:justify-center">
                              <span className="text-sm mb-1 md:mb-0 md:mr-2" style={{fontSize: '0.8em'}}>
                                {c.caffeine <= 70 ? '🟢' : c.caffeine <= 140 ? '🟡' : c.caffeine <= 200 ? '🟠' : '🔴'}
                              </span>
                              <span className="text-sm">{c.caffeine}mg</span>
                            </div>
                          </td>
                          <td className="py-2 text-center w-[18.75%] md:w-auto">
                            <div className="flex flex-col items-center md:flex-row md:justify-center">
                              <span className="text-sm mb-1 md:mb-0 md:mr-2" style={{fontSize: '0.8em'}}>
                                {c.sodium <= 100 ? '🟢' : c.sodium <= 200 ? '🟡' : c.sodium <= 300 ? '🟠' : '🔴'}
                              </span>
                              <span className="text-sm">{c.sodium}mg</span>
                            </div>
                          </td>
                          <td className="py-2 text-center w-[18.75%] md:w-auto">
                            <div className="flex flex-col items-center md:flex-row md:justify-center">
                              <span className="text-sm mb-1 md:mb-0 md:mr-2" style={{fontSize: '0.8em'}}>{health_emoji}</span>
                              <span className="text-sm">{health_score}점</span>
                            </div>
                          </td>
                          <td className="py-2 text-center hidden md:table-cell">
                            <span className="text-sm">{c.protein}g</span>
                          </td>
                          <td className="py-2 text-center hidden md:table-cell">{c.store}</td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 UI */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-[#E6D9CC] text-[#5D4037] text-xs font-semibold disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-[#5D4037]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-[#E6D9CC] text-[#5D4037] text-xs font-semibold disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// Suspense wrapper 컴포넌트
function CoffeeScreenerWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F3E9] text-[#5D4037] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-[#8D6E63]">메뉴 데이터 로딩중...</p>
        </div>
      </div>
    }>
      <CoffeeScreener />
    </Suspense>
  )
}

export default CoffeeScreenerWithSuspense
