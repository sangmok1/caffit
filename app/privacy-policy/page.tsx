import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "개인정보 처리방침 - Caffit",
  description: "Caffit 개인정보 처리방침",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#5D4037]">개인정보 처리방침</h1>
          
          <div className="prose prose-lg max-w-none text-[#333] leading-relaxed">
            <p className="mb-6">
              안녕하세요. 이용자 개인정보의 안전한 처리는 <strong>Caffit</strong> 개발팀에게 가장 중요한 일 중 하나입니다.<br/>
              여러분의 개인정보는 서비스의 원활한 제공을 위하여 수집됩니다.
            </p>

            <p className="mb-8">
              법령에 의하거나 여러분이 별도로 동의하지 아니하는 한 <strong>Caffit</strong>은(는) 여러분의 개인정보를 제3자에게 제공하지 않습니다.<br/>
              개인정보 처리방침의 변경 시에는 이용자가 그 내용을 쉽게 확인할 수 있도록 빠르게 업데이트 하겠습니다.
            </p>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">1. 개인정보의 처리 목적</h2>
            <p className="mb-4">
              <strong>Caffit</strong>은 앱 또는 웹사이트 설치 및 사용 시 이용자가 동의한 권한에 따라 서비스의 기본 기능을 제공합니다.
            </p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>위치 기반 서비스 제공 및 기능 개선</li>
              <li>법령이나 이용약관에 반하는 이용행위 및 이용자 피해 방지를 위한 조치</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">2. 처리하는 개인정보 항목</h2>
            <p className="mb-4">다음과 같은 항목이 선택적으로 수집될 수 있습니다.</p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>사진</li>
              <li>ID</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">3. 개인정보 수집 방법</h2>
            <p className="mb-8">서비스 이용 시, 이용자의 동의에 따라 해당 항목만 수집합니다.</p>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">4. 쿠키 사용에 대한 안내</h2>
            <p className="mb-8"><strong>Caffit</strong>은 쿠키를 사용하지 않습니다.</p>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">5. 정보주체와 법정대리인의 권리</h2>
            <p className="mb-4">정보주체는 다음과 같은 권리를 언제든지 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 정정 요구</li>
              <li>삭제 요구</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">6. 개인정보의 보유 및 처리 기간</h2>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>회원 가입 및 관리: 탈퇴 요청 시까지</li>
              <li>법령에 따른 수사/조사 시: 해당 종료 시까지</li>
              <li>서비스 이용 관련 채권·채무 정산 시: 정산 완료 시까지</li>
              <li>전자상거래 등 관련 법령에 따른 보유: 해당 기간 종료 시까지</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">7. 개인정보의 파기</h2>
            <p className="mb-4">처리 목적 달성 시, 개인정보는 지체 없이 파기합니다.</p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>파기 기한: 보유 기간 종료 또는 목적 달성일로부터 5일 이내</li>
              <li>파기 방법: DB에서 삭제하거나 물리적으로 파기</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">8. 개인정보 보호책임자</h2>
            <p className="mb-4"><strong>Caffit</strong>은 개인정보 처리를 총괄하는 책임자를 지정하고 있습니다.</p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>이름: 이상목</li>
              <li>직책: 개발자</li>
              <li>이메일: tkdahr1991@gmail.com</li>
              <li>홈페이지: <a href="https://www.coffe.ai.kr" target="_blank" className="text-[#C8A27A] hover:underline">www.coffe.ai.kr</a></li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4 text-[#5D4037]">9. 개인정보 보호를 위한 조치</h2>
            <p className="mb-4"><strong>Caffit</strong>은 개인정보보호법 제29조에 따라 다음과 같은 안전조치를 취하고 있습니다.</p>
            <ul className="list-disc list-inside mb-8 space-y-2">
              <li>비인가 접근 방지를 위한 시스템 접근 통제</li>
              <li>보안 시스템 설치 및 관리</li>
            </ul>

            <p className="text-sm text-gray-600 border-t pt-6 mt-8">
              본 개인정보처리방침은 2025년 6월 1일부터 적용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 