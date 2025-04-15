'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Props = {
  profile: any
  isSubscribed: boolean
  onSubscribe?: () => void
  onShopClick?: () => void
}

export default function CreatorProfileHeader({
  profile,
  isSubscribed,
  onSubscribe,
  onShopClick,
}: Props) {
  const router = useRouter()

  const goToShop = () => {
    if (onShopClick) {
      onShopClick()
    } else {
      router.push(`/creator/${profile.username}/shop`)
    }
  }

  return (
    <div className="mb-8 relative">
      {/* Bannière */}
      <div className="h-36 w-full bg-zinc-700 rounded-md overflow-hidden relative">
        {profile.banner_url && (
          <Image src={profile.banner_url} alt="banner" fill className="object-cover" />
        )}
      </div>

      {/* Avatar superposé */}
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

      {/* Contenu sous la bannière */}
      <div className="mt-16 pl-4 pr-4">
        <div className="text-sm text-gray-400 flex gap-4 mb-2">
          <span>{profile.total_contents ?? 0} Contents</span>
          <span>{profile.total_subs ?? 0} Subs</span>
          <span>{profile.total_follow ?? 0} Follow</span>
        </div>

        <p className="text-gray-400 text-sm italic mb-4">{profile.bio ?? 'Aucune bio.'}</p>

        {/* Boutons */}
        {!isSubscribed && profile.subscription_price > 0 ? (
          <div className="flex gap-2">
            <button
              onClick={onSubscribe}
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
        ) : (
          <button
            onClick={goToShop}
            className="bg-pink-600 text-white text-sm px-4 py-2 rounded font-bold hover:bg-pink-500 w-full"
          >
            SHOP
          </button>
        )}
      </div>
    </div>
  )
}
