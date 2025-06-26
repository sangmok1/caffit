"use client"

import { useState, useEffect } from "react"
import { Coffee as CoffeeIcon, Search, Filter, ArrowUpDown, Info } from "lucide-react"
import type { Coffee } from "@/types/coffee"

interface CafeItem {
  name: string;
  store: string;
  color: string;
  image?: string;
  emoji?: string;
}

const cafes: CafeItem[] = [
  { name: "Starbucks", store: "Starbucks", color: "#00704A", image: "/starbucks-logo.png" },
  { name: "Gong Cha", store: "gongcha", color: "#FF6B35", image: "/gongcha-logo.png" },
  { name: "MEGA", store: "Mega", color: "#4A90E2", image: "/mega-logo.png" },
  { name: "Compose", store: "Compose", color: "#8B4513", image: "/compose-logo.png" },
//   { name: "Paik's", color: "#8B4513", emoji: "☕" },
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

export default function CoffeeScreener() {
  // 상태
  const [coffees, setCoffees] = useState<Coffee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null)
  const [kcalMin, setKcalMin] = useState("")
  const [kcalMax, setKcalMax] = useState("")
  const [sugarMin, setSugarMin] = useState("")
  const [sugarMax, setSugarMax] = useState("")
  // debounced 값들 (실제 API 호출에 사용)
  const [debouncedKcalMin, setDebouncedKcalMin] = useState("")
  const [debouncedKcalMax, setDebouncedKcalMax] = useState("")
  const [debouncedSugarMin, setDebouncedSugarMin] = useState("")
  const [debouncedSugarMax, setDebouncedSugarMax] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string>("eng_name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [maxKcal, setMaxKcal] = useState(800)
  const [maxSugars, setMaxSugars] = useState(50)

  // 최대값 fetch
  useEffect(() => {
    const loadMaxValues = async () => {
      try {
        const res = await fetch('/api/max-values')
        const result = await res.json()
        setMaxKcal(result.maxKcal)
        setMaxSugars(result.maxSugars)
      } catch (err) {
        console.error("Failed to load max values:", err)
      }
    }
    loadMaxValues()
  }, [])

  // 슬라이더 값들에 대한 debounce 효과
  useEffect(() => {
    // 슬라이더 값이 변경되면 즉시 searching 상태로 변경 (단, 초기 로딩이 끝난 후에만)
    const hasSliderChange = kcalMin || kcalMax || sugarMin || sugarMax
    if (hasSliderChange && !loading) {
      setIsSearching(true)
    }

    const timer = setTimeout(() => {
      setDebouncedKcalMin(kcalMin)
      setDebouncedKcalMax(kcalMax)
      setDebouncedSugarMin(sugarMin)
      setDebouncedSugarMax(sugarMax)
      setIsSearching(false) // 검색 완료 후 searching 상태 해제
    }, 1000) // 1초 딜레이

    return () => clearTimeout(timer) // 새로운 값이 들어오면 이전 타이머 취소
  }, [kcalMin, kcalMax, sugarMin, sugarMax, loading])

  // 데이터 fetch (debounced 값들 사용)
  useEffect(() => {
    const loadCoffees = async () => {
      try {
        // 슬라이더 변경이 아닌 경우 또는 카페 선택/검색/정렬/페이지 변경시 loading 상태 설정
        const isSliderChange = debouncedKcalMin || debouncedKcalMax || debouncedSugarMin || debouncedSugarMax
        const isNonSliderChange = searchTerm || selectedCafe || sortField !== 'eng_name' || page !== 1
        if (!isSliderChange || isNonSliderChange) {
          setLoading(true)
        }
        
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          sortField,
          sortDirection,
        })
        if (searchTerm) params.append('search', searchTerm)
        if (selectedCafe) params.append('store', selectedCafe)
        if (debouncedKcalMin) params.append('kcalMin', debouncedKcalMin)
        if (debouncedKcalMax) params.append('kcalMax', debouncedKcalMax)
        if (debouncedSugarMin) params.append('sugarMin', debouncedSugarMin)
        if (debouncedSugarMax) params.append('sugarMax', debouncedSugarMax)
        const res = await fetch(`/api/coffee-menus?${params.toString()}`)
        const result = await res.json()
        setCoffees(result.data)
        setTotal(result.total)
        setLoading(false)
      } catch (err) {
        setError("Failed to load coffee menu data. Please try again later.")
        setLoading(false)
      }
    }
    loadCoffees()
  }, [page, searchTerm, selectedCafe, debouncedKcalMin, debouncedKcalMax, debouncedSugarMin, debouncedSugarMax, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setPage(1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // 카페별 브랜드 컬러 가져오기 함수
  const getCafeColor = (storeName: string): string => {
    const cafeMap: { [key: string]: string } = {
      'Starbucks': 'rgb(17,81,27)', // 진녹색
      'starbucks': 'rgb(17,81,27)', // 진녹색 (소문자)
      'gongcha': '#E31E24',   // 빨강
      'Mega': '#FFD700',      // 찐노랑
      'Compose': '#8B4513',
      'EDIYA': '#B08E6A',
      'Paik\'s': '#8B4513'
    }
    return cafeMap[storeName] || '#C8A27A' // 기본 컬러
  }

  // UI
  return (
    <div className="min-h-screen bg-white py-8 px-2 md:px-0">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="mb-4"
            style={{
              fontSize: '1.5rem',
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
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-6 max-w-4xl mx-auto">
        {cafes.map((cafe) => (
          <button
            key={cafe.name}
            onClick={() => {
              const newCafe = selectedCafe === cafe.store ? null : cafe.store
              setSelectedCafe(newCafe)
              setPage(1) // 페이지를 1로 리셋
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
            {cafe.name !== "Starbucks" && cafe.name !== "Gong Cha" && cafe.name !== "EDIYA" && cafe.name !== "MEGA" && cafe.name !== "Compose" && (
              <span className="text-xs text-center mt-1" style={{ color: cafe.color }}>{cafe.name}</span>
            )}
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center bg-[#F8F6F2] rounded-lg p-6 mb-10 overflow-hidden" style={{ minHeight: 70 }}>
        <input
          type="text"
          placeholder="Menu name search"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="border rounded px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A] w-full sm:w-auto mb-2 sm:mb-0 sm:flex-shrink-0"
        />
        <div className="flex flex-col w-full sm:w-48 mb-4 sm:mb-0 sm:flex-shrink-0">
          <span className="text-sm text-[#8D6E63] mb-2 text-center">kcal: {kcalMin || 0} ~ {kcalMax || maxKcal}</span>
          <div className="relative touch-none">
            <input
              type="range"
              min="0"
              max={maxKcal}
              value={Number(kcalMin) || 0}
              onChange={(e) => { setKcalMin(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
              className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-1"
              style={{
                background: `linear-gradient(to right, #C8A27A 0%, #C8A27A ${((Number(kcalMin) || 0) / maxKcal) * 100}%, #e5e7eb ${((Number(kcalMin) || 0) / maxKcal) * 100}%, #e5e7eb 100%)`
              }}
            />
            <input
              type="range"
              min="0"
              max={maxKcal}
              value={Number(kcalMax) || maxKcal}
              onChange={(e) => { setKcalMax(e.target.value === String(maxKcal) ? "" : e.target.value); setPage(1); }}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider-thumb-2"
            />
          </div>
        </div>
        <div className="flex flex-col w-full sm:w-48 mb-4 sm:mb-0 sm:flex-shrink-0">
          <span className="text-sm text-[#8D6E63] mb-2 text-center">Sugar: {sugarMin || 0}g ~ {sugarMax || maxSugars}g</span>
          <div className="relative touch-none">
            <input
              type="range"
              min="0"
              max={maxSugars}
              value={Number(sugarMin) || 0}
              onChange={(e) => { setSugarMin(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
              className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-1"
              style={{
                background: `linear-gradient(to right, #C8A27A 0%, #C8A27A ${((Number(sugarMin) || 0) / maxSugars) * 100}%, #e5e7eb ${((Number(sugarMin) || 0) / maxSugars) * 100}%, #e5e7eb 100%)`
              }}
            />
            <input
              type="range"
              min="0"
              max={maxSugars}
              value={Number(sugarMax) || maxSugars}
              onChange={(e) => { setSugarMax(e.target.value === String(maxSugars) ? "" : e.target.value); setPage(1); }}
              className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider-thumb-2"
            />
          </div>
        </div>
        {/* Clear All Filter 버튼 - 웹에서는 오른쪽에, 모바일에서는 아래에 */}
        <button
          onClick={() => {
            try {
              setSearchTerm("")
              setKcalMin("")
              setKcalMax("")
              setSugarMin("")
              setSugarMax("")
              // debounced 값들도 즉시 초기화하여 바로 결과 표시
              setDebouncedKcalMin("")
              setDebouncedKcalMax("")
              setDebouncedSugarMin("")
              setDebouncedSugarMax("")
              setSelectedCafe(null)
              setPage(1)
              setIsSearching(false) // 검색 상태도 리셋
            } catch (error) {
              console.error("Clear filters error:", error)
            }
          }}
          className="w-full sm:w-auto px-4 py-2 rounded bg-[#C8A27A] text-white text-sm font-semibold hover:bg-[#B08E6A] transition sm:flex-shrink-0"
        >
          Clear all filters
        </button>
      </div>

      {/* 메뉴 리스트 */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="flex justify-center items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-[#8D6E63]">커피 메뉴를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : isSearching ? (
          <div className="text-center py-12">
            <div className="flex justify-center items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-[#C8A27A] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-[#8D6E63]">검색 중...</p>
          </div>
        ) : coffees.length === 0 ? (
          <div className="text-center py-12 text-[#8D6E63]">조건에 맞는 메뉴가 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#F5E9D9] text-[#5D4037]">
                    <th className="py-2 text-center cursor-pointer w-[25%] md:w-auto text-base font-normal" onClick={() => handleSort("name")}> 
                      <div className="flex flex-col items-center md:flex-row md:justify-center">
                        <span className="text-xl md:text-base">☕</span>
                        <span className="text-xs md:text-base md:ml-1">Menu</span>
                        <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
                      </div>
                    </th>
                    <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" onClick={() => handleSort("sugars")}> 
                      <div className="flex flex-col items-center md:flex-row md:justify-center">
                        <span className="text-xl md:text-base">🍬</span>
                        <span className="text-xs md:text-base md:ml-1">Sugar</span>
                        <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
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
                      </div>
                    </th>
                    <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" onClick={() => handleSort("caffeine")}> 
                      <div className="flex flex-col items-center md:flex-row md:justify-center">
                        <span className="text-xl md:text-base">⚡</span>
                        <span className="text-xs md:text-base md:ml-1">Caffeine</span>
                        <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
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
                      </div>
                    </th>
                    <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" onClick={() => handleSort("sodium")}> 
                      <div className="flex flex-col items-center md:flex-row md:justify-center">
                        <span className="text-xl md:text-base">🧂</span>
                        <span className="text-xs md:text-base md:ml-1">Salt</span>
                        <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
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
                      </div>
                    </th>
                    <th className="py-2 text-center cursor-pointer w-[18.75%] md:w-auto text-base font-normal" onClick={() => handleSort("health_score")}> 
                      <div className="flex flex-col items-center md:flex-row md:justify-center">
                        <span className="text-xl md:text-base">🩺</span>
                        <span className="text-xs md:text-base md:ml-1">Health</span>
                        <ArrowUpDown className="inline h-4 w-4 align-text-bottom md:ml-1 mt-1 md:mt-0" />
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
                      </div>
                    </th>
                    <th className="py-2 text-center hidden md:table-cell">🥚 Protein
                      <Tooltip content={
                        <div>
                          <b>단백질(Protein)</b><br/>
                          WHO 기준: 성인 하루 권장량<br/>
                          <b>체중 1kg당 0.8g</b> (예: 60kg → 48g/일)
                        </div>
                      }>
                        <span className="hidden md:inline-block" style={{cursor:'pointer', marginLeft:4, color:'#C8A27A', fontWeight:600}}><Info className="inline w-4 h-4 align-text-bottom" /></span>
                      </Tooltip>
                    </th>
                    <th className="py-2 text-center hidden md:table-cell">🏪 Store</th>
                  </tr>
                </thead>
                <tbody>
                  {coffees.map((c) => {
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
                          {/* 카페 브랜드 컬러 바 - 왼쪽 세로 (위아래 10%씩 줄임) */}
                          <div 
                            className="absolute left-0"
                            style={{ 
                              width: '3px',
                              top: '10%',
                              bottom: '10%',
                              ...(c.store === 'Compose' 
                                ? { background: 'linear-gradient(to bottom, #FFD700 50%, #8B4513 50%)' }
                                : { backgroundColor: getCafeColor(c.store) }
                              ),
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
                  })}
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
          </>
        )}
      </div>
    </div>
  )
}
