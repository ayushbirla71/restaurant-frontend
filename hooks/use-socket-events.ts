"use client"

import { useEffect } from "react"
import { connectSocket } from "@/lib/socket"

export function useSocketEvents(events: string[], callback: () => void) {
  useEffect(() => {
    const socket = connectSocket()

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
