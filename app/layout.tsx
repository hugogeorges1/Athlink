import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navigation/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ATHLINK',
  description: 'Relier athlètes européens et coachs universitaires US. 100% gratuit.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white text-anthracite`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
