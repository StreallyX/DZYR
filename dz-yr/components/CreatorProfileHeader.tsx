import Image from 'next/image'

type Props = {
  profile: any
  isSubscribed: boolean
  onSubscribe?: () => void
}

export default function CreatorProfileHeader({ profile, isSubscribed, onSubscribe }: Props) {
  return (
    <div className="mb-4 relative">
      {/* Bannière */}
      <div className="h-36 w-full bg-zinc-700 rounded-md mb-4 overflow-hidden">
        {profile.banner_url && (
          <Image src={profile.banner_url} alt="banner" fill className="object-cover" />
        )}
      </div>

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">@{profile.username}</h1>
            {!isSubscribed && profile.subscription_price > 0 && (
              <button
                onClick={onSubscribe}
                className="bg-black text-white text-sm px-3 py-1 rounded font-bold hover:bg-gray-800"
              >
                SUBSCRIBE {profile.subscription_price.toFixed(2)}$ / Month
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm italic">{profile.bio ?? 'Aucune bio.'}</p>

          <div className="text-sm text-gray-400 mt-1">
            <span>{profile.total_contents ?? 0} Contents</span> ·{' '}
            <span>{profile.total_subs ?? 0} Subs</span> ·{' '}
            <span>{profile.total_follow ?? 0} Follow</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-zinc-700 rounded-full" />
          )}
          <button className="bg-pink-600 text-white text-sm px-4 py-1 rounded hover:bg-pink-500">
            SHOP
          </button>
        </div>
      </div>
    </div>
  )
}
