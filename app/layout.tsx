import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/toaster"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "카핏 - 커피 칼로리,당류,나트륨,카페인 확인",
  description: "커피를 더 건강하게 당류 걱정 없이",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  themeColor: "#C8A27A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  other: {
    'naver-site-verification': '331c1a04fdfd7382cb74ccded60561e0bfb13f11',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Caffit',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2CWLCHPY0G"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2CWLCHPY0G');
          `}
        </Script>
        
        {/* Google AdSense */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7295119449200071"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        {children}
        <Toaster />
      </body>
    </html>
  )
}
