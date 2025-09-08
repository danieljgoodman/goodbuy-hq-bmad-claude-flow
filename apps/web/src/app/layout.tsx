import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/layout/navbar'
import { AuthInitializer } from '@/components/providers/auth-initializer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoodBuy HQ - AI-Powered Business Valuations',
  description: 'Get instant AI-powered business valuations and improvement recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthInitializer />
        <Navbar />
        {children}
      </body>
    </html>
  )
}