"use client"

import { useEffect, useState, useCallback } from "react"
import { getFloorsWithTables } from "@/lib/api"
import { connectSocket } from "@/lib/socket"
import type { Floor, Table } from "@/types"

export interface FloorWithTables extends Floor {
  Tables: Table[]
}

export function useFloorsWithTables() {
  const [floors, setFloors] = useState<FloorWithTables[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFloors = useCallback(async () => {
    try {
      const data = await getFloorsWithTables()
      setFloors(data)
    } catch (error) {
      console.error("Failed to fetch floors with tables:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFloors()
  }, [fetchFloors])

  useEffect(() => {
    const socketInstance = connectSocket()

    const handleUpdate = () => {
      fetchFloors()
    }

    socketInstance.on("floorCreated", handleUpdate)
    socketInstance.on("tableCreated", handleUpdate)
    socketInstance.on("tableStatusUpdated", handleUpdate)
    socketInstance.on("bookingUpdated", handleUpdate)

    return () => {
      socketInstance.off("floorCreated", handleUpdate)
      socketInstance.off("tableCreated", handleUpdate)
      socketInstance.off("tableStatusUpdated", handleUpdate)
      socketInstance.off("bookingUpdated", handleUpdate)
    }
  }, [fetchFloors])

  return { floors, loading, refetch: fetchFloors }
}

