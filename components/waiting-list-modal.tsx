"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getWaitingList, createBooking } from "@/lib/api"
import { useFloors } from "@/contexts/floors-context"
import { Users, Phone, Mail, Clock, ArrowUp, Search, CheckCircle2 } from "lucide-react"
import { TableOccupancyTimer } from "@/components/table-occupancy-timer"
import { cn } from "@/lib/utils"
import type { WaitingListEntry, Table } from "@/types"

interface WaitingListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaitingListModal({ open, onOpenChange }: WaitingListModalProps) {
  const { toast } = useToast()
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null)
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "BOOKED">("ALL")
  const [sizeFilter, setSizeFilter] = useState<"ALL" | "SMALL" | "MEDIUM" | "LARGE">("ALL")
  const { floors, loading: floorsLoading } = useFloors()

  useEffect(() => {
    if (open) {
      fetchWaitingList()
    }
  }, [open])

  const fetchWaitingList = async () => {
    setLoading(true)
    try {
      const data = await getWaitingList()
      setWaitingList(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch waiting list",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignClick = (entry: WaitingListEntry) => {
    setSelectedEntry(entry)
    setSelectedTableIds([])
    setSearchQuery("")
    setStatusFilter("ALL")
    setSizeFilter("ALL")
  }

  const handleBackToList = () => {
    setSelectedEntry(null)
    setSelectedTableIds([])
  }

  // Filter tables
  const filteredFloors = useMemo(() => {
    if (!floors) return []

    return floors
      .map((floor) => ({
        ...floor,
        Tables: floor.Tables.filter((table: Table) => {
          // Search filter
          if (searchQuery && !table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false
          }

          // Status filter
          if (statusFilter !== "ALL" && table.status !== statusFilter) {
            return false
          }

          // Size filter
          if (sizeFilter !== "ALL" && table.size !== sizeFilter) {
            return false
          }

          return true
        }),
      }))
      .filter((floor) => floor.Tables.length > 0)
  }, [floors, searchQuery, statusFilter, sizeFilter])

  // Calculate total seats selected
  const totalSeatsSelected = useMemo(() => {
    if (!floors) return 0
    const allTables = floors.flatMap((f) => f.Tables)
    return selectedTableIds.reduce((total, tableId) => {
      const table = allTables.find((t: Table) => t.id === tableId)
      if (!table) return total
      const seats = table.size === "SMALL" ? 2 : table.size === "MEDIUM" ? 4 : 6
      return total + seats
    }, 0)
  }, [selectedTableIds, floors])

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    )
  }

  const handleAssignTables = async () => {
    if (!selectedEntry || selectedTableIds.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one table",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create booking for each selected table
      for (const tableId of selectedTableIds) {
        await createBooking({
          tableId,
          customerName: selectedEntry.customerName,
          mobile: selectedEntry.mobile,
          email: selectedEntry.email || undefined,
          peopleCount: selectedEntry.peopleCount,
          bookingTime: selectedEntry.bookingDate && selectedEntry.bookingTimeSlot
            ? new Date(`${selectedEntry.bookingDate}T${selectedEntry.bookingTimeSlot}`).toISOString()
            : new Date().toISOString(),
          bookingDate: selectedEntry.bookingDate,
          bookingTimeSlot: selectedEntry.bookingTimeSlot,
          bookingType: selectedEntry.bookingType,
          durationMinutes: 60, // Default duration
        })
      }

      toast({
        title: "Tables Assigned",
        description: `${selectedTableIds.length} table(s) assigned to ${selectedEntry.customerName}`,
      })

      // Reset and refresh
      setSelectedEntry(null)
      setSelectedTableIds([])
      fetchWaitingList()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign tables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateWaitingTime = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {selectedEntry ? `Assign Tables - ${selectedEntry.customerName}` : "Waiting List"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {selectedEntry
              ? `Select tables for ${selectedEntry.peopleCount} people`
              : "Customers waiting for available tables"}
          </DialogDescription>
        </DialogHeader>

        {selectedEntry ? (
          // Table Selection View
          <div className="space-y-4">
            {/* Customer Info Summary */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm sm:text-base">{selectedEntry.customerName}</span>
                      {selectedEntry.priority > 0 && (
                        <Badge variant="default" className="text-xs">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Priority {selectedEntry.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span>
                        <Phone className="h-3 w-3 inline mr-1" />
                        {selectedEntry.mobile}
                      </span>
                      <span>
                        <Users className="h-3 w-3 inline mr-1" />
                        {selectedEntry.peopleCount} people
                      </span>
                    </div>
                  </div>
                  {selectedTableIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                      {selectedTableIds.length} table(s) • {totalSeatsSelected} seats
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBackToList} className="w-full sm:w-auto">
                Back to List
              </Button>
              <Button
                onClick={handleAssignTables}
                disabled={selectedTableIds.length === 0 || loading}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {selectedTableIds.length > 0 ? `Assign ${selectedTableIds.length} Table(s)` : "Assign Tables"}
              </Button>
            </div>

            {/* Table Selection UI */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Select Tables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search table number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 sm:h-10"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant={statusFilter === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                      >
                        All
                      </Button>
                      <Button
                        variant={statusFilter === "AVAILABLE" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("AVAILABLE")}
                        className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                      >
                        Available
                      </Button>
                      <Button
                        variant={statusFilter === "BOOKED" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("BOOKED")}
                        className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                      >
                        Booked
                      </Button>
                    </div>

                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant={sizeFilter === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSizeFilter("ALL")}
                        className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                    >
                      All Sizes
                    </Button>
                    <Button
                      variant={sizeFilter === "SMALL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSizeFilter("SMALL")}
                      className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                    >
                      Small
                    </Button>
                    <Button
                      variant={sizeFilter === "MEDIUM" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSizeFilter("MEDIUM")}
                      className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                    >
                      Medium
                    </Button>
                    <Button
                      variant={sizeFilter === "LARGE" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSizeFilter("LARGE")}
                      className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                    >
                      Large
                    </Button>
                    </div>
                  </div>
                </div>

                {/* Tables by Floor */}
                {floorsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
                ) : filteredFloors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No tables found</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredFloors.map((floor) => (
                      <div key={floor.id} className="space-y-2">
                        <h3 className="font-semibold text-sm">
                          Floor {floor.floorNumber} - {floor.name}
                        </h3>
                        <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                          {floor.Tables.map((table: Table) => {
                            const isSelected = selectedTableIds.includes(table.id)
                            const seats = table.size === "SMALL" ? 2 : table.size === "MEDIUM" ? 4 : 6

                            return (
                              <div
                                key={table.id}
                                onClick={() => toggleTableSelection(table.id)}
                                className={cn(
                                  "relative p-3 rounded-lg border-2 cursor-pointer transition-all",
                                  isSelected && "border-primary bg-primary/10",
                                  !isSelected &&
                                    table.status === "AVAILABLE" &&
                                    "border-green-500 bg-green-50 hover:bg-green-100",
                                  !isSelected &&
                                    table.status === "BOOKED" &&
                                    "border-yellow-500 bg-yellow-50 hover:bg-yellow-100",
                                  !isSelected &&
                                    table.status === "OCCUPIED" &&
                                    "border-red-500 bg-red-50 opacity-50 cursor-not-allowed"
                                )}
                              >
                                {isSelected && (
                                  <div className="absolute -top-2 -right-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary fill-white" />
                                  </div>
                                )}
                                <div className="text-center space-y-1">
                                  <div className="font-semibold text-sm">{table.tableNumber}</div>
                                  <div className="text-xs text-muted-foreground">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {seats}
                                  </div>
                                  <Badge
                                    variant={table.status === "AVAILABLE" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {table.status}
                                  </Badge>
                                  <TableOccupancyTimer tableId={table.id} status={table.status} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Waiting List View
          <>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : waitingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No customers in waiting list</div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {waitingList.map((entry) => (
                  <Card key={entry.id} className="relative">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base">{entry.customerName}</span>
                            {entry.priority > 0 && (
                              <Badge variant="default" className="text-xs">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                Priority {entry.priority}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {entry.bookingType === "PRE_BOOKING" ? "Pre-Booking" : "Walk-In"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{entry.mobile}</span>
                            </div>
                            {entry.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{entry.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{entry.peopleCount} people</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium text-orange-600">
                                Waiting: {calculateWaitingTime(entry.createdAt)}
                              </span>
                            </div>
                          </div>

                          {entry.bookingDate && entry.bookingTimeSlot && (
                            <div className="text-xs text-muted-foreground">
                              Requested: {entry.bookingDate} at {entry.bookingTimeSlot}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAssignClick(entry)}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

