'use client'

import { useRouter } from 'next/navigation'


type Props = {
  profile: any
  isSubscribed: boolean
  subscriptionEndDate?: string
  onWriteClick: () => void
  onSubscribe: () => void
}

export default function CreatorProfileActions({
    profile,
    isSubscribed,
    subscriptionEndDate,
    onWriteClick,
    onSubscribe,
  }: Props){
  const isFree = profile.subscription_price === 0
  const router = useRouter()

  const handleShopClick = () => {
    router.push(`/creator/${profile.username}/shop`)
  }

  return (
    <div className="mt-4 flex flex-col items-center text-center">
      {/* Boutons alignés en colonne */}
      <div className="w-full flex flex-col gap-3 max-w-xs">
        {!isSubscribed && (
          isFree ? (
            <div className="text-yellow-400 font-semibold text-sm">📢 Contenu gratuit</div>
          ) : (
            <button
            onClick={onSubscribe}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded"
            >
            S’abonner pour {profile.subscription_price.toFixed(2)} €
            </button>

          )
        )}

        {isSubscribed && (
          <button
            onClick={onWriteClick}
            className="w-full bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
          >
            Écrire
          </button>
        )}

        <button
          onClick={handleShopClick}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded"
        >
          SHOP
        </button>
      </div>

      {/* Texte abonnement en-dessous */}
      {isSubscribed && (
        <div className="mt-3 text-green-500 font-semibold text-sm">
          ✅ Abonné{isFree ? ' (gratuit)' : ''} jusqu’au {subscriptionEndDate?.split('T')[0]}
        </div>
      )}
    </div>
  )
}
