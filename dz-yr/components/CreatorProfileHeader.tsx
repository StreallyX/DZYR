'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Props = {
  profile: any
  isSubscribed: boolean
  subscriptionEndDate?: string // date ISO de fin d’abonnement
  onSubscribe?: () => void
  onShopClick?: () => void
  onWriteClick?: () => void
}

export default function CreatorProfileHeader({
  profile,
  isSubscribed,
  subscriptionEndDate,
  onSubscribe,
  onShopClick,
  onWriteClick,
}: Props) {
  const router = useRouter()

  const goToShop = () => {
    if (onShopClick) {
      onShopClick()
    } else {
      router.push(`/creator/${profile.username}/shop`)
    }
  }

  const goToChat = () => {
    if (onWriteClick) {
      onWriteClick()
    } else {
      router.push(`/messages/${profile.id}`)
    }
  }

  const handleSubscribe = () => {
    router.push(`/payment/subscribe/${profile.id}`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRemainingDaysMessage = (endDateStr: string) => {
    const end = new Date(endDateStr)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "⚠️ Expire aujourd’hui"
    if (diffDays === 1) return "Expire dans 1 jour"
    return `Expire dans ${diffDays} jours`
  }

  return (
    <div className="mb-8 relative">
      {/* Bannière */}
      <div className="h-36 w-full bg-zinc-700 rounded-md overflow-hidden relative">
        {profile.banner_url && (
          <Image src={profile.banner_url} alt="banner" fill className="object-cover" />
        )}
      </div>

      {/* Avatar */}
      <div className="absolute top-20 left-4 w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-zinc-700">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="avatar"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        ) : null}
      </div>

      {/* Infos */}
      <div className="mt-16 pl-4 pr-4">
        <div className="text-sm text-gray-400 flex gap-4 mb-2">
          <span>{profile.total_contents ?? 0} Contents</span>
          <span>{profile.total_subs ?? 0} Subs</span>
          <span>{profile.total_follow ?? 0} Follow</span>
        </div>

        <p className="text-gray-400 text-sm italic mb-4">{profile.bio ?? 'Aucune bio.'}</p>

        {/* BOUTONS */}
        {isSubscribed ? (
          <>
            <div className="flex gap-2">
              <button
                onClick={goToChat}
                className="bg-black text-white text-sm px-4 py-2 rounded font-bold hover:bg-gray-800 w-1/2"
              >
                WRITE
              </button>
              <button
                onClick={goToShop}
                className="bg-pink-600 text-white text-sm px-4 py-2 rounded font-bold hover:bg-pink-500 w-1/2"
              >
                SHOP
              </button>
            </div>
            {subscriptionEndDate && (
              <div className="text-xs text-gray-400 text-center mt-2">
                <p>Subscribe until: {formatDate(subscriptionEndDate)}</p>
                <p className="italic">{getRemainingDaysMessage(subscriptionEndDate)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSubscribe}
              className="bg-black text-white text-sm px-4 py-2 rounded font-bold hover:bg-gray-800 w-1/2"
            >
              SUBSCRIBE {profile.subscription_price.toFixed(2)}$ / Month
            </button>
            <button
              onClick={goToShop}
              className="bg-pink-600 text-white text-sm px-4 py-2 rounded font-bold hover:bg-pink-500 w-1/2"
            >
              SHOP
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
