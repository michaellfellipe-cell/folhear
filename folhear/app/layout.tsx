import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Folhear',
  description: 'Sua jornada literária',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ margin: 0, padding: 0, background: '#0F0D0B' }}>
        {children}
      </body>
    </html>
  )
}
