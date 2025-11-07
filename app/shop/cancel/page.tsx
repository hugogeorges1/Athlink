import Link from 'next/link'

export default function ShopCancelPage() {
  return (
    <main className="container-xl py-16 space-y-6 text-center">
      <h1 className="text-3xl font-bold text-[#0F172A]">Paiement annulé</h1>
      <p className="text-[#475569] max-w-xl mx-auto">Le paiement a été annulé. Tu peux réessayer quand tu veux.</p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/shop" className="text-white bg-[#0F172A] px-4 py-2 rounded hover:opacity-90">Retour à la boutique</Link>
        <Link href="/" className="text-[#2563EB]">Accueil</Link>
      </div>
    </main>
  )
}
