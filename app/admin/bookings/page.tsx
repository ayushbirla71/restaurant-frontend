import { BookingsManager } from "@/components/bookings-manager"
import { DashboardHeader } from "@/components/dashboard-header"

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
          <p className="text-muted-foreground">Create and manage table bookings</p>
        </div>
        <BookingsManager />
      </main>
    </div>
  )
}
