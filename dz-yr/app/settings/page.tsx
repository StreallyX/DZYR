'use client'

import Link from 'next/link'

export default function SettingsMainPage() {
  const sections = [
    { name: 'Notifications', href: '/settings/notifications' },
    { name: 'Confidentialité', href: '/settings/privacy' },
    { name: 'Sécurité', href: '/settings/security' },
    { name: 'Mon compte', href: '/settings/account' },
  ]

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      <ul className="space-y-4">
        {sections.map((section) => (
          <li key={section.name}>
            <Link
              href={section.href}
              className="block p-4 rounded bg-zinc-800 hover:bg-zinc-700 transition"
            >
              {section.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
