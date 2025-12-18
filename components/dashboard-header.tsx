"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, Calendar, Utensils, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

interface DashboardHeaderProps {
  isStaffView?: boolean
}

export function DashboardHeader({ isStaffView = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/floors", label: "Floors & Tables", icon: Building2 },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  ]

  const links = isStaffView ? [{ href: "/tables", label: "Table Status", icon: Utensils }] : adminLinks

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold">RestaurantPro</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 lg:px-4 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{link.label}</span>
                <span className="lg:hidden">{link.label.split(" ")[0]}</span>
              </Link>
            ))}
            {!isStaffView && (
              <Link
                href="/tables"
                className="ml-2 lg:ml-4 rounded-lg border border-border px-3 lg:px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Staff View
              </Link>
            )}
            {isStaffView && (
              <Link
                href="/admin"
                className="ml-2 lg:ml-4 rounded-lg border border-border px-3 lg:px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Admin View
              </Link>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-2 mt-6">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                {!isStaffView && (
                  <Link
                    href="/tables"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Utensils className="h-5 w-5" />
                    Staff View
                  </Link>
                )}
                {isStaffView && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin View
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
