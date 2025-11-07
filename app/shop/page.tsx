import Link from 'next/link'

export default function ShopPage() {
  const linkEbook = process.env.NEXT_PUBLIC_STRIPE_LINK_EBOOK_ADMIN || 'https://buy.stripe.com/7sYcN55Lad0R7My0ny5Ne00'
  return (
    <main className="container-xl py-12 space-y-10">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-[#0F172A]">Boutique</h1>
        <p className="text-[#64748B]">Ressources et services pour t'aider dans ton projet NCAA</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-[#0F172A]">Ebook — Administratif complet</h2>
          <p className="text-sm text-[#475569] mt-1">Visa, bulletins, inscription à l'université, étapes clés et modèles.</p>
          <div className="mt-4 text-2xl font-bold text-[#0F172A]">75 €</div>
          <div className="mt-auto pt-4">
            {linkEbook ? (
              <a href={linkEbook} className="inline-flex items-center px-4 py-2 rounded bg-[#0F172A] text-white hover:opacity-90">Acheter</a>
            ) : (
              <span className="text-xs text-[#64748B]">Lien de paiement non configuré</span>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#E2E8F0] bg-white p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-[#0F172A]">Accompagnement complet</h2>
          <p className="text-sm text-[#475569] mt-1">Suivi personnalisé du joueur — admins, sport, candidatures, jusqu'à l'inscription.</p>
          <div className="mt-4 text-2xl font-bold text-[#0F172A]">2 500 €</div>
          <div className="mt-auto pt-4">
            <a href="mailto:athlink.usa@gmail.com?subject=Accompagnement%20complet%20ATHLINK&body=Bonjour%5Cn%5Cnje%20souhaite%20d%C3%A9marrer%20l'accompagnement%20complet.%20Merci%20de%20me%20recontacter.%5Cn%5Cn-%20Nom%3A%20%5Cn-%20Sport%3A%20%5Cn-%20Poste%3A%20%5Cn-%20T%C3%A9l%C3%A9phone%3A%20" className="inline-flex items-center px-4 py-2 rounded bg-[#F97316] text-white hover:bg-[#EA580C]">Nous contacter</a>
          </div>
        </article>
      </section>

      <div className="text-center text-sm text-[#64748B]">
        <p>Après paiement, tu seras redirigé vers une page de confirmation.</p>
        <div className="mt-2">
          <Link href="/shop/success" className="text-[#2563EB]">Voir un exemple de confirmation</Link>
        </div>
      </div>
    </main>
  )
}
