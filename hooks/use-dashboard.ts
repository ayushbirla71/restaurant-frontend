"use client"

import { useState, useEffect } from "react"
import { getDashboardStats } from "@/lib/api"
import type { DashboardStats } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await getDashboardStats()
      setStats(data)
      setError(false)
    } catch (err) {
      console.error("[v0] Failed to fetch dashboard stats:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useSocketEvents(["dashboardUpdated", "tableStatusUpdated"], () => {
    fetchStats()
  })

  return { stats, loading, error, refetch: fetchStats }
}
