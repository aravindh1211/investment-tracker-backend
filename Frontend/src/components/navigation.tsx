"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Target,
  Camera,
  Home,
} from 'lucide-react'

const navItems = [
  {
    href: '/summary',
    label: 'Summary',
    icon: Home,
  },
  {
    href: '/holdings',
    label: 'Holdings',
    icon: BarChart3,
  },
  {
    href: '/ideal-allocation',
    label: 'Allocation',
    icon: PieChart,
  },
  {
    href: '/monthly-growth',
    label: 'Growth',
    icon: TrendingUp,
  },
  {
    href: '/snapshots',
    label: 'Snapshots',
    icon: Camera,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Investment Tracker</h1>
            <p className="text-xs text-muted-foreground">Portfolio Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}