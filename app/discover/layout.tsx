import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Découvrir | ATHLINK',
  description: 'Découvrez les derniers highlights des athlètes: vidéos, performances et profils publics.',
  openGraph: {
    title: 'Découvrir | ATHLINK',
    description: 'Découvrez les derniers highlights des athlètes: vidéos, performances et profils publics.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/discover'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Découvrir | ATHLINK',
    description: 'Découvrez les derniers highlights des athlètes.'
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
