'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }

    // PWA 설치 프롬프트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    const result = await installPrompt.prompt()
    console.log('Install prompt result:', result)
    setInstallPrompt(null)
    setIsInstallable(false)
  }

  if (!isInstallable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-[#C8A27A] text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">앱으로 설치하기</h3>
          <p className="text-xs opacity-90">더 빠르고 편리하게 사용하세요!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsInstallable(false)}
            className="px-3 py-1 text-xs bg-transparent border border-white/30 rounded hover:bg-white/10"
          >
            나중에
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 text-xs bg-white text-[#C8A27A] rounded font-semibold hover:bg-gray-100"
          >
            설치
          </button>
        </div>
      </div>
    </div>
  )
} 