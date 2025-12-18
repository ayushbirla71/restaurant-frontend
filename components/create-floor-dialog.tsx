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
import { createFloor } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CreateFloorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFloorDialog({ open, onOpenChange }: CreateFloorDialogProps) {
  const [name, setName] = useState("")
  const [floorNumber, setFloorNumber] = useState("")
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      await createFloor({
        name,
        floorNumber: Number.parseInt(floorNumber),
      })

      toast({
        title: "Floor Created",
        description: `${name} has been created successfully`,
      })

      setName("")
      setFloorNumber("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create floor",
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
            <DialogTitle>Create New Floor</DialogTitle>
            <DialogDescription>Add a new floor to your restaurant layout</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="floor-name">Floor Name</Label>
              <Input
                id="floor-name"
                placeholder="e.g., Ground Floor, First Floor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor-number">Floor Number</Label>
              <Input
                id="floor-number"
                type="number"
                placeholder="e.g., 1, 2, 3"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Floor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
