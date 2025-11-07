import { CoachProfileEditor } from '@/components/profile/CoachProfileEditor'

export default function CoachProfilePage() {
  return (
    <main className="container-xl py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-5xl font-bold text-[#0F172A]">Mon profil coach</h1>
        <p className="text-base text-[#64748B]">Informations publiques de recrutement.</p>
      </header>
      <CoachProfileEditor />
    </main>
  )
}
