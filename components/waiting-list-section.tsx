"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getWaitingList, createBooking, assignTableFromWaiting, checkAssignConflict, removeFromWaitingList } from "@/lib/api"
import { useFloors } from "@/contexts/floors-context"
import { Users, Phone, Mail, Clock, ArrowUp, Search, CheckCircle2, ArrowLeft, AlertTriangle, Calendar, X } from "lucide-react"
import { TableOccupancyTimer } from "@/components/table-occupancy-timer"
import { TableItem } from "@/components/table-item"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { WaitingListEntry, Table } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WaitingListSectionProps {
  onAssignSuccess?: () => void
  onAssignActive?: (isActive: boolean) => void
}

export function WaitingListSection({ onAssignSuccess, onAssignActive }: WaitingListSectionProps) {
  const { toast } = useToast()
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null)
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "BOOKED" | "OCCUPIED">("ALL")
  const [sizeFilter, setSizeFilter] = useState<"ALL" | "SMALL" | "MEDIUM" | "LARGE">("ALL")
  const { floors, loading: floorsLoading } = useFloors()
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<any>(null)
  const [pendingAssignment, setPendingAssignment] = useState<{ tableId: string; tableName: string } | null>(null)
  const todaysString = new Date().toISOString().split("T")[0]
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [entryIdForCancel, setEntryIdForCancel] = useState<string | null>(null)

  useEffect(() => {
    fetchWaitingList()
  }, [])

  // Notify parent when assigning is active
  useEffect(() => {
    onAssignActive?.(selectedEntry !== null)
  }, [selectedEntry, onAssignActive])



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
      const table = allTables.find((t) => t.id === tableId)
      return total + (table?.seats || 0)
    }, 0)
  }, [selectedTableIds, floors])

  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    )
  }

  const handleAssignTables = async () => {
    if (!selectedEntry || selectedTableIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one table",
        variant: "destructive",
      })
      return
    }

    // Check for conflicts on the first table
    const firstTableId = selectedTableIds[0]
    const allTables = floors?.flatMap((f) => f.Tables) || []
    const firstTable = allTables.find((t) => t.id === firstTableId)

    setLoading(true)
    try {
      // Check for conflict
      const conflictCheck = await checkAssignConflict(selectedEntry.id, firstTableId, 60)

      if (conflictCheck.hasConflict) {
        // Show conflict dialog
        setConflictInfo(conflictCheck)
        setPendingAssignment({
          tableId: firstTableId,
          tableName: firstTable?.tableNumber || firstTableId
        })
        setShowConflictDialog(true)
        setLoading(false)
        return
      }

      // No conflict, proceed with assignment
      await performAssignment(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check table availability",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const performAssignment = async (autoSchedule: boolean = false) => {
    if (!selectedEntry || selectedTableIds.length === 0) return

    setLoading(true)
    try {
      // Assign first table using the proper API endpoint
      await assignTableFromWaiting(
        selectedEntry.id,
        selectedTableIds[0],
        60,
        autoSchedule,
        autoSchedule ? conflictInfo?.suggestedTime : undefined
      )

      // If multiple tables selected, create additional bookings
      if (selectedTableIds.length > 1) {
        for (let i = 1; i < selectedTableIds.length; i++) {
          await createBooking({
            tableId: selectedTableIds[i],
            customerName: selectedEntry.customerName,
            mobile: selectedEntry.mobile,
            email: selectedEntry.email || "",
            peopleCount: selectedEntry.peopleCount,
            bookingTime: selectedEntry.bookingDate && selectedEntry.bookingTimeSlot
              ? new Date(`${selectedEntry.bookingDate}T${selectedEntry.bookingTimeSlot}`).toISOString()
              : new Date().toISOString(),
            bookingDate: selectedEntry.bookingDate,
            bookingTimeSlot: selectedEntry.bookingTimeSlot,
            bookingType: selectedEntry.bookingType,
            durationMinutes: 60,
          })
        }
      }

      const message = autoSchedule
        ? `Table assigned and scheduled after current booking ends`
        : `Assigned ${selectedTableIds.length} table(s) to ${selectedEntry.customerName}`

      toast({
        title: "Success",
        description: message,
      })

      // Reset state
      setSelectedEntry(null)
      setSelectedTableIds([])
      setShowConflictDialog(false)
      setConflictInfo(null)
      setPendingAssignment(null)
      fetchWaitingList()
      onAssignSuccess?.()
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

  const handleConfirmAutoSchedule = () => {
    performAssignment(true)
  }

  const handleCancelAssignment = () => {
    setShowConflictDialog(false)
    setConflictInfo(null)
    setPendingAssignment(null)
    setLoading(false)
  }

  const handleCancelEntryDelete = async ( open: boolean ) => {
    setSelectedEntry(null)
    setSelectedTableIds([])
    setShowCancelDialog(open)
    setEntryIdForCancel(null)
  }

  const handleConfirmCancelEntry = async ( ) => {


    if (!entryIdForCancel) return

    try {
      await removeFromWaitingList(entryIdForCancel)
      toast({
        title: "Entry Cancelled",
        description: "The entry has been removed from the waiting list",
      })
      fetchWaitingList()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel entry",
        variant: "destructive",
      })
    } finally {
      setShowCancelDialog(false)
      setEntryIdForCancel(null)
    }
  } 

  const handleCancelEntry = async (entryId: string) => {
    setSelectedEntry(null)
    setSelectedTableIds([])
    setShowCancelDialog(true)
    setEntryIdForCancel(entryId)
  }


  // If assigning tables, show table selection view
  if (selectedEntry) {
    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToList} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Waiting List
          </Button>
          <div className="text-sm text-muted-foreground">
            Assigning for: <span className="font-semibold text-foreground">{selectedEntry.customerName}</span>
          </div>
        </div>

        {/* Customer Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{selectedEntry.peopleCount} people</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{selectedEntry.mobile}</span>
              </div>
              {selectedEntry.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEntry.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search table number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
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
          <div className="flex gap-2">
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

        {/* Selection Summary */}
        {selectedTableIds.length > 0 && (
          <Card className="bg-primary/5 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedTableIds.length} table(s) selected ({totalSeatsSelected} seats)
                  </span>
                </div>
                <Button onClick={handleAssignTables} disabled={loading} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Assign {selectedTableIds.length} Table(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tables Grid - Same UI as default tables */}
        <div className="space-y-6">
          {floorsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tables...</div>
          ) : filteredFloors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tables found</div>
          ) : (
            filteredFloors.map((floor) => (
              <Card key={floor.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{floor.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {floor.Tables.length} {floor.Tables.length === 1 ? "table" : "tables"}
                    </Badge>
                  </div>
                  <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                    {floor.Tables.sort((a, b) =>
                      a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })
                    ).map((table) => {
                      const isSelected = selectedTableIds.includes(table.id)
                      return (
                        <div
                          key={table.id}
                          className={cn(
                            "relative",
                            isSelected && "ring-2 ring-primary rounded-lg"
                          )}
                        >
                          <TableItem
                            table={table}
                            isStaffView={false}
                            isSelectionMode={true}
                            onTableClick={() => handleToggleTable(table.id)}
                            bookingDate={selectedEntry.bookingDate}
                            isWaitingList={true}
                            isTodaysBooking={selectedEntry.bookingDate === todaysString}
                            isFutureBooking={selectedEntry.bookingDate !== todaysString}
                            isWalkInBooking={false}
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // Show waiting list
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading waiting list...</div>
      ) : waitingList.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No customers in waiting list</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {waitingList.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Customer Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg">{entry.customerName}</h3>
                      {entry.priority > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <ArrowUp className="h-3 w-3" />
                          Priority
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{entry.peopleCount} people</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{entry.mobile}</span>
                      </div>
                      {entry.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{entry.email}</span>
                        </div>
                      )}
                      {entry.bookingDate && entry.bookingTimeSlot && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{entry.bookingDate} at {entry.bookingTimeSlot}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Waiting from: {Math.floor((Date.now() - new Date(entry.createdAt).getTime()) / 60000)}m</span>
                      </div>
                      {entry.estimatedWaitMinutes && (
                        <div className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Est. wait: ~{entry.estimatedWaitMinutes}m</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assign Button */}
                  <Button
                    onClick={() => handleAssignClick(entry)}
                    className="w-full sm:w-auto gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Assign
                  </Button>
                   {/* Cancel Button */}
                   <Button
                      variant="destructive"
                      onClick={() => handleCancelEntry(entry.id)}
                      className="w-full sm:w-auto gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conflict Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Table Already Booked
            </DialogTitle>
            <DialogDescription>
              This table has a conflicting booking during the requested time.
            </DialogDescription>
          </DialogHeader>

          {conflictInfo && pendingAssignment && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-amber-900">Current Booking:</p>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>• Customer: {conflictInfo.conflict.customerName}</p>
                  <p>• Time: {conflictInfo.conflict.bookingTimeSlot || new Date(conflictInfo.conflict.bookingTime).toLocaleTimeString()}</p>
                  <p>• Duration: {conflictInfo.conflict.durationMinutes} minutes</p>
                  <p>• Ends at: {new Date(conflictInfo.conflict.endTime).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">Auto-Schedule Option:</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Table <strong>{pendingAssignment.tableName}</strong> will be automatically assigned after the current booking ends.</p>
                  <p className="font-semibold">New booking time: {new Date(conflictInfo.suggestedTime).toLocaleTimeString()}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    (Includes 5-minute buffer for table cleanup)
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Do you want to proceed with auto-scheduling, or choose a different table?
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelAssignment}
              className="w-full sm:w-auto"
            >
              Choose Different Table
            </Button>
            <Button
              onClick={handleConfirmAutoSchedule}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Assigning..." : "Confirm Auto-Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={ (open) => handleCancelEntryDelete ( open )}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this entry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={( ) => handleCancelEntryDelete( false )}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmCancelEntry()}
              className="w-full sm:w-auto"
            >
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  )
}

