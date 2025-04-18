'use client'

import ContentPreviewCard from './ContentPreviewCard'

type Props = {
  contents: any[]
  viewer: {
    id: string
    subscribedTo?: string[]
    purchasedContentIds?: string[]
  }
  onRefresh?: () => void // ✅ on rend cette prop optionnelle
}

export default function ContentFeed({ contents, viewer, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-4 px-4 mt-6">
      {contents.map((content) => (
        <ContentPreviewCard
          key={content.id}
          contentId={content.id}
          viewer={viewer}
          onUnlocked={onRefresh} // ✅ Propagée au bon endroit
        />
      ))}
    </div>
  )
}
