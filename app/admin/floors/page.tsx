import { AdminFloorsView } from "@/components/admin-floors-view"
import { DashboardHeader } from "@/components/dashboard-header"

export default function FloorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Floor & Table Management</h1>
          <p className="text-muted-foreground">All floors and tables at a glance. Click any table to manage.</p>
        </div>
        <AdminFloorsView />
      </main>
    </div>
  )
}
