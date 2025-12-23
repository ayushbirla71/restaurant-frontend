"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Table, CheckCircle2, Calendar, UserCheck, Users, Clock, Star } from "lucide-react"
import { useDashboard } from "@/hooks/use-dashboard"
import { cn } from "@/lib/utils"

export function DashboardStats() {
  const { stats, loading } = useDashboard()

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load dashboard stats</p>
      </div>
    )
  }

  const cards = [
    {
      title: "Total Floors",
      value: stats.summary.totalFloors,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Tables",
      value: stats.summary.totalTables,
      icon: Table,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Available",
      value: stats.summary.availableTables,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Booked",
      value: stats.summary.bookedTables,
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Occupied",
      value: stats.summary.occupiedTables,
      icon: UserCheck,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      title: "Today Bookings",
      value: stats.summary.todayBookingCount,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Total Guests",
      value: stats.summary.totalGuestsToday,
      icon: Users,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Waiting List",
      value: stats.summary.waitingListCount || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pre-Bookings Today",
      value: stats.summary.todayPreBookings || 0,
      icon: Star,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={cn("rounded-lg p-1.5", card.bgColor)}>
              <card.icon className={cn("h-3.5 w-3.5", card.color)} />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
