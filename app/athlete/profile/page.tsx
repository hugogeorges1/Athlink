import { ProfileEditor } from '@/components/profile/ProfileEditor'

export default function AthleteProfilePage() {
  return (
    <main className="container-xl py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-5xl font-bold text-[#0F172A]">Mon profil</h1>
        <p className="text-base text-[#64748B]">Photo de profil et informations personnelles.</p>
      </header>
      <ProfileEditor />
    </main>
  )
}
