'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ConversationPage() {
  const { conversationId } = useParams() as { conversationId: string }
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState('')
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll auto en bas
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const session = await supabase.auth.getSession()
      const user = session.data.session?.user
      if (!user) return

      setUserId(user.id)

      // Vérifie accès
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

      // Charge messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
    }

    if (conversationId) fetchMessages()
  }, [conversationId])

  // Realtime messages
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

  // Scroll à chaque nouveau message
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const { error: insertError } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        content: newMessage,
      },
    ])

    if (!insertError) {
      setNewMessage('')
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    }
  }

  if (hasAccess === false) {
    return (
      <div className="p-4 text-red-600 font-bold">
        ❌ Vous n'avez pas accès à cette conversation.
      </div>
    )
  }

  if (hasAccess === null) return <div className="p-4">Chargement...</div>

  return (
    <div className="flex flex-col h-screen p-4 pb-24">
      <h2 className="text-xl font-bold mb-4">💬 Conversation</h2>

      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === userId
          return (
            <div
              key={index}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-xl px-4 py-2 max-w-xs ${
                  isMe ? 'bg-pink-600 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 fixed bottom-6 left-4 right-4 bg-white p-3 rounded-xl shadow-md">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300"
          placeholder="Votre message..."
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
