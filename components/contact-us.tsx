"use client"

import { useState } from "react"
import { X, Send } from "lucide-react"

interface ContactUsProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactUs({ isOpen, onClose }: ContactUsProps) {
  const [subject, setSubject] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !email.trim() || !content.trim()) {
      setMessage("모든 필드를 입력해주세요.")
      return
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setMessage("올바른 이메일 주소를 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          email: email.trim(),
          content: content.trim(),
        }),
      })

      if (response.ok) {
        setMessage("문의가 성공적으로 전송되었습니다!")
        setSubject("")
        setEmail("")
        setContent("")
        setTimeout(() => {
          onClose()
          setMessage("")
        }, 2000)
      } else {
        setMessage("전송 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      setMessage("전송 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#E0C9A6]">
          <h2 className="text-xl font-semibold text-[#5D4037]">Contact Us</h2>
          <button
            onClick={onClose}
            className="text-[#8D6E63] hover:text-[#5D4037] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-[#5D4037] mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0C9A6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A27A] focus:border-transparent"
                placeholder="문의 제목을 입력해주세요"
                required
              />
            </div>

            {/* 회신받을 메일주소 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#5D4037] mb-2">
                회신받을 메일주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0C9A6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A27A] focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-[#5D4037] mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-[#E0C9A6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A27A] focus:border-transparent resize-none"
                placeholder="문의 내용을 자세히 작성해주세요"
                required
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("성공") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C8A27A] hover:bg-[#B08E6A] disabled:bg-[#E0C9A6] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 