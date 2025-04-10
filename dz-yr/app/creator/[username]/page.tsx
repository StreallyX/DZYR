import { supabase } from '@/lib/supabase'

export async function generateStaticParams() {
  const { data: users } = await supabase.from('users').select('username')
  return users?.map((user) => ({ username: user.username })) ?? []
}

export default async function CreatorProfilePage({ params }: { params: { username: string } }) {
  const { username } = params
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return <div>Créateur introuvable.</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{profile.username}</h1>
      <p className="text-gray-600">{profile.bio ?? 'Aucune bio.'}</p>

      {/* Plus tard ici : liste de ses contenus payants */}
    </div>
  )
}
