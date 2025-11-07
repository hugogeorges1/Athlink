export default function NotFound() {
  return (
    <main className="container-xl py-20 text-center space-y-3">
      <h1 className="text-3xl font-bold text-[#0F172A]">Page introuvable</h1>
      <p className="text-[#64748B]">La page demandée n'existe pas ou a été déplacée.</p>
      <a href="/" className="inline-block mt-2 text-white bg-[#0F172A] px-4 py-2 rounded">Retour à l'accueil</a>
    </main>
  )
}
