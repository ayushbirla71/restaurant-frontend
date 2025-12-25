const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://kanuma.ad96.in"
const API_BASE = `${BASE_URL}/api`

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))

    // For conflict errors (409), throw the full error object with conflict data
    if (response.status === 409) {
      const conflictError: any = new Error(error.message || "Booking conflict")
      conflictError.status = 409
      conflictError.conflict = error.conflict
      conflictError.estimatedWaitTime = error.estimatedWaitTime // Include estimated wait time
      throw conflictError
    }

    throw new Error(error.message || "Request failed")
  }

  return response.json()
}

// Dashboard
export function getDashboardStats() {
  return fetchAPI("/dashboard/stats")
}

// Floors
export function getFloors() {
  return fetchAPI("/floors")
}

export function getFloorsWithTables() {
  return fetchAPI("/floors/with-tables")
}

export function createFloor(data: { name: string; floorNumber: number }) {
  return fetchAPI("/floors", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Tables
export function getTablesByFloor(floorId: string) {
  return fetchAPI(`/tables/floor/${floorId}`)
}

export function createTable(data: {
  tableNumber: string
  size: string
  seats: number
  floorId: string
}) {
  return fetchAPI("/tables", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateTableStatus(tableId: string, status: string) {
  return fetchAPI(`/tables/${tableId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
}

export function updateTableAvailability(tableId: string, availableInMinutes: number | null) {
  return fetchAPI(`/tables/${tableId}/availability`, {
    method: "PUT",
    body: JSON.stringify({ availableInMinutes }),
  })
}

export function getTableBooking(tableId: string) {
  return fetchAPI(`/tables/${tableId}/booking`)
}

export function getAllTableBookings(tableId: string) {
  return fetchAPI(`/tables/${tableId}/bookings/all`)
}

export function getUpcomingBookingsForTable(tableId: string, isTodaysBooking?: boolean ,bookingDate?: string,) {
  return fetchAPI(`/bookings/table/${tableId}/upcoming`, {method: "POST",
    body: JSON.stringify({ isTodaysBooking, bookingDate }),
  })
}

export function getFutureBookingsForTableWithDate(tableId: string ,bookingDate?: string, isTodaysBooking?: boolean) {
  return fetchAPI(`/bookings/table/${tableId}/todays-bookings`)
}

export function getTableStatusesForDateTime(bookingDate: string, bookingTimeSlot: string) {
  const params = new URLSearchParams({ bookingDate, bookingTimeSlot })
  return fetchAPI(`/tables/statuses-for-datetime?${params.toString()}`)
}

// Bookings
export function getBookings() {
  return fetchAPI("/bookings")
}

export function createBooking(data: {
  tableId: string
  customerName: string
  mobile: string
  email?: string
  peopleCount: number
  bookingTime: string
  bookingDate?: string
  bookingTimeSlot?: string
  bookingType?: "WALK_IN" | "PRE_BOOKING"
  durationMinutes?: number
  priority?: number
  confirmAutoSchedule?: boolean
}) {
  return fetchAPI("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function getAvailableTables(peopleCount: number, bookingDate?: string, bookingTimeSlot?: string) {
  const params = new URLSearchParams({ peopleCount: peopleCount.toString() })
  if (bookingDate) params.append("bookingDate", bookingDate)
  if (bookingTimeSlot) params.append("bookingTimeSlot", bookingTimeSlot)

  return fetchAPI(`/bookings/available?${params.toString()}`)
}

export function getBookingsByDate(date: string) {
  return fetchAPI(`/bookings/by-date?date=${date}`)
}

export function syncTableStatuses() {
  return fetchAPI("/bookings/sync-statuses", {
    method: "POST",
  })
}

export function cancelBooking(bookingId: string) {
  return fetchAPI(`/bookings/${bookingId}/cancel`, {
    method: "PUT",
  })
}

export function completeBooking(bookingId: string) {
  return fetchAPI(`/bookings/${bookingId}/complete`, {
    method: "PUT",
  })
}

export function reassignTable(bookingId: string, newTableId: string) {
  return fetchAPI(`/bookings/${bookingId}/reassign`, {
    method: "PUT",
    body: JSON.stringify({ newTableId }),
  })
}

export function createQuickOccupancy(tableId: string) {
   return fetchAPI(`/tables/${tableId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status :"OCCUPIED" }),
  })
}

// Waiting List
export function addToWaitingList(data: {
  customerName: string
  mobile: string
  email?: string
  peopleCount: number
  preferredTableSize: "SMALL" | "MEDIUM" | "LARGE"
  bookingType: "WALK_IN" | "PRE_BOOKING"
  bookingDate?: string
  bookingTimeSlot?: string
  estimatedWaitMinutes?: number
}) {
  return fetchAPI("/waitinglist", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function getWaitingList(date?: string) {
  const params = date ? `?date=${date}` : ""
  return fetchAPI(`/waitinglist${params}`)
}

export function checkAssignConflict(waitingId: string, tableId: string, durationMinutes?: number) {
  return fetchAPI(`/waitinglist/${waitingId}/check-conflict`, {
    method: "POST",
    body: JSON.stringify({ tableId, durationMinutes }),
  })
}

export function assignTableFromWaiting(
  waitingId: string,
  tableId: string,
  durationMinutes?: number,
  autoSchedule?: boolean,
  suggestedTime?: string
) {
  return fetchAPI(`/waitinglist/${waitingId}/assign`, {
    method: "POST",
    body: JSON.stringify({ tableId, durationMinutes, autoSchedule, suggestedTime }),
  })
}

export function cancelWaitingEntry(waitingId: string) {
  return fetchAPI(`/waitinglist/${waitingId}/cancel`, {
    method: "PUT",
  })
}

// Alias for cancelWaitingEntry
export function removeFromWaitingList(waitingId: string) {
  return cancelWaitingEntry(waitingId)
}

export function notifyCustomer(waitingId: string) {
  return fetchAPI(`/waitinglist/${waitingId}/notify`, {
    method: "PUT",
  })
}

// Notifications
export function getPendingNotifications() {
  return fetchAPI("/notifications/pending")
}

export function confirmBooking(bookingId: string) {
  return fetchAPI(`/notifications/${bookingId}/confirm`, {
    method: "PUT",
  })
}

export function markClientDelayed(bookingId: string, delayMinutes: number) {
  return fetchAPI(`/notifications/${bookingId}/delay`, {
    method: "PUT",
    body: JSON.stringify({ delayMinutes }),
  })
}

// Override booking - Move existing booking to waiting list
export function overrideBooking(bookingData: any, conflictingBookingId: string) {
  return fetchAPI("/bookings/override", {
    method: "POST",
    body: JSON.stringify({ ...bookingData, conflictingBookingId }),
  })
}
