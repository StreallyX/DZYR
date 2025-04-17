'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SecureVideoPlayer from '@/components/SecureVideoPlayer'
import SecureImageViewer from '@/components/SecureImageViewer'

type Props = {
  item: {
    id: string
    title: string
    description?: string
    media_type?: string
    media_path: string
  }
  blob: Blob
}

type Comment = {
  id: string
  content_id: string
  user_id: string
  username: string
  message: string
  created_at: string
}

export default function SecureContentCard({ item }: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)

  const [likes, setLikes] = useState<number>(0)
  const [liked, setLiked] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    const load = async () => {
      const session = await supabase.auth.getSession()
      const uid = session.data.session?.user.id ?? null
      setUserId(uid)
      if (!uid) return

      const { data: userProfile } = await supabase
        .from('users')
        .select('username')
        .eq('id', uid)
        .single()

      setUser({ id: uid, username: userProfile?.username || 'unknown' })

      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', item.id)

      setLikes(likeCount ?? 0)

      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('content_id', item.id)
        .eq('user_id', uid)
        .maybeSingle()

      setLiked(!!existingLike)

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('content_id', item.id)
        .order('created_at', { ascending: true })

      setComments(commentsData ?? [])
    }

    load()
  }, [item.id])

  const toggleLike = async () => {
    if (!userId) return

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', item.id)
    } else {
      await supabase.from('likes').insert({
        user_id: userId,
        content_id: item.id,
      })
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', item.id)

    setLikes(count ?? 0)
    setLiked(!liked)
  }

  const submitComment = async () => {
    if (!newComment.trim() || !user) return

    const { error } = await supabase.from('comments').insert({
      content_id: item.id,
      user_id: user.id,
      username: user.username,
      message: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      const { data: updated } = await supabase
        .from('comments')
        .select('*')
        .eq('content_id', item.id)
        .order('created_at', { ascending: true })

      setComments(updated ?? [])
    }
  }

  return (
    <div className="relative">
      <h2 className="text-lg font-bold mb-2">{item.title}</h2>

      <div className="relative border border-zinc-700 rounded overflow-hidden mb-4">
        {item.media_type === 'video' ? (
          <SecureVideoPlayer contentId={item.id} />
        ) : (
          <SecureImageViewer path={item.media_path} />
        )}
      </div>

      {item.description && (
        <p className="text-sm italic text-zinc-400 mb-2">{item.description}</p>
      )}

      <div className="flex justify-between items-center mb-4 text-sm text-zinc-400">
        <span>{likes} ❤️ like(s)</span>
        <span>{comments.length} 💬 commentaire(s)</span>
      </div>

      <button
        onClick={toggleLike}
        className={`mb-4 px-4 py-1 text-sm font-bold rounded ${
          liked ? 'bg-pink-600 text-white' : 'bg-zinc-700 text-zinc-300'
        }`}
      >
        {liked ? '❤️ Liked' : '🤍 Like'}
      </button>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Ajouter un commentaire..."
        className="w-full bg-zinc-800 p-2 rounded text-sm mb-2"
      />
      <button
        onClick={submitComment}
        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1 rounded text-sm mb-6"
      >
        Commenter
      </button>

      <div className="space-y-4 max-h-52 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="bg-zinc-800 p-3 rounded text-sm text-zinc-300">
            <div className="font-semibold text-white mb-1">@{c.username}</div>
            <div>{c.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
