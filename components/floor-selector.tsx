"use client"

import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import type { Floor } from "@/types"

interface FloorSelectorProps {
  floors: Floor[]
  selectedFloorId: string | null
  onSelectFloor: (floorId: string) => void
}

export function FloorSelector({ floors, selectedFloorId, onSelectFloor }: FloorSelectorProps) {
  if (floors.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Building2 className="h-5 w-5 text-muted-foreground hidden sm:block" />
      {floors.map((floor) => (
        <Button
          key={floor.id}
          variant={selectedFloorId === floor.id ? "default" : "outline"}
          onClick={() => onSelectFloor(floor.id)}
          className="flex-1 sm:flex-none sm:min-w-[120px] text-sm sm:text-base"
        >
          {floor.name}
        </Button>
      ))}
    </div>
  )
}
