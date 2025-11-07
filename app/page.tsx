import Link from 'next/link'

export default function Home() {
  return (
    <main className="container-xl py-16 space-y-20">
      <section className="relative overflow-hidden rounded-2xl min-h-[380px]">
        {/* BG image blurred */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-athletes.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(12px)',
            transform: 'scale(1.08)',
            opacity: 0.6
          }}
        />
        {/* Blue→Orange overlay */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient( to bottom right, rgba(15,23,42,0.55), rgba(249,115,22,0.55))'
          }}
        />
        {/* Content */}
        <div className="relative z-10 px-6 py-20 text-center">
          <h1 className="text-5xl font-bold text-[#0F172A]">Relier les athlètes et les coachs NCAA</h1>
          <p className="text-lg text-[#0F172A] max-w-3xl mx-auto mt-4">
            ATHLINK aide les athlètes à mettre en avant leurs highlights et à se faire repérer par les coachs universitaires américains.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/auth/sign-up" className="inline-flex items-center rounded-md bg-[#0F172A] px-6 py-3 text-white hover:opacity-90">Créer mon profil</Link>
            <Link href="/discover" className="inline-flex items-center rounded-md bg-[#F97316] px-6 py-3 text-white hover:bg-[#EA580C]">Voir un exemple</Link>
            {process.env.NEXT_PUBLIC_DEMO_COACH_SLUG ? (
              <Link href={`/c/${process.env.NEXT_PUBLIC_DEMO_COACH_SLUG}`} className="inline-flex items-center rounded-md bg-[#0EA5E9] px-6 py-3 text-white hover:bg-[#0284C7]">Exemple coach</Link>
            ) : null}
            {process.env.NEXT_PUBLIC_DEMO_ATHLETE_SLUG ? (
              <Link href={`/u/${process.env.NEXT_PUBLIC_DEMO_ATHLETE_SLUG}`} className="inline-flex items-center rounded-md bg-[#16A34A] px-6 py-3 text-white hover:bg-[#15803D]">Exemple athlète</Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl p-6 space-y-2 bg-[#EFF6FF] border border-[#BFDBFE]">
          <h3 className="text-xl font-semibold text-[#0F172A]">Pour les athlètes</h3>
          <p className="text-[#334155]">Crée un profil complet (sport, académique), ajoute des highlights (upload ou YouTube), et partage un lien public simple.</p>
        </div>
        <div className="rounded-xl p-6 space-y-2 bg-[#FFF7ED] border border-[#FED7AA]">
          <h3 className="text-xl font-semibold text-[#0F172A]">Pour les coachs</h3>
          <p className="text-[#334155]">Parcours les profils, like des highlights, et suis les athlètes pertinents. Profil coach dédié inclus.</p>
        </div>
        <div className="rounded-xl p-6 space-y-2 bg-[#F8FAFC] border border-[#E2E8F0]">
          <h3 className="text-xl font-semibold text-[#0F172A]">100% gratuit</h3>
          <p className="text-[#334155]">Aucune barrière d’entrée: inscris‑toi, crée ton profil, publie des vidéos, partage ton lien public.</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-[#0F172A] text-center">Comment ça marche</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-6 text-white bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]">
            <div className="text-sm uppercase tracking-wide text-white/80 mb-2">Étape 1</div>
            <div className="text-lg font-semibold mb-1">Crée ton compte</div>
            <p className="text-white/90">Inscris‑toi comme athlète ou coach. Les athlètes accèdent directement à leur profil.</p>
          </div>
          <div className="rounded-xl p-6 text-white bg-gradient-to-br from-[#F97316] to-[#EA580C]">
            <div className="text-sm uppercase tracking-wide text-white/80 mb-2">Étape 2</div>
            <div className="text-lg font-semibold mb-1">Construis ton profil</div>
            <p className="text-white/90">Renseigne tes infos personnelles, académiques, ajoute tes highlights, choisis un highlight “Mis en avant”.</p>
          </div>
          <div className="rounded-xl p-6 text-white bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]">
            <div className="text-sm uppercase tracking-wide text-white/80 mb-2">Étape 3</div>
            <div className="text-lg font-semibold mb-1">Partage et découvre</div>
            <p className="text-white/90">Partage ton profil et découvre d’autres athlètes.</p>
          </div>
        </div>
        <div className="text-center">
          <Link href="/auth/sign-up" className="inline-flex items-center rounded-md bg-[#F97316] px-6 py-3 text-white hover:bg-[#EA580C]">Commencer maintenant</Link>
        </div>
      </section>
    </main>
  )
}
