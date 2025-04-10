'use client'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <div className="pt-4">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-zinc-400">Ici tu pourras discuter avec tes abonnés 🔒</p>
      </div>
    </ProtectedRoute>
  )
}
