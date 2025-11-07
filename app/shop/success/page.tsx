import Link from 'next/link'

export default function ShopSuccessPage() {
  const ebookUrl = process.env.NEXT_PUBLIC_EBOOK_ADMIN_URL || 'https://api1w.ilovepdf.com/v1/download/1xg1kgcc2fl2Am6lxq6pnvc2ndl7cvsrpttsAn0yvr356p7kbkjt6q2wdv4bjvt3589s8d2qq0zqq5ykfqsjcdf3q1A1gx45212y5f1y90627fw8y6b7vpvlk4gl24x68vk1zh0cm1zq01n7fp7b3x0ds5lz87r27zvjvrh2z0m119mvz2g1'
  return (
    <main className="container-xl py-16 space-y-8 text-center">
      <h1 className="text-3xl font-bold text-[#0F172A]">Paiement confirmé ✅</h1>
      <p className="text-[#475569] max-w-xl mx-auto">Merci pour ton achat. Tu vas recevoir un email de confirmation. Si tu ne reçois rien sous 10 minutes, contacte-nous.</p>

      {ebookUrl ? (
        <div className="mx-auto max-w-xl text-left rounded-xl border border-[#E2E8F0] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0F172A]">Télécharger l'ebook — Administratif complet</h2>
          <p className="text-sm text-[#475569] mt-1">Clique sur le bouton ci‑dessous pour récupérer le PDF.</p>
          <div className="mt-3">
            <a href={ebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded bg-[#0F172A] text-white hover:opacity-90">Télécharger le PDF</a>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-3">
        <Link href="/" className="text-white bg-[#0F172A] px-4 py-2 rounded hover:opacity-90">Retour à l'accueil</Link>
        <Link href="/shop" className="text-[#2563EB]">Retour à la boutique</Link>
      </div>
    </main>
  )
}
