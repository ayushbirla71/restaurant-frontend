"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableItem } from "@/components/table-item"
import { useTables } from "@/hooks/use-tables"
import { Search, Filter } from "lucide-react"
import type { Table } from "@/types"

interface TableGridProps {
  floorId: string
  isStaffView?: boolean
}

export function TableGrid({ floorId, isStaffView = false }: TableGridProps) {
  const { tables, loading } = useTables(floorId)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sizeFilter, setSizeFilter] = useState<string>("ALL")

  // Filter and search tables
  const filteredTables = useMemo(() => {
    if (!tables) return []

    return tables.filter((table: Table) => {
      // Search filter
      const matchesSearch = table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "ALL" || table.status === statusFilter

      // Size filter
      const matchesSize = sizeFilter === "ALL" || table.size === sizeFilter

      return matchesSearch && matchesStatus && matchesSize
    })
  }, [tables, searchQuery, statusFilter, sizeFilter])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tables || tables.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">No tables on this floor yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 sm:p-6">
        {/* Search and Filter Section - Desktop Layout */}
        <div className="mb-4 space-y-3">
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
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "AVAILABLE" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("AVAILABLE")}
                className="h-8"
              >
                Available
              </Button>
              <Button
                variant={statusFilter === "BOOKED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("BOOKED")}
                className="h-8"
              >
                Booked
              </Button>
              <Button
                variant={statusFilter === "OCCUPIED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("OCCUPIED")}
                className="h-8"
              >
                Occupied
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium w-full">Size:</span>
              <Button
                variant={sizeFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("ALL")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={sizeFilter === "SMALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("SMALL")}
                className="h-8"
              >
                Small (2)
              </Button>
              <Button
                variant={sizeFilter === "MEDIUM" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("MEDIUM")}
                className="h-8"
              >
                Medium (4)
              </Button>
              <Button
                variant={sizeFilter === "LARGE" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("LARGE")}
                className="h-8"
              >
                Large (6)
              </Button>
            </div>
          </div>

          {/* Desktop: Status left, Search center, Size right */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Left: Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "AVAILABLE" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("AVAILABLE")}
                className="h-8"
              >
                Available
              </Button>
              <Button
                variant={statusFilter === "BOOKED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("BOOKED")}
                className="h-8"
              >
                Booked
              </Button>
              <Button
                variant={statusFilter === "OCCUPIED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("OCCUPIED")}
                className="h-8"
              >
                Occupied
              </Button>
            </div>

            {/* Center: Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Right: Size Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Size:</span>
              <Button
                variant={sizeFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("ALL")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={sizeFilter === "SMALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("SMALL")}
                className="h-8"
              >
                Small
              </Button>
              <Button
                variant={sizeFilter === "MEDIUM" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("MEDIUM")}
                className="h-8"
              >
                Medium
              </Button>
              <Button
                variant={sizeFilter === "LARGE" ? "default" : "outline"}
                size="sm"
                onClick={() => setSizeFilter("LARGE")}
                className="h-8"
              >
                Large
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-emerald-600 shadow-sm" />
            <span className="text-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-rose-600 shadow-sm" />
            <span className="text-foreground">Occupied</span>
          </div>
          <div className="ml-auto text-muted-foreground">
            {filteredTables.length} of {tables.length} tables
          </div>
        </div>

        {/* Table Grid */}
        {filteredTables.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No tables match your filters</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredTables.map((table) => (
              <TableItem key={table.id} table={table} isStaffView={isStaffView} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
