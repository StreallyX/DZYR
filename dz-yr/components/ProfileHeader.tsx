'use client'

import Image from 'next/image'

type Props = {
  profile: any
  isOwnProfile: boolean
  onEditProfile: () => void
}

export default function ProfileHeader({ profile, isOwnProfile, onEditProfile }: Props) {
  return (
    <div className="relative w-full mb-4">
      {/* Bannière */}
      <div className="h-32 bg-zinc-800 w-full rounded-b-xl" />

      {/* Avatar qui chevauche */}
      <div className="absolute top-20 left-4 w-24 h-24 border-4 border-black rounded-full overflow-hidden z-10">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="avatar"
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

        {profile?.subscription_price && (
          <p className="text-sm text-violet-400 mt-1">
            Abonnement : {profile.subscription_price.toFixed(2)} € / mois
          </p>
        )}
      </div>
    </div>
  )
}
