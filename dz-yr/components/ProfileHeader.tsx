'use client'

import Image from 'next/image'

type Props = {
  profile: any
  isOwnProfile: boolean
}

export default function ProfileHeader({ profile, isOwnProfile }: Props) {
  const hasBanner = !!profile?.banner_url

  return (
    <div className="relative w-full mb-4">
      {/* Bannière si elle existe */}
      <div
        className={`h-32 w-full rounded-b-xl overflow-hidden relative ${
          hasBanner ? '' : 'bg-transparent'
        }`}
      >
        {hasBanner && (
          <Image
            src={profile.banner_url}
            alt="Bannière"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Avatar qui chevauche */}
      <div className="absolute top-20 left-4 w-24 h-24 border-4 border-black rounded-full overflow-hidden z-10">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-700" />
        )}
      </div>

      {/* Infos */}
      <div className="mt-5 pl-32 pr-4">
        <div className="text-xl font-bold">@{profile?.username || 'Mon profil'}</div>
        <div className="text-sm text-zinc-400">0 abonnés · 0 abonnements</div>

        <p className="mt-2 text-sm text-zinc-300">
          {profile?.bio || <i>Aucune bio renseignée</i>}
        </p>

        {typeof profile?.subscription_price === 'number' && (
        <p className="text-sm text-violet-400 mt-1">
            Abonnement :{' '}
            {profile.subscription_price === 0
            ? 'Gratuit'
            : `${profile.subscription_price.toFixed(2)} € / mois`}
        </p>
        )}

      </div>
    </div>
  )
}
