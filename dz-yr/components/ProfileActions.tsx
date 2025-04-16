'use client'

import { useRouter } from 'next/navigation'

type Props = {
  showShopButton?: boolean
}

export default function ProfileActions({ showShopButton = true }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-3 px-4 mt-4">
      <button
        onClick={() => router.push('/profile/upload')}
        className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm text-white"
      >
        Ajouter un contenu
      </button>

      {showShopButton && (
        <button
          onClick={() => router.push('/profile/shop')}
          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm text-white"
        >
          Gérer mon shop
        </button>
      )}

      <button
        onClick={() => router.push('/settings/account')}
        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm text-white"
      >
        Modifier mon profil
      </button>
    </div>
  )
}
