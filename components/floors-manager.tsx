"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FloorSelector } from "@/components/floor-selector"
import { TableGrid } from "@/components/table-grid"
import { CreateFloorDialog } from "@/components/create-floor-dialog"
import { CreateTableDialog } from "@/components/create-table-dialog"
import { useFloors } from "@/hooks/use-floors"

export function FloorsManager() {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
  const [showCreateFloor, setShowCreateFloor] = useState(false)
  const [showCreateTable, setShowCreateTable] = useState(false)
  const { floors, loading } = useFloors()

  // Auto-select first floor when floors are loaded
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId && !loading) {
      // Sort floors by floorNumber and select floor 1 or the first one
      const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber)
      const firstFloor = sortedFloors.find(f => f.floorNumber === 1) || sortedFloors[0]
      setSelectedFloorId(firstFloor.id)
    }
  }, [floors, loading])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <FloorSelector floors={floors} selectedFloorId={selectedFloorId} onSelectFloor={setSelectedFloorId} />
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateFloor(true)} variant="outline" className="flex-1 sm:flex-none text-sm">
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Floor</span>
            <span className="sm:hidden">Floor</span>
          </Button>
          <Button onClick={() => setShowCreateTable(true)} disabled={!selectedFloorId} className="flex-1 sm:flex-none text-sm">
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Table</span>
            <span className="sm:hidden">Table</span>
          </Button>
        </div>
      </div>

      {selectedFloorId ? (
        <TableGrid floorId={selectedFloorId} />
      ) : (
        <Card>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                {loading
                  ? "Loading floors..."
                  : floors.length === 0
                    ? "No floors created yet. Create your first floor to get started."
                    : "Select a floor to view and manage tables"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateFloorDialog open={showCreateFloor} onOpenChange={setShowCreateFloor} />
      <CreateTableDialog open={showCreateTable} onOpenChange={setShowCreateTable} floorId={selectedFloorId || ""} />
    </div>
  )
}
