"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import { TableItem } from "@/components/table-item"
import { useFloorsWithTables } from "@/hooks/use-floors-with-tables"
import type { Table } from "@/types"

interface AllFloorsViewProps {
  isStaffView?: boolean
}

export function AllFloorsView({ isStaffView = false }: AllFloorsViewProps) {
  const { floors, loading } = useFloorsWithTables()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sizeFilter, setSizeFilter] = useState<string>("ALL")

  // Filter tables across all floors
  const filteredFloors = useMemo(() => {
    if (!floors) return []
    
    return floors.map(floor => ({
      ...floor,
      Tables: floor.Tables.filter((table: Table) => {
        const matchesSearch = table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || table.status === statusFilter
        const matchesSize = sizeFilter === "ALL" || table.size === sizeFilter
        return matchesSearch && matchesStatus && matchesSize
      })
    })).filter(floor => floor.Tables.length > 0 || searchQuery === "")
  }, [floors, searchQuery, statusFilter, sizeFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 w-32 bg-muted rounded mb-4" />
              <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!floors || floors.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">No floors created yet.</p>
        </CardContent>
      </Card>
    )
  }

  const totalTables = floors.reduce((sum, floor) => sum + floor.Tables.length, 0)
  const filteredCount = filteredFloors.reduce((sum, floor) => sum + floor.Tables.length, 0)

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <Card className="shadow-sm">
        <CardContent className="py-1">
          {/* Mobile: Stack everything */}
          <div className="flex flex-col gap-3 lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search table number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status:</span>
              </div>
              <Button variant={statusFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("ALL")} className="h-8">All</Button>
              <Button variant={statusFilter === "AVAILABLE" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("AVAILABLE")} className="h-8">Available</Button>
              <Button variant={statusFilter === "BOOKED" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("BOOKED")} className="h-8">Booked</Button>
              <Button variant={statusFilter === "OCCUPIED" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("OCCUPIED")} className="h-8">Occupied</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium w-full">Size:</span>
              <Button variant={sizeFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("ALL")} className="h-8">All</Button>
              <Button variant={sizeFilter === "SMALL" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("SMALL")} className="h-8">Small (2)</Button>
              <Button variant={sizeFilter === "MEDIUM" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("MEDIUM")} className="h-8">Medium (4)</Button>
              <Button variant={sizeFilter === "LARGE" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("LARGE")} className="h-8">Large (6)</Button>
            </div>
          </div>

          {/* Desktop: Status left, Search center, Size right */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <Button variant={statusFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("ALL")} className="h-8">All</Button>
              <Button variant={statusFilter === "AVAILABLE" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("AVAILABLE")} className="h-8">Available</Button>
              <Button variant={statusFilter === "BOOKED" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("BOOKED")} className="h-8">Booked</Button>
              <Button variant={statusFilter === "OCCUPIED" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("OCCUPIED")} className="h-8">Occupied</Button>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search table..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Size:</span>
              <Button variant={sizeFilter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("ALL")} className="h-8">All</Button>
              <Button variant={sizeFilter === "SMALL" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("SMALL")} className="h-8">Small</Button>
              <Button variant={sizeFilter === "MEDIUM" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("MEDIUM")} className="h-8">Medium</Button>
              <Button variant={sizeFilter === "LARGE" ? "default" : "outline"} size="sm" onClick={() => setSizeFilter("LARGE")} className="h-8">Large</Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground text-right">
            Showing {filteredCount} of {totalTables} tables
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium px-2">
  <div className="flex items-center gap-2">
    <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-emerald-500/30" />
    <span className="text-foreground">Available</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="h-4 w-4 rounded-full bg-amber-500 shadow-amber-500/30" />
    <span className="text-foreground">Booked</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="h-4 w-4 rounded-full bg-rose-500 shadow-rose-500/30" />
    <span className="text-foreground">Occupied</span>
  </div>
</div>


      {/* All Floors with Tables */}
      <div className="space-y-6">
        {filteredFloors.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No tables match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredFloors.map((floor) => (
            <Card key={floor.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{floor.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {floor.Tables.length} {floor.Tables.length === 1 ? 'table' : 'tables'}
                  </Badge>
                </div>
                <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                  {floor.Tables
                    .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }))
                    .map((table) => (
                    <TableItem key={table.id} table={table} isStaffView={isStaffView} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}


