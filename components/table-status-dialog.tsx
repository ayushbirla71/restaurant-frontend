"use client"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Table } from "@/types"

interface TableStatusDialogProps {
  table: Table
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdated?: () => void
}

export function TableStatusDialog({
  table,
  open,
  onOpenChange,
  onStatusUpdated,
}: TableStatusDialogProps) {
  const [status, setStatus] = useState<string>(table.status)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpdateStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/tables/${table.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update table status")
      }

      toast({
        title: "Success",
        description: `Table ${table.tableNumber} status updated to ${status}`,
      })

      onStatusUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating table status:", error)
      toast({
        title: "Error",
        description: "Failed to update table status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Table Status</DialogTitle>
          <DialogDescription>
            Manually change the status of Table {table.tableNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Table Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Current Status: {table.status}</p>
            <p className="text-xs">
              Note: Changing status manually may affect active bookings.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={loading || status === table.status}>
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

