'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if we're on the root path
    if (pathname === '/') {
      router.replace('/tables')
    }
  }, [pathname, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}



