'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface NavigationItem {
  label: string
  href: string
  submenu?: NavigationItem[]
}

// Navigation structure for breadcrumb generation
const navigationStructure: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard'
  },
  {
    label: 'Evaluations',
    href: '/evaluations',
    submenu: [
      { label: 'New Evaluation', href: '/onboarding' },
      { label: 'History', href: '/evaluations/history' },
      { label: 'Comparisons', href: '/evaluations/compare' }
    ]
  },
  {
    label: 'Improvements',
    href: '/improvements',
    submenu: [
      { label: 'Opportunities', href: '/improvements/opportunities' },
      { label: 'Implementation Guides', href: '/improvements/guides' },
      { label: 'Progress Tracking', href: '/progress' }
    ]
  },
  {
    label: 'Market Intelligence',
    href: '/market-intelligence'
  },
  {
    label: 'Account',
    href: '/account',
    submenu: [
      { label: 'Profile', href: '/account/profile' },
      { label: 'Subscription', href: '/account/subscription' },
      { label: 'Settings', href: '/account/settings' }
    ]
  },
  {
    label: 'Admin',
    href: '/admin'
  },
  {
    label: 'Help',
    href: '/help'
  }
]

export default function BreadcrumbNavigation() {
  const pathname = usePathname()

  // Don't show breadcrumbs on homepage or dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    return null
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard' }]
    
    // Find matching navigation item based on pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    let currentPath = ''
    
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      
      // Find matching main navigation item
      const mainItem = navigationStructure.find(item => item.href === currentPath)
      if (mainItem) {
        breadcrumbs.push({ label: mainItem.label, href: currentPath })
        continue
      }
      
      // Check submenus
      let found = false
      for (const item of navigationStructure) {
        if (item.submenu) {
          const subItem = item.submenu.find(sub => sub.href === currentPath)
          if (subItem) {
            // Add parent if not already added
            if (breadcrumbs[breadcrumbs.length - 1].href !== item.href) {
              breadcrumbs.push({ label: item.label, href: item.href })
            }
            breadcrumbs.push({ label: subItem.label, href: currentPath })
            found = true
            break
          }
        }
      }
      
      // If no match found, create breadcrumb from segment
      if (!found) {
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        breadcrumbs.push({ label, href: currentPath })
      }
    }
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't render if only has dashboard
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground py-3 px-4 bg-muted/20 border-b">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index < breadcrumbs.length - 1 ? (
            <>
              <Link 
                href={crumb.href} 
                className="hover:text-primary transition-colors hover:underline"
              >
                {crumb.label}
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            </>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}