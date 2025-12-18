"use client"

import { useState, useEffect } from "react"
import { getTablesByFloor } from "@/lib/api"
import type { Table } from "@/types"
import { useSocketEvents } from "./use-socket-events"

export function useTables(floorId: string) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchTables = async () => {
    if (!floorId) return

    try {
      setLoading(true)
      const data = await getTablesByFloor(floorId)
      setTables(data)
      setError(false)
    } catch (err) {
      console.error("[v0] Failed to fetch tables:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [floorId])

  useSocketEvents(["tableStatusUpdated", "tableCreated"], () => {
    fetchTables()
  })

  return { tables, loading, error, refetch: fetchTables }
}
