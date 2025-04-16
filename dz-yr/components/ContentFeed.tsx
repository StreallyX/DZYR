'use client'

import Image from 'next/image'

type Props = {
  contents: any[]
  signedUrls: Record<string, string>
  isOwnProfile: boolean
  onSelect: (item: any) => void
}

export default function ContentFeed({ contents, signedUrls, isOwnProfile, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4 px-4 mt-6">
      {contents.map((item) => {
        const isLocked = !isOwnProfile && !item.is_free

        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-zinc-800 rounded-xl overflow-hidden shadow-md cursor-pointer hover:bg-zinc-700 transition-all"
          >
            {signedUrls[item.id] && (
              <img
                src={signedUrls[item.id]}
                alt="content"
                className={`w-full h-64 object-cover transition-all duration-200 ${
                  isLocked ? 'blur-[6px] scale-105' : ''
                }`}
              />
            )}

            <div className="p-4">
              <p className="text-sm text-white mb-1">{item.description || <i>Aucune description</i>}</p>

              <p className="text-xs text-zinc-400">
                {item.sub_required
                  ? 'Abonnement requis'
                  : item.is_free
                  ? 'Gratuit'
                  : `${item.price} €`}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
