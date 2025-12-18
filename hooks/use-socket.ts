"use client"

import { useEffect } from "react"
import { socket, connectSocket } from "@/lib/socket"

export function useSocketEvents(events: string[], callback: () => void) {
  useEffect(() => {
    connectSocket()

    events.forEach((event) => {
      socket.on(event, callback)
    })

    return () => {
      events.forEach((event) => {
        socket.off(event, callback)
      })
    }
  }, [events, callback])
}
