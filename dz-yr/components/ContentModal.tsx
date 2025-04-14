import SecureImageViewer from './SecureImageViewer'
import { useState } from 'react'

type Props = {
  item: any
  blob: Blob | undefined
  onClose: () => void
}

export default function ContentModal({ item, blob, onClose }: Props) {
  const [comment, setComment] = useState('')

  const handleLike = () => {
    console.log('TODO: Liker item.id')
  }

  const handleComment = () => {
    console.log('TODO: Envoyer commentaire', comment)
    setComment('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-4 rounded shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl"
        >
          &times;
        </button>

        {blob ? (
          <SecureImageViewer
            blob={blob}
            width={400}
            height={400}
            className="w-full h-auto"
          />
        ) : (
          <div className="w-full h-80 bg-zinc-800 animate-pulse rounded" />
        )}

        <div className="mt-3">
          <p className="text-white italic text-sm">{item.description}</p>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleLike}
              className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-500"
            >
              ❤️ Like
            </button>

            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="text-sm px-2 py-1 rounded bg-zinc-800 text-white border border-zinc-700"
              />
              <button
                onClick={handleComment}
                className="bg-white text-black px-2 py-1 rounded text-sm hover:bg-gray-200"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
