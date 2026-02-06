'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BoardsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main mission control which now has the kanban
    router.push('/')
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to Mission Control...</p>
    </div>
  )
}
