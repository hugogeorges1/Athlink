import { HighlightsPublic } from '@/components/profile/HighlightsPublic'

export default function PublicAthletePageById({ params }: { params: { id: string } }) {
  const userId = params.id
  return (
    <main className="container-xl py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-[#0F172A]">Profil Athlète</h1>
        <p className="text-[#64748B]">Profil public</p>
      </header>
      <HighlightsPublic athleteId={userId} />
    </main>
  )
}
