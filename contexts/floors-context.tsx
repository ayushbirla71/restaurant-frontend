"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { getFloorsWithTables } from "@/lib/api"
import { connectSocket } from "@/lib/socket"
import type { Floor, Table } from "@/types"

export interface FloorWithTables extends Floor {
  Tables: Table[]
}

interface FloorsContextType {
  floors: FloorWithTables[]
  loading: boolean
  refetch: () => Promise<void>
}

const FloorsContext = createContext<FloorsContextType | undefined>(undefined)

export function FloorsProvider({ children }: { children: ReactNode }) {
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
    socketInstance.on("bookingCreated", handleUpdate)
    socketInstance.on("bookingCancelled", handleUpdate)
    socketInstance.on("bookingCompleted", handleUpdate)

    return () => {
      socketInstance.off("floorCreated", handleUpdate)
      socketInstance.off("tableCreated", handleUpdate)
      socketInstance.off("tableStatusUpdated", handleUpdate)
      socketInstance.off("bookingUpdated", handleUpdate)
      socketInstance.off("bookingCreated", handleUpdate)
      socketInstance.off("bookingCancelled", handleUpdate)
      socketInstance.off("bookingCompleted", handleUpdate)
    }
  }, [fetchFloors])

  return (
    <FloorsContext.Provider value={{ floors, loading, refetch: fetchFloors }}>
      {children}
    </FloorsContext.Provider>
  )
}

export function useFloors() {
  const context = useContext(FloorsContext)
  if (context === undefined) {
    throw new Error("useFloors must be used within a FloorsProvider")
  }
  return context
}

