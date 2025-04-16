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

  const scrollToBottom = () => {
    console.log("✅ Scroll vers le bas")
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      console.log("📦 Fetching session...")
      const session = await supabase.auth.getSession()
      const user = session.data.session?.user
      console.log("📦 Session :", session)

      if (!user) {
        console.warn("❌ Aucun utilisateur connecté")
        return
      }

      setUserId(user.id)
      console.log("👤 User ID :", user.id)

      console.log("🔒 Vérification d'accès à la conversation :", conversationId)
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) console.error("⚠️ Erreur récupération conversation :", convError)
      else console.log("📄 Conversation récupérée :", conv)

      if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
        console.warn("🔒 Accès refusé à cette conversation")
        setHasAccess(false)
        return
      }

      setHasAccess(true)

      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgsError) console.error("⚠️ Erreur récupération messages :", msgsError)
      else console.log("💬 Messages récupérés :", msgs)

      setMessages(msgs || [])
    }

    if (conversationId) {
      console.log("🆔 conversationId détecté :", conversationId)
      fetchMessages()
    } else {
      console.warn("❌ conversationId manquant")
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !userId) {
      console.warn("⛔️ Pas encore prêt pour realtime (conversationId ou userId manquant)")
      return
    }

    console.log("📡 Abonnement realtime à :", conversationId)
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
          console.log("📩 Nouveau message en temps réel :", payload.new)
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      console.log("🧹 Suppression du canal realtime")
      supabase.removeChannel(channel)
    }
  }, [conversationId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.warn("🛑 Message vide, rien à envoyer")
      return
    }

    console.log("🚀 Envoi du message :", newMessage)
    console.log("📦 conversationId:", conversationId)
    console.log("👤 sender_id:", userId)

    const { error: insertError } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        content: newMessage,
      },
    ])

    if (insertError) {
      console.error("❌ Erreur lors de l'envoi du message :", insertError)
    } else {
      console.log("✅ Message envoyé avec succès")
      setNewMessage('')

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      if (updateError) {
        console.error("⚠️ Erreur lors de la mise à jour de la conversation :", updateError)
      } else {
        console.log("🔄 Conversation mise à jour avec le dernier message")
      }
    }
  }

  if (hasAccess === false) {
    return (
      <div className="p-4 text-red-600 font-bold">
        ❌ Vous n'avez pas accès à cette conversation.
      </div>
    )
  }

  if (hasAccess === null) return <div className="p-4">⏳ Chargement...</div>

  return (
    <div className="flex flex-col h-screen p-4">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => {
            console.log("↩️ Retour arrière")
            router.back()
          }}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </button>
        <h2 className="text-xl font-bold">💬 Conversation</h2>
      </div>

      {/* Affichage des messages */}
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
                  isMe
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-300 text-black shadow'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Zone d'envoi de message */}
      <div className="mt-4">
        <div className="flex gap-2 bg-white p-3 rounded-xl shadow-md">
          <input
            value={newMessage}
            onChange={(e) => {
              console.log("📝 Saisie message :", e.target.value)
              setNewMessage(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                console.log("⏎ Touche Enter pressée")
                sendMessage()
              }
            }}
            className="flex-1 p-2 rounded border border-gray-300 text-black placeholder-gray-500"
            placeholder="Votre message..."
          />
          <button
            onClick={() => {
              console.log("📤 Bouton 'Envoyer' cliqué")
              sendMessage()
            }}
            className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}
