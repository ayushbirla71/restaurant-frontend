"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateTableAvailability } from "@/lib/api"
import { Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TableAvailabilityUpdateProps {
  tableId: string
  tableNumber: string
  currentAvailability?: number | null
}

export function TableAvailabilityUpdate({
  tableId,
  tableNumber,
  currentAvailability,
}: TableAvailabilityUpdateProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [customMinutes, setCustomMinutes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleQuickUpdate = async (minutes: number | null) => {
    setLoading(true)
    try {
      await updateTableAvailability(tableId, minutes)
      toast({
        title: "Availability Updated",
        description: minutes
          ? `Table ${tableNumber} will be available in ${minutes} minutes`
          : `Table ${tableNumber} availability time cleared`,
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update table availability",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomUpdate = async () => {
    const minutes = Number.parseInt(customMinutes)
    if (isNaN(minutes) || minutes < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of minutes",
        variant: "destructive",
      })
      return
    }

    await handleQuickUpdate(minutes)
    setCustomMinutes("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
          <Clock className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {currentAvailability ? `${currentAvailability} min` : "Set Time"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
        <DialogHeader className="space-y-1.5 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">Update Table Availability</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set estimated time until Table {tableNumber} becomes available
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(5)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              5 min
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(10)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              10 min
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(15)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              15 min
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(20)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              20 min
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(30)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              30 min
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate(45)}
              disabled={loading}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              45 min
            </Button>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="customMinutes" className="text-sm">Custom Time (minutes)</Label>
            <div className="flex gap-2">
              <Input
                id="customMinutes"
                type="number"
                min="0"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Enter minutes"
                className="text-sm sm:text-base h-9 sm:h-10"
              />
              <Button onClick={handleCustomUpdate} disabled={loading || !customMinutes} className="text-xs sm:text-sm h-9 sm:h-10">
                Set
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full text-sm sm:text-base h-9 sm:h-10"
            onClick={() => handleQuickUpdate(null)}
            disabled={loading}
          >
            Clear Availability Time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

