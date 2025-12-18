"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AllFloorsView } from "@/components/all-floors-view"
import { CreateFloorDialog } from "@/components/create-floor-dialog"
import { CreateTableDialog } from "@/components/create-table-dialog"

export function AdminFloorsView() {
  const [showCreateFloor, setShowCreateFloor] = useState(false)
  const [showCreateTable, setShowCreateTable] = useState(false)

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowCreateFloor(true)} variant="outline" className="text-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Floor
        </Button>
        <Button onClick={() => setShowCreateTable(true)} className="text-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* All Floors View */}
      <AllFloorsView isStaffView={false} />

      {/* Dialogs */}
      <CreateFloorDialog open={showCreateFloor} onOpenChange={setShowCreateFloor} />
      <CreateTableDialog open={showCreateTable} onOpenChange={setShowCreateTable} />
    </div>
  )
}

