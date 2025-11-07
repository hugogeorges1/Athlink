"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <main className="container-xl py-20 text-center space-y-3">
          <h1 className="text-3xl font-bold text-[#0F172A]">Une erreur est survenue</h1>
          <p className="text-[#64748B]">Désolé, un problème technique est survenu. Réessaie dans un instant.</p>
          <div className="space-x-2">
            <button onClick={() => reset()} className="inline-block mt-2 text-white bg-[#0F172A] px-4 py-2 rounded">Réessayer</button>
            <a href="/" className="inline-block mt-2 text-[#0F172A] bg-[#F1F5F9] px-4 py-2 rounded">Retour à l'accueil</a>
          </div>
          {process.env.NODE_ENV !== 'production' && error?.digest && (
            <div className="mt-4 text-xs text-[#94A3B8]">Erreur: {error.digest}</div>
          )}
        </main>
      </body>
    </html>
  )
}
