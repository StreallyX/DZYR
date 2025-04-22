'use client'

import ContentPreviewCard from './ContentPreviewCard'

type Props = {
  contents: any[]
  viewer: {
    id: string
    subscribedTo?: string[]
    purchasedContentIds?: string[]
  }
  onRefresh?: () => void
}

export default function ContentFeed({ contents, viewer, onRefresh }: Props) {
  if (!viewer?.id) {
    return <div className="text-center text-red-500">⚠️ Non connecté</div>
  }

  return (
    <div className="flex flex-col gap-4 px-4 mt-6">
      {contents.map((content) => (
        <ContentPreviewCard
          key={content.id}
          contentId={content.id}
          viewer={viewer}
          onUnlocked={onRefresh}
        />
      ))}
    </div>
  )
}
