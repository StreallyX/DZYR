'use client'

import BackButton from '@/components/ui/BackButton'


import { useState } from 'react'

export default function NotificationSettingsPage() {
  const [pauseAll, setPauseAll] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-medium">Pause toutes les notifications</span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={pauseAll}
            onChange={() => setPauseAll(!pauseAll)}
          />
          <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:bg-violet-600 transition"></div>
          <div
            className={`absolute ml-1 mt-0.5 w-4 h-4 bg-white rounded-full shadow transform transition ${
              pauseAll ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </label>
      </div>

      {/* Tu pourras ajouter d'autres options ici */}
      <ul className="text-sm text-zinc-400">
        <li className="py-2 border-b border-zinc-700">Posts, stories et commentaires</li>
        <li className="py-2 border-b border-zinc-700">Abonnés et abonnements</li>
        <li className="py-2 border-b border-zinc-700">Messages privés</li>
        <li className="py-2 border-b border-zinc-700">Live et vidéos</li>
        <li className="py-2 border-b border-zinc-700">Email & SMS</li>
      </ul>
    </div>
  )
}
