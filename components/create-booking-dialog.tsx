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
import { useFloors } from "@/hooks/use-floors"
import { useTables } from "@/hooks/use-tables"
import { createBooking } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CreateBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBookingDialog({ open, onOpenChange }: CreateBookingDialogProps) {
  const [floorId, setFloorId] = useState("")
  const [tableId, setTableId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [peopleCount, setPeopleCount] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [creating, setCreating] = useState(false)

  const { floors } = useFloors()
  const { tables } = useTables(floorId)
  const { toast } = useToast()

  // Filter only available tables
  const availableTables = tables?.filter((t) => t.status === "AVAILABLE") || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      await createBooking({
        tableId,
        customerName,
        mobile,
        email: email || undefined,
        peopleCount: Number.parseInt(peopleCount),
        bookingTime,
        durationMinutes: Number.parseInt(durationMinutes),
      })

      toast({
        title: "Booking Created",
        description: `Table booked for ${customerName} (${durationMinutes} min)`,
      })

      // Reset form
      setFloorId("")
      setTableId("")
      setCustomerName("")
      setMobile("")
      setEmail("")
      setPeopleCount("")
      setBookingTime("")
      setDurationMinutes("60")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Create New Booking</DialogTitle>
            <DialogDescription className="text-sm">Book a table for a customer</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select value={floorId} onValueChange={setFloorId} required>
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

            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Select value={tableId} onValueChange={setTableId} required disabled={!floorId}>
                <SelectTrigger id="table">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.tableNumber} ({table.size})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available tables
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="people">Number of People</Label>
              <Input
                id="people"
                type="number"
                placeholder="2"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-time">Booking Date & Time</Label>
              <Input
                id="booking-time"
                type="datetime-local"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                placeholder="60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !tableId}>
              {creating ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
