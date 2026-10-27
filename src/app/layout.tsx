import type { Metadata, Viewport } from 'next'
import { Archivo, Geist_Mono } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const description =
  'AETHER ONE — a fictional pair of wireless over-ear headphones, presented as an immersive, scroll-driven real-time 3D experience. An independent creative-development concept; not a real product.'

// Absolute URLs for social images. With NEXT_PUBLIC_SITE_URL unset, Next.js
// falls back to the Vercel deployment URL (production or preview) on Vercel,
// and to localhost in development.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: 'AETHER ONE — Beyond Sound. (Concept)',
  description,
  applicationName: 'AETHER ONE concept',
  openGraph: {
    title: 'AETHER ONE — Beyond Sound.',
    description,
    type: 'website',
    images: [{ url: '/stills/og.jpg', width: 1200, height: 630, alt: 'AETHER ONE concept headphones rendered in real time' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AETHER ONE — Beyond Sound.',
    description,
    images: ['/stills/og.jpg'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#08090B',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body>
        <noscript>
          <style>{'.js-only{display:none!important}.webgl-still{display:block!important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  )
}
