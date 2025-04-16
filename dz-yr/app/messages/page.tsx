'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [usersMap, setUsersMap] = useState<Record<string, any>>({})
  const router = useRouter()

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return

      setUserId(user.id)

      // Récupère toutes les conversations où le user est soit user1 soit user2
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      setConversations(convs || [])

      // Charge les profils de tous les utilisateurs liés
      const userIds = new Set<string>()
      for (const conv of convs || []) {
        if (conv.user1_id !== user.id) userIds.add(conv.user1_id)
        if (conv.user2_id !== user.id) userIds.add(conv.user2_id)
      }

      if (userIds.size > 0) {
        const { data: userProfiles } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', Array.from(userIds))

        const map: Record<string, any> = {}
        for (const u of userProfiles || []) {
          map[u.id] = u
        }
        setUsersMap(map)
      }
    }

    fetchConversations()
  }, [])

  const handleOpenChat = (conversationId: string) => {
    router.push(`/messages/${conversationId}`)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mes Messages</h1>
      <ul className="space-y-3">
        {conversations.map((conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
          const otherUser = usersMap[otherUserId]

          return (
            <li
              key={conv.id}
              onClick={() => handleOpenChat(conv.id)}
              className="bg-gray-800 text-white rounded-xl p-3 cursor-pointer hover:bg-gray-700 flex items-center gap-3"
            >
              {otherUser?.avatar_url && (
                <img
                  src={otherUser.avatar_url}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold">
                  {otherUser?.username || 'Utilisateur inconnu'}
                </p>
                <p className="text-sm text-gray-300 truncate max-w-xs">
                  {conv.last_message || 'Aucun message'}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
