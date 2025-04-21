'use client'

import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline'
}

export function Button({ variant = 'default', className = '', ...props }: Props) {
  const base = 'px-4 py-2 rounded-lg font-semibold transition'
  const variants = {
    default: 'bg-violet-600 text-white hover:bg-violet-700',
    outline: 'border border-violet-500 text-violet-500 hover:bg-violet-100',
  }

  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${className}`}
    />
  )
}
