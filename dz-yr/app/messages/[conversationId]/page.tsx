'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ContentPreviewCard from '@/components/ContentPreviewCard'
import ContentSelectorModal from '@/components/ContentSelectorModal'

/* ----- constants ----- */
const PAGE_SIZE = 15

/* ----- helpers ----- */
const log = (...a: any[]) => console.log('[Conv]', ...a)

export default function ConversationPage() {
  const { conversationId }  = useParams() as { conversationId: string }
  const router               = useRouter()

  /* --- state --- */
  const [messages, setMsgs]  = useState<any[]>([])
  const [cursor,   setCur]   = useState<string | null>(null)    // created_at du + ancien
  const [loading,  setLoad]  = useState(false)
  const [hasMore,  setMore]  = useState(true)

  const [userId,   setUid]   = useState('')
  const [viewer,   setView]  = useState<any>({                 // FIX : objet par défaut
    purchasedContentIds: [],
    subscribedTo:        []
  })

  const [newMsg,   setNew]   = useState('')
  const [sel,      setSel]   = useState<any>(null)
  const [showModal,setModal] = useState(false)

  /* --- refs --- */
  const listRef   = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const keepPos   = useRef<{h:number; t:number}>({h:0,t:0})
  const firstLoad = useRef(true)                                // FIX : pour 1ᵉʳ scroll

  /* --- viewer --- */
  const refreshViewer = async (uid: string) => {
    const { data: purchases } = await supabase
      .from('purchases').select('content_id').eq('user_id', uid)

    const { data: subs } = await supabase
      .from('subscriptions').select('creator_id,end_date').eq('subscriber_id', uid)

    const now   = new Date()
    const valid = subs?.filter(s => new Date(s.end_date) > now) || []

    setView({
      id: uid,
      purchasedContentIds: purchases?.map(p => String(p.content_id)) || [],
      subscribedTo:        valid.map(s => s.creator_id)
    })
  }

  /* --- scroll helpers --- */
  const scrollToBottom = (smooth=false) =>
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })

  const preserveScroll = () => {
    const el = listRef.current
    if (!el) return
    const { h, t } = keepPos.current
    el.scrollTop = el.scrollHeight - h + t
  }

  /* --- fetch one batch --- */
  const fetchBatch = async (before?: string) => {
    if (loading || (!hasMore && before)) return
    log('fetch', before ?? 'latest')
    setLoad(true)

    const q = supabase.from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (before) q.lt('created_at', before)
    const { data } = await q

    if (!data || data.length === 0) {
      setMore(false)
      setLoad(false)
      return
    }

    const batch = data.reverse()                // ASC : plus vieux d’abord
    setCur(batch[0].created_at)                // FIX : nouveau curseur

    /* merge sans doublons */
    setMsgs(prev => {
      const unique: Record<string, any> = {}
      ;[...batch, ...prev].forEach(m => { unique[m.id] = m })
      return Object.values(unique).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    setLoad(false)
  }

  /* --- init (user, viewer, premier lot) --- */
  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      setUid(user.id)
      await refreshViewer(user.id)
      await fetchBatch()                       // latest
    }
    if (conversationId) run()
  }, [conversationId])

  

  /* --- scroll automatique après le rendu du 1ᵉ lot & après images --- */
  useEffect(() => {
    if (firstLoad.current && messages.length > 0) {
      firstLoad.current = false
      // Laisser le temps aux images / cartes de prendre leur place
      setTimeout(() => scrollToBottom(false), 60)              // FIX
    }
  }, [messages])

  /* --- infinite scroll (haut) --- */
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollTop < 60 && !loading && hasMore) {
        keepPos.current = { h: el.scrollHeight, t: el.scrollTop }
        fetchBatch(cursor ?? undefined).then(() => requestAnimationFrame(preserveScroll))
      }
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [cursor, loading, hasMore])

  /* --- realtime insert (bas) --- */
  useEffect(() => {
    if (!conversationId) return
    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        payload => setMsgs(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]))
    ch.subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [conversationId])

  /* --- send --- */
  const send = async () => {
    if (!newMsg.trim() && !sel) return
    await supabase.from('messages').insert([{
      conversation_id: conversationId,
      sender_id:       userId,
      content:         newMsg.trim() || null,
      content_id:      sel?.id ?? null
    }])
    setNew(''); setSel(null)
    setTimeout(() => scrollToBottom(true), 40)
  }

  /* --- render --- */
  return (
    <div className="fixed inset-0 flex flex-col max-w-md mx-auto bg-black">
      {/* Header fixe en haut */}
      <div className="p-4 border-b border-zinc-700 flex items-center h-14 shrink-0">
        <button onClick={() => router.back()} className="mr-2">←</button>
        <span className="font-bold">💬 Conversation</span>
      </div>

      {/* Liste de messages avec scroll auto */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
        style={{ height: 'calc(100vh - 3.5rem - 4.2rem)' }} // 3.5rem (header) + 4.2rem (footer)
      >
        {messages.map(m => {
          const isMe = m.sender_id === userId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-xl ${isMe ? 'bg-blue-500 text-white' : 'bg-zinc-300 text-black'}`}>
                {m.content_id
                  ? <ContentPreviewCard contentId={m.content_id} viewer={viewer} />
                  : m.content}
              </div>
            </div>
          )
        })}
        {loading && <p className="text-center text-xs text-gray-400">⏳ Chargement…</p>}
        <div ref={bottomRef} />
      </div>

      {/* Footer fixe en bas */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-3 h-16 shrink-0">
        <div className="flex gap-2">
          <input
            value={newMsg}
            onChange={e => setNew(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Votre message…"
            className="flex-1 bg-zinc-900 text-white p-2 rounded"
          />
          <button onClick={send} className="bg-violet-600 px-4 rounded">Envoyer</button>
        </div>
      </div>

      {showModal && (
        <ContentSelectorModal
          onSelect={i => { setSel(i); setModal(false) }}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  )
}
