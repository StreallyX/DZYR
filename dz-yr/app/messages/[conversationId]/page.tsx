'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ContentPreviewCard from '@/components/ContentPreviewCard'
import ContentSelectorModal from '@/components/ContentSelectorModal'

export default function ConversationPage() {
  const { conversationId } = useParams() as { conversationId: string }
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [viewer, setViewer] = useState<any>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const refreshViewer = async (uid: string) => {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('content_id')
      .eq('user_id', uid)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('creator_id, end_date')
      .eq('subscriber_id', uid)

    const now = new Date()
    const validSubscriptions = subscriptions?.filter(sub => new Date(sub.end_date) > now) || []

    setViewer({
      id: uid,
      purchasedContentIds: purchases?.map(p => String(p.content_id)) || [],
      subscribedTo: validSubscriptions.map(sub => sub.creator_id),
    })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const session = await supabase.auth.getSession()
      const user = session.data.session?.user
      if (!user) return

      setUserId(user.id)
      await refreshViewer(user.id)

      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
        setHasAccess(false)
        return
      }
      setHasAccess(true)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
    }

    if (conversationId) fetchMessages()
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !userId) return
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedContent) return

    const payload: any = {
      conversation_id: conversationId,
      sender_id: userId,
    }

    if (newMessage.trim()) payload.content = newMessage.trim()
    if (selectedContent?.id) payload.content_id = selectedContent.id

    const { error: insertError } = await supabase.from('messages').insert([payload])

    if (insertError) {
      console.error("❌ Erreur lors de l'envoi :", insertError)
      return
    }

    await supabase
      .from('conversations')
      .update({
        last_message: newMessage.trim() || '[Contenu]',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    setNewMessage('')
    setSelectedContent(null)
  }

  if (hasAccess === false) return <div className="p-4 text-red-600 font-bold">❌ Accès refusé</div>
  if (hasAccess === null) return <div className="p-4">⏳ Chargement...</div>

  return (
    <div className="fixed inset-0 flex flex-col max-w-md mx-auto bg-black">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-zinc-700">
        <button onClick={() => router.back()} className="mr-2 text-gray-400 hover:text-white">
          ← Retour
        </button>
        <h2 className="text-xl font-bold">💬 Conversation</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" ref={containerRef}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-xl px-4 py-2 max-w-xs ${isMe ? 'bg-blue-500 text-white' : 'bg-zinc-300 text-black'}`}>
                {msg.content_id ? (
                  <>
                    <ContentPreviewCard
                      contentId={msg.content_id}
                      viewer={viewer}
                      onUnlocked={() => refreshViewer(userId)}
                    />
                    {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="w-full bg-zinc-950 p-3 border-t border-zinc-800">
        {selectedContent && (
          <div className="mb-2">
            <p className="text-sm text-zinc-300">Contenu sélectionné : {selectedContent.description}</p>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowModal(true)}
            className="text-white text-xl hover:text-violet-400"
          >
            📎
          </button>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Votre message..."
            className="flex-1 p-2 rounded border border-zinc-700 bg-zinc-900 text-white"
          />
          <button
            onClick={sendMessage}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-bold"
          >
            Envoyer
          </button>
        </div>
      </div>

      {/* Content selector */}
      {showModal && (
        <ContentSelectorModal
          onSelect={(item) => {
            setSelectedContent(item)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
