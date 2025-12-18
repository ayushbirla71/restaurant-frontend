const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
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

export function getTableBooking(tableId: string) {
  return fetchAPI(`/tables/${tableId}/booking`)
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
  durationMinutes?: number
}) {
  return fetchAPI("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
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
