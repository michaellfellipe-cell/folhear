'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const FolhearApp = dynamic(() => import('./FolhearApp'), { ssr: false })

export default function MainApp() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth')
    })
    return () => subscription.unsubscribe()
  }, [router])

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F0D0B', flexDirection:'column', gap:12 }}>
      <p style={{ color:'#C4A882', fontFamily:'Georgia,serif', fontSize:36, fontWeight:300, letterSpacing:2 }}>Folhear</p>
      <div style={{ display:'flex', gap:6 }}>
        {[0,0.18,0.36].map(d => (
          <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'#C4A882', animation:`pulse 1.3s ease-in-out ${d}s infinite` }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.25;transform:scale(.75);}50%{opacity:1;transform:scale(1);}}`}</style>
    </div>
  )

  return <FolhearApp />
}
