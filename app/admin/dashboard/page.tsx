"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Dashboard Statistics
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            View comprehensive analytics and metrics
          </p>
        </div>

        <DashboardStats />
      </main>
    </div>
  )
}

