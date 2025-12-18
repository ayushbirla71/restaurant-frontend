"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardHeader } from "@/components/dashboard-header"
import { AllFloorsView } from "@/components/all-floors-view"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">Restaurant Table Management</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            All floors and tables at a glance. Click any table to book or manage reservations.
          </p>
        </div>

        <DashboardStats />

        <div className="mt-6 sm:mt-8">
          <AllFloorsView isStaffView={false} />
        </div>
      </main>
    </div>
  )
}
