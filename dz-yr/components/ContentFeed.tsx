'use client'

import ContentPreviewCard from './ContentPreviewCard'
import { useRouter } from 'next/navigation'

type Props = {
  contents: any[]
  signedUrls: Record<string, string>
  blobMap: Record<string, Blob>
  isOwnProfile: boolean
  purchasedIds?: string[]
  isSubscribed?: boolean
  creator: any
}

export default function ContentFeed({
  contents,
  signedUrls,
  blobMap,
  isOwnProfile,
  purchasedIds = [],
  isSubscribed = false,
  creator,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4 px-4 mt-6">
      {contents.map((item) => {
        const isFree = item.is_free
        const isForSubscribers = item.sub_required && isSubscribed
        const isPurchased = purchasedIds.includes(item.id)
        const canView = isFree || isForSubscribers || isPurchased || isOwnProfile

        return (
          <ContentPreviewCard
            key={item.id}
            item={item}
            signedUrl={signedUrls[item.id]}
            blobMap={blobMap}
            canView={canView}
            creator={creator}
            onUnlocked={() => router.refresh()}
          />
        )
      })}
    </div>
  )
}
