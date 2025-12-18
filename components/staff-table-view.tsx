"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { FloorSelector } from "@/components/floor-selector"
import { TableGrid } from "@/components/table-grid"
import { useFloors } from "@/hooks/use-floors"

export function StaffTableView() {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
  const { floors, loading } = useFloors()

  useEffect(() => {
    if (!selectedFloorId && floors.length > 0) {
      console.log("StaffTableView: floors:", floors)
      // Try to select floor number 1 by default, otherwise pick the lowest floor
      const floorOne = floors.find((f) => f.floorNumber === 1)
      console.log("StaffTableView: floorOne:", floorOne)
      if (floorOne) {
        setSelectedFloorId(floorOne.id)
        console.log("StaffTableView: selectedFloorId set to (floor 1)", floorOne.id)
      } else {
        const sorted = [...floors].sort((a, b) => a.floorNumber - b.floorNumber)
        console.log("StaffTableView: fallback sorted[0]:", sorted[0])
        setSelectedFloorId(sorted[0].id)
        console.log("StaffTableView: selectedFloorId set to (fallback)", sorted[0].id)
      }
    }
  }, [floors, selectedFloorId]);


  return (
    <div className="space-y-6">
      <FloorSelector floors={floors} selectedFloorId={selectedFloorId} onSelectFloor={setSelectedFloorId} />

      {selectedFloorId ? (
        <TableGrid floorId={selectedFloorId} isStaffView />
      ) : (
        <Card>
          <div className="flex min-h-[400px] items-center justify-center p-6">
            <p className="text-muted-foreground">
              {loading
                ? "Loading floors..."
                : floors.length === 0
                  ? "No floors available"
                  : "Select a floor to view tables"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
