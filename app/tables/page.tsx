"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { AllFloorsView } from "@/components/all-floors-view"

export default function StaffTablesPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader isStaffView />
      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">Table Status - Staff View</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            All floors and tables at a glance. Click any table to view details or update status.
          </p>
        </div>

        <AllFloorsView isStaffView={true} />
      </main>
    </div>
  )
}
