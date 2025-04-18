'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'

type Props = {
  onSelect: (item: any) => void
  onClose: () => void
}

export default function ContentSelectorModal({ onSelect, onClose }: Props) {
  const [contents, setContents] = useState<any[]>([])

  useEffect(() => {
    const fetchMyContents = async () => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id

      if (!userId) return

      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', userId)

      if (error) console.error('Erreur contenu :', error)
      else setContents(data)
    }

    fetchMyContents()
  }, [])

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-lg font-bold">📎 Sélectionne un contenu à envoyer</h2>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {contents.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
              onClick={() => onSelect(item)}
            >
              <p className="text-white text-sm mb-1 truncate">{item.description}</p>
              <p className="text-xs text-zinc-400">
                {item.is_free ? 'Gratuit' : item.price + '€'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
