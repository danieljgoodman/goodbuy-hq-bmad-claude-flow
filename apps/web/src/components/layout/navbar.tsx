'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export default function Navbar() {
  const { user, signOut } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/onboarding', label: 'New Evaluation' },
    { href: '/guides', label: 'Implementation Guides' },
    { href: '/analytics', label: 'Advanced Analytics' },
    { href: '/benchmarking', label: 'Benchmarking' },
    { href: '/reports', label: 'Reports' },
    { href: '/support', label: 'Support' },
    { href: '/notifications', label: 'Notifications' },
    { href: '/subscription', label: 'Subscription' },
  ]

  // Add admin link for admin users (mock check - in production would check user role)
  const isAdmin = user?.email === 'admin@goodbuyhq.com' || user?.email?.includes('admin')
  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin' })
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GB</span>
              </div>
              <span className="text-xl font-bold">GoodBuy HQ</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      3
                    </Badge>
                  </Button>
                </Link>
                
                <span className="text-sm text-muted-foreground">
                  {user.businessName || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}