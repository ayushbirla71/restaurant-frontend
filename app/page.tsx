import { redirect } from "next/navigation"

export default function HomePage() {
  // This should never be reached due to middleware redirect
  // But keeping as fallback
  redirect("/tables")
}


