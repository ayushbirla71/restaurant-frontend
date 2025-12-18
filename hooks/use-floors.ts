"use client"

import { useState, useEffect } from "react"
import { getFloors } from "@/lib/api"
import type { Floor } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useFloors() {
  const [floors, setFloors] = useState<Floor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchFloors = async () => {
    try {
      setLoading(true)
      const data = await getFloors()
      setFloors(data)
      setError(false)
    } catch (err) {
      console.error("[v0] Failed to fetch floors:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFloors()
  }, [])

  useSocketEvents(["floorCreated", "floorUpdated"], () => {
    fetchFloors()
  })

  return { floors, loading, error, refetch: fetchFloors }
}
