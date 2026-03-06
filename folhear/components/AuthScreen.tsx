'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  bg:"#0F0D0B",surface:"#1A1714",surface2:"#211C16",border:"#2E2820",
  accent:"#C4A882",muted:"#5C5044",text:"#EDE8DE",textDim:"#9A8C78",gold:"#D4A853",
}

export default function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [form, setForm] = useState({ firstName:'', lastName:'', birthday:'', email:'', password:'' })
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    setError(null)
    if (!form.email.trim() || form.password.length < 6) {
      setError('Preencha e-mail e senha (mín. 6 caracteres).')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        if (!form.firstName.trim()) { setError('Informe seu nome.'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { first_name: form.firstName.trim(), last_name: form.lastName.trim(), birthday: form.birthday } }
        })
        if (error) throw error
        // Create profile row
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            birthday: form.birthday || null,
            lang: 'pt',
          })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (error) throw error
      }
      router.push('/app')
      router.refresh()
    } catch (e: any) {
      setError(e.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:C.muted, marginBottom:6 }}>{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        style={{ width:'100%', padding:'12px 14px', background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
      />
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Jost',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;}
        input:focus{border-color:#C4A882 !important;}
      `}</style>

      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:52, fontWeight:300, color:C.accent, letterSpacing:3, margin:0, lineHeight:1 }}>
            Folhear
          </h1>
          <p style={{ fontSize:10, letterSpacing:'3px', textTransform:'uppercase', color:C.muted, marginTop:8 }}>
            Sua jornada literária
          </p>
        </div>

        {/* Card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:32 }}>
          {/* Toggle */}
          <div style={{ display:'flex', gap:0, marginBottom:24, border:`1px solid ${C.border}` }}>
            {(['signin','signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }} style={{
                flex:1, padding:'10px 0', border:'none', cursor:'pointer',
                background:mode===m?C.accent:'transparent',
                color:mode===m?'#0F0D0B':C.textDim,
                fontFamily:'inherit', fontSize:11, fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase',
                transition:'all .2s',
              }}>
                {m === 'signin' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              {inp('Nome','firstName','text','João')}
              {inp('Sobrenome','lastName','text','Silva')}
              <div style={{ gridColumn:'1/-1' }}>{inp('Data de Aniversário','birthday','date')}</div>
            </div>
          )}

          {inp('E-mail','email','email','joao@email.com')}
          {inp('Senha','password','password','••••••••')}

          {error && (
            <p style={{ color:'#A86A6A', fontSize:12, marginBottom:14, padding:'8px 12px', background:'rgba(168,106,106,0.08)', border:'1px solid rgba(168,106,106,0.2)' }}>
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{ width:'100%', padding:'14px 0', background:C.accent, border:'none', color:'#0F0D0B', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', cursor:'pointer', marginTop:4, opacity:loading?0.6:1, transition:'opacity .2s' }}
          >
            {loading ? '...' : mode === 'signin' ? 'Entrar' : 'Criar Conta'}
          </button>
        </div>

        <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:C.muted }}>
          {mode === 'signin' ? 'Não tem conta? ' : 'Já tem conta? '}
          <button onClick={() => { setMode(mode==='signin'?'signup':'signin'); setError(null) }} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontFamily:'inherit', fontSize:12 }}>
            {mode === 'signin' ? 'Criar Conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
