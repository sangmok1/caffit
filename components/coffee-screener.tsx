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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string>("eng_name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 데이터 fetch
  useEffect(() => {
    const loadCoffees = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          sortField,
          sortDirection,
        })
        if (searchTerm) params.append('search', searchTerm)
        if (selectedCafe) params.append('store', selectedCafe)
        if (kcalMin) params.append('kcalMin', kcalMin)
        if (kcalMax) params.append('kcalMax', kcalMax)
        if (sugarMin) params.append('sugarMin', sugarMin)
        if (sugarMax) params.append('sugarMax', sugarMax)
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
  }, [page, searchTerm, selectedCafe, kcalMin, kcalMax, sugarMin, sugarMax, sortField, sortDirection])

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
      <div className="flex flex-wrap gap-6 justify-center mb-6">
        {cafes.map((cafe) => (
          <button
            key={cafe.name}
            onClick={() => setSelectedCafe(selectedCafe === cafe.store ? null : cafe.store)}
            className={`flex flex-col items-center bg-transparent border-none shadow-none outline-none transition-all
              ${selectedCafe === cafe.store ? "scale-110 opacity-100" : selectedCafe === null ? "opacity-80 hover:opacity-100" : "opacity-50 sm:opacity-80 hover:opacity-100"}
            `}
            style={{
              minWidth: 56,
              minHeight: 80,
              background: "none",
              boxShadow: "none",
              border: "none",
              cursor: "pointer",
              padding: "18px 10px 12px 10px"
            }}
          >
            {cafe.image ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 68 }}>
                {cafe.name === 'EDIYA' ? (
                  <img src={cafe.image} alt={cafe.name} style={{ width: 75, height: 88, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 0, background: 'none' }} />
                ) : (
                  <img src={cafe.image} alt={cafe.name} style={{ width: 58, height: 68, objectFit: 'contain', padding: 0, background: 'none' }} />
                )}
              </div>
            ) : (
              cafe.emoji ? <span className="text-3xl mb-2" style={{ color: cafe.color }}>{cafe.emoji}</span> : null
            )}
            {cafe.name !== "Starbucks" && cafe.name !== "Gong Cha" && cafe.name !== "EDIYA" && cafe.name !== "MEGA" && cafe.name !== "" && (
              <span className="text-xs" style={{ color: cafe.color }}>{cafe.name}</span>
            )}
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-center justify-center bg-[#F8F6F2] rounded-lg p-6 mb-10" style={{ minHeight: 70 }}>
        <input
          type="text"
          placeholder="Menu name search"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="border rounded px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A] w-full sm:w-auto mb-2 sm:mb-0"
        />
        <div className="flex w-full sm:w-auto mb-2 sm:mb-0 items-center">
          <span className="text-sm text-[#8D6E63] mr-2">kcal</span>
          <input
            type="number"
            placeholder="min"
            value={kcalMin}
            onChange={(e) => { setKcalMin(e.target.value); setPage(1); }}
            className="border rounded px-2 py-2 w-20 sm:w-16 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A]"
          />
          <span className="mx-1 text-[#8D6E63]">~</span>
          <input
            type="number"
            placeholder="max"
            value={kcalMax}
            onChange={(e) => { setKcalMax(e.target.value); setPage(1); }}
            className="border rounded px-2 py-2 w-20 sm:w-16 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A]"
          />
        </div>
        <div className="flex w-full sm:w-auto mb-2 sm:mb-0 items-center">
          <span className="text-sm text-[#8D6E63] mr-2">Sugar</span>
          <input
            type="number"
            placeholder="min"
            value={sugarMin}
            onChange={(e) => { setSugarMin(e.target.value); setPage(1); }}
            className="border rounded px-2 py-2 w-20 sm:w-16 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A]"
          />
          <span className="mx-1 text-[#8D6E63]">~</span>
          <input
            type="number"
            placeholder="max"
            value={sugarMax}
            onChange={(e) => { setSugarMax(e.target.value); setPage(1); }}
            className="border rounded px-2 py-2 w-20 sm:w-16 text-base focus:outline-none focus:ring-2 focus:ring-[#C8A27A]"
          />
        </div>
        {/* Clear All Filter 버튼 - 웹에서는 오른쪽에, 모바일에서는 아래에 */}
        <button
          onClick={() => {
            setSearchTerm(""); setKcalMin(""); setKcalMax(""); setSugarMin(""); setSugarMax(""); setSelectedCafe(null); setPage(1);
          }}
          className="w-full sm:w-auto px-4 py-2 rounded bg-[#C8A27A] text-white text-sm font-semibold hover:bg-[#B08E6A] transition"
        >
          Clear all filters
        </button>
      </div>

      {/* 메뉴 리스트 */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="text-center py-12 text-[#C8A27A] text-lg">로딩 중...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : coffees.length === 0 ? (
          <div className="text-center py-12 text-[#8D6E63]">조건에 맞는 메뉴가 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg">
              <table className="w-full table-fixed text-sm">
                <thead>
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
                        <td className="py-2 text-[#5D4037] text-left break-words whitespace-normal w-[25%] md:w-auto">
                          <span className="break-words whitespace-normal block">{c.name}</span>
                          <div className="text-xs text-[#8D6E63] break-words whitespace-normal">{c.eng_name}</div>
                          <div className="text-xs text-[#B08E6A]">{c.kcal}kcal</div>
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
