import { io, type Socket } from "socket.io-client"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://kanuma.ad96.in"

let socket: Socket | null = null

export function connectSocket() {
  if (!socket) {
    socket = io(BASE_URL)

    socket.on("connect", () => {
      console.log("[v0] Socket connected:", socket?.id)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
    })
  }

  return socket
}

export { socket }
