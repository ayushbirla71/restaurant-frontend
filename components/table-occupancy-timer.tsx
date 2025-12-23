"use client"

import { useState, useEffect } from "react"
import { Timer } from "lucide-react"
import type { Table } from "@/types"

interface TableOccupancyTimerProps {
  tableId?: string
  status: string
  table?: Table // Optional: pass table directly to use occupiedSince
}

export function TableOccupancyTimer({ tableId, status, table }: TableOccupancyTimerProps) {
  const [occupiedMinutes, setOccupiedMinutes] = useState<number | null>(null)

  useEffect(() => {
    // Only show timer when table is OCCUPIED (customer actually seated)
    if (status !== "OCCUPIED") {
      setOccupiedMinutes(null)
      return
    }

    const calculateTime = () => {
      // Only use table.occupiedSince (when customer actually sat down)
      if (!table?.occupiedSince) {
        setOccupiedMinutes(null)
        return
      }

      const startTime = new Date(table.occupiedSince)
      const now = new Date()
      const elapsedMs = now.getTime() - startTime.getTime()
      const elapsedMinutes = Math.floor(elapsedMs / 60000)
      setOccupiedMinutes(elapsedMinutes >= 0 ? elapsedMinutes : 0)
    }

    calculateTime()
    const interval = setInterval(calculateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [status, table?.occupiedSince])

  // Only show timer when OCCUPIED and we have a valid time
  if (status !== "OCCUPIED" || occupiedMinutes === null) {
    return null
  }

  return (
    <div className="flex items-center gap-1 text-xs text-amber-600">
      <Timer className="h-3 w-3" />
      <span>{occupiedMinutes}m</span>
    </div>
  )
}

