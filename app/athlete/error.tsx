"use client"

import { useEffect } from 'react'

export default function AthleteError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('Athlete route error:', error)
  }, [error])

  return (
    <div className="container-xl py-12 space-y-4">
      <h1 className="text-3xl font-bold text-[#0F172A]">Une erreur est survenue</h1>
      <p className="text-[#64748B]">{error.message || 'Erreur inconnue'}</p>
      <button className="px-4 py-2 bg-[#0F172A] text-white rounded" onClick={() => reset()}>Réessayer</button>
    </div>
  )
}
