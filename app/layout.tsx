import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KI-Angebots-Assistent | Für Küchenstudios',
  description: 'Technische Planungsdaten in 30 Sekunden in professionelle Kundensprache übersetzen.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${jakarta.variable} h-full`}>
      <body className="antialiased font-jakarta h-full overflow-hidden">{children}</body>
    </html>
  )
}
