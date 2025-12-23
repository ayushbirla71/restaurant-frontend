"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTable } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useFloors } from "@/hooks/use-floors"

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  floorId?: string
}

export function CreateTableDialog({ open, onOpenChange, floorId: initialFloorId }: CreateTableDialogProps) {
  const [tableNumber, setTableNumber] = useState("")
  const [size, setSize] = useState<string>("")
  const [selectedFloorId, setSelectedFloorId] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()
  const { floors } = useFloors()

  const floorId = initialFloorId || selectedFloorId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!size) return

    setCreating(true)

    try {
      // Calculate seats based on size
      const seats = size === "SMALL" ? 2 : size === "MEDIUM" ? 4 : 6

      await createTable({
        tableNumber,
        size,
        seats,
        floorId,
      })

      toast({
        title: "Table Created",
        description: `Table ${tableNumber} has been created successfully`,
      })

      setTableNumber("")
      setSize("")
      setSelectedFloorId("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
            <DialogDescription>Add a new table to the selected floor</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!initialFloorId && (
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Select value={selectedFloorId} onValueChange={setSelectedFloorId} required>
                  <SelectTrigger id="floor">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number</Label>
              <Input
                id="table-number"
                placeholder="e.g., T1, T2, A1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-size">Table Size</Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger id="table-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">Small (2 guests)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (4 guests)</SelectItem>
                  <SelectItem value="LARGE">Large (6+ guests)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !size || !floorId}>
              {creating ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
