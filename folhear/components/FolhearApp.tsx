'use client'
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

/* ── i18n ── */
const TR: Record<string, Record<string, string>> = {
  pt: {
    appName:'Folhear',discover:'Descobrir',shelf:'Estante',reading:'Lendo',timeline:'Linha do Tempo',
    challenges:'Desafios',notes:'Notas',wishlist:'Desejos',club:'Clube',social:'Social',
    home:'Início',signIn:'Entrar',signUp:'Criar Conta',logout:'Sair',
    email:'E-mail',password:'Senha',firstName:'Nome',lastName:'Sobrenome',
    birthday:'Data de Nascimento',alreadyHave:'Já tem conta?',noAccount:'Não tem conta?',
    followers:'seguidores',following:'seguindo',follow:'Seguir',unfollow:'Deixar de seguir',
    save:'Salvar',cancel:'Cancelar',booksRead:'livros lidos',loved:'amei',
    readingNow:'lendo',wishes:'desejos',challenge:'Desafio',badge:'Selo',
    completed:'Concluído',inProgress:'Em andamento',monthlyChallenge:'Desafio Mensal',
    globalChallenge:'Desafio Global',bookAdded:'Livro adicionado!',profileSaved:'Perfil salvo!',
    editProfile:'Editar perfil',timelineEmpty:'Sua jornada literária começa quando você concluir o primeiro livro.',
    noActivity:'Nenhuma atividade ainda.',lang:'EN',aiPlaceholder:'Pergunte ao Claude: "Me recomende livros de ficcao cientifica"...',aiButton:'Perguntar',aiLoading:'Pensando...',aiError:'Erro ao consultar IA. Tente novamente.',aiWelcome:'Descubra seu proximo livro favorito com Claude.',aiSubtitle:'Pergunte sobre: genero, autor, tema, humor...',
  },
  en: {
    appName:'Folhear',discover:'Discover',shelf:'Shelf',reading:'Reading',timeline:'Timeline',
    challenges:'Challenges',notes:'Notes',wishlist:'Wishlist',club:'Club',social:'Social',
    home:'Home',signIn:'Sign In',signUp:'Create Account',logout:'Sign Out',
    email:'Email',password:'Password',firstName:'First Name',lastName:'Last Name',
    birthday:'Date of Birth',alreadyHave:'Already have an account?',noAccount:'No account yet?',
    followers:'followers',following:'following',follow:'Follow',unfollow:'Unfollow',
    save:'Save',cancel:'Cancel',booksRead:'books read',loved:'loved',
    readingNow:'reading',wishes:'wishlist',challenge:'Challenge',badge:'Badge',
    completed:'Completed',inProgress:'In progress',monthlyChallenge:'Monthly Challenge',
    globalChallenge:'Global Challenge',bookAdded:'Book added!',profileSaved:'Profile saved!',
    editProfile:'Edit profile',timelineEmpty:'Your literary journey begins when you finish your first book.',
    noActivity:'No activity yet.',lang:'PT',aiPlaceholder:'Ask Claude: "Recommend sci-fi books for beginners"...',aiButton:'Ask',aiLoading:'Thinking...',aiError:'Error querying AI. Please try again.',aiWelcome:'Discover your next favorite book with Claude.',aiSubtitle:'Ask about: genre, author, theme, mood...',
  },
}
const LangCtx = createContext({ lang: 'pt', t: TR.pt, toggle: () => {} })
const useLang = () => useContext(LangCtx)

/* ── Design tokens ── */
const C = {
  bg:'#0F0D0B',surface:'#1A1714',surface2:'#211C16',border:'#2E2820',
  accent:'#C4A882',accentDim:'#7A6A50',muted:'#5C5044',
  text:'#EDE8DE',textDim:'#9A8C78',gold:'#D4A853',
  green:'#6A9E6A',red:'#A86A6A',blue:'#6A7FA8',
}
const PALETTES=[
  ['#2C1810','#8B4513','#D4A853'],['#0D1B2A','#1B4F72','#85C1E9'],
  ['#1A0A2E','#6C3483','#D7BDE2'],['#0A2E0A','#1E8449','#82E0AA'],
  ['#2E1A0A','#A04000','#FAD7A0'],['#1A1A2E','#16213E','#C4A882'],
  ['#2E0A0A','#922B21','#F1948A'],['#0A2E2E','#117A65','#76D7C4'],
  ['#1C1C0A','#7D6608','#F9E79F'],['#2E0A1E','#76448A','#D2B4DE'],
]
function bookPalette(t=''){let h=0;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))&0xFFFFFF;return PALETTES[Math.abs(h)%PALETTES.length]}

const yr = new Date().getFullYear()
const mo = new Date().getMonth()
const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/* ── Challenges data ── */
const CHALLENGES_PT=[
  {id:'classic',title:'Clássico Eterno',desc:'Leia um clássico da literatura universal',badge:'🏛️',color:'#D4A853',type:'monthly'},
  {id:'debut',title:'Primeira Vez',desc:'Leia um livro de um autor que nunca leu',badge:'🌱',color:'#6A9E6A',type:'monthly'},
  {id:'100pages',title:'Maratonista',desc:'Leia 100 páginas em um único dia',badge:'⚡',color:'#85C1E9',type:'global'},
  {id:'series',title:'Saga Completa',desc:'Termine uma trilogia ou saga',badge:'⚔️',color:'#C4796A',type:'global'},
  {id:'5books',title:'Cinco Estrelas',desc:'Leia 5 livros que você deu ❤️',badge:'⭐',color:'#D4A853',type:'global'},
  {id:'genre',title:'Explorador',desc:'Leia um livro de um gênero diferente',badge:'🗺️',color:'#8A6AA8',type:'monthly'},
  {id:'friend',title:'Leitura em Dupla',desc:'Leia o mesmo livro que um amigo',badge:'🤝',color:'#76D7C4',type:'global'},
  {id:'annual12',title:'Uma por Mês',desc:'Leia pelo menos um livro por mês',badge:'📅',color:'#D4A853',type:'global'},
]
const CHALLENGES_EN=[
  {id:'classic',title:'Eternal Classic',desc:'Read a universal literature classic',badge:'🏛️',color:'#D4A853',type:'monthly'},
  {id:'debut',title:'First Timer',desc:'Read a book by an author you\'ve never read',badge:'🌱',color:'#6A9E6A',type:'monthly'},
  {id:'100pages',title:'Marathoner',desc:'Read 100 pages in a single day',badge:'⚡',color:'#85C1E9',type:'global'},
  {id:'series',title:'Full Saga',desc:'Finish a trilogy or saga',badge:'⚔️',color:'#C4796A',type:'global'},
  {id:'5books',title:'Five Stars',desc:'Read 5 books you marked as loved',badge:'⭐',color:'#D4A853',type:'global'},
  {id:'genre',title:'Explorer',desc:'Read a book from an unfamiliar genre',badge:'🗺️',color:'#8A6AA8',type:'monthly'},
  {id:'friend',title:'Buddy Read',desc:'Read the same book as a friend',badge:'🤝',color:'#76D7C4',type:'global'},
  {id:'annual12',title:'One a Month',desc:'Read at least one book per month',badge:'📅',color:'#D4A853',type:'global'},
]

/* ── AI helper (calls our secure API route) ── */
async function callAI(system: string, message: string, maxTokens=1500, opts: {cacheKey?:string, model?:string}={}) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ system, message, maxTokens, ...opts }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text as string
}

/* ── Shared UI components ── */
function Spine({title='',author='',size=66,showText=true}:{title?:string,author?:string,size?:number,showText?:boolean}) {
  const [bg,ac,tx]=bookPalette(title)
  const h=Math.round(size*1.42)
  const words=title.split(' ');const lines:string[]=[];let cur=''
  for(const w of words){if((cur+' '+w).trim().length>10&&cur){lines.push(cur);cur=w}else cur=(cur+' '+w).trim()}
  if(cur)lines.push(cur)
  return(
    <div style={{width:size,height:h,background:bg,flexShrink:0,position:'relative',overflow:'hidden',boxShadow:'3px 4px 16px rgba(0,0,0,.6)',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:size>60?'8px 7px':'5px 5px'}}>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:4,background:ac,opacity:.7}}/>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:'rgba(255,255,255,.06)'}}/>
      {showText&&lines.slice(0,4).map((l,i)=><span key={i} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:size>60?Math.max(8,size*.13):7,fontWeight:500,color:tx,lineHeight:1.2,display:'block',wordBreak:'break-word',textShadow:'0 1px 2px rgba(0,0,0,.8)',letterSpacing:.3}}>{l}</span>)}
      {showText&&author&&size>55&&<span style={{fontFamily:"'Jost',sans-serif",fontSize:Math.max(6,size*.09),color:ac,letterSpacing:'0.5px',display:'block',marginTop:'auto',overflow:'hidden',whiteSpace:'nowrap',opacity:.9}}>{author.split(' ').slice(-1)[0]}</span>}
    </div>
  )
}

function Dots() {
  return <div style={{display:'flex',gap:6,alignItems:'center'}}>{[0,.18,.36].map(d=><div key={d} style={{width:6,height:6,borderRadius:'50%',background:C.accent,animation:`pulse 1.3s ease-in-out ${d}s infinite`}}/>)}</div>
}

function Toast({msg}:{msg:string|null}) {
  if(!msg) return null
  return <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.surface,border:`1px solid ${C.border}`,color:C.accent,padding:'11px 22px',fontSize:12,letterSpacing:'1.5px',zIndex:999,whiteSpace:'nowrap',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>{msg}</div>
}

function Btn({children,onClick,variant='ghost',disabled,style={},full}:{children:React.ReactNode,onClick?:()=>void,variant?:string,disabled?:boolean,style?:React.CSSProperties,full?:boolean}) {
  const s:Record<string,React.CSSProperties>={primary:{background:C.accent,color:'#0F0D0B',border:'none'},ghost:{background:'transparent',color:C.textDim,border:`1px solid ${C.border}`},danger:{background:'transparent',color:C.red,border:`1px solid ${C.red}`}}
  return <button onClick={onClick} disabled={disabled} style={{padding:'9px 18px',cursor:disabled?'not-allowed':'pointer',fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',transition:'all .15s',opacity:disabled?0.4:1,width:full?'100%':'auto',...(s[variant]||s.ghost),...style} as React.CSSProperties}>{children}</button>
}

function InputField({label,value,onChange,type='text',placeholder,error}:{label?:string,value:string,onChange:(v:string)=>void,type?:string,placeholder?:string,error?:string}) {
  return(
    <div style={{marginBottom:16}}>
      {label&&<label style={{display:'block',fontSize:10,letterSpacing:'2px',textTransform:'uppercase',color:C.muted,marginBottom:7}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:'100%',padding:'13px 16px',background:C.surface,border:`1px solid ${error?C.red:C.border}`,color:C.text,fontSize:14,outline:'none',fontFamily:"'Jost',sans-serif",boxSizing:'border-box'} as React.CSSProperties}/>
      {error&&<p style={{fontSize:11,color:C.red,marginTop:5}}>{error}</p>}
    </div>
  )
}

function Avatar({photo,name,size=36}:{photo?:string|null,name:string,size?:number}) {
  const initials=(name||'?').split(' ').slice(0,2).map((w:string)=>w[0]).join('').toUpperCase()
  const [bg]=bookPalette(name||'')
  return(
    <div style={{width:size,height:size,borderRadius:'50%',background:photo?'transparent':bg,border:`1px solid ${C.border}`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {photo?<img src={photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name}/>
        :<span style={{fontSize:size*.38,fontFamily:"'Cormorant Garamond',serif",color:'#EDE8DE',fontWeight:500}}>{initials}</span>}
    </div>
  )
}

/* ── Auth Screen ── */
function AuthScreen({onAuth,lang,toggleLang}:{onAuth:(user:any)=>void,lang:string,toggleLang:()=>void}) {
  const t=TR[lang]
  const [mode,setMode]=useState('signin')
  const [form,setForm]=useState({firstName:'',lastName:'',birthday:'',email:'',password:''})
  const [errors,setErrors]=useState<Record<string,string>>({})
  const [loading,setLoading]=useState(false)
  const [authError,setAuthError]=useState('')
  const set=(k:string,v:string)=>setForm(p=>({...p,[k]:v}))

  const submit=async()=>{
    const e:Record<string,string>={}
    if(mode==='signup'){if(!form.firstName.trim())e.firstName='Obrigatório';if(!form.lastName.trim())e.lastName='Obrigatório';if(!form.birthday)e.birthday='Obrigatório'}
    if(!form.email.trim())e.email='Obrigatório'
    if(!form.password||form.password.length<6)e.password='Mínimo 6 caracteres'
    if(Object.keys(e).length){setErrors(e);return}
    setLoading(true);setAuthError('')
    try{
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{first_name:form.firstName,last_name:form.lastName,birthday:form.birthday}}})
        if(error)throw error
        if(data.user){
          await supabase.from('profiles').upsert({id:data.user.id,first_name:form.firstName,last_name:form.lastName,birthday:form.birthday,lang})
          onAuth(data.user)
        }
      } else {
        const {data,error}=await supabase.auth.signInWithPassword({email:form.email,password:form.password})
        if(error)throw error
        if(data.user)onAuth(data.user)
      }
    } catch(err:any){setAuthError(err.message||'Erro ao autenticar')}
    finally{setLoading(false)}
  }

  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Jost',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box}@keyframes pulse{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{position:'absolute',top:20,right:24}}>
        <button onClick={toggleLang} style={{background:'none',border:`1px solid ${C.border}`,color:C.textDim,padding:'6px 14px',cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:'2px'}}>{t.lang}</button>
      </div>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:52,fontWeight:300,color:C.accent,letterSpacing:2,margin:0}}>📖 {t.appName}</h1>
          <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.muted,marginTop:6}}>{lang==='pt'?'Sua jornada literária':'Your literary journey'}</p>
        </div>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,padding:32}}>
          <div style={{display:'flex',gap:0,marginBottom:24,border:`1px solid ${C.border}`}}>
            {[['signin',t.signIn],['signup',t.signUp]].map(([id,lbl])=>(
              <button key={id} onClick={()=>{setMode(id);setErrors({});setAuthError('')}} style={{flex:1,padding:'10px 0',border:'none',cursor:'pointer',background:mode===id?C.accent:'transparent',color:mode===id?'#0F0D0B':C.textDim,fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase'}}>{lbl}</button>
            ))}
          </div>
          {mode==='signup'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <InputField label={t.firstName} value={form.firstName} onChange={v=>set('firstName',v)} placeholder="João" error={errors.firstName}/>
              <InputField label={t.lastName} value={form.lastName} onChange={v=>set('lastName',v)} placeholder="Silva" error={errors.lastName}/>
              <div style={{gridColumn:'1/-1'}}><InputField label={t.birthday} value={form.birthday} onChange={v=>set('birthday',v)} type="date" error={errors.birthday}/></div>
            </div>
          )}
          <InputField label={t.email} value={form.email} onChange={v=>set('email',v)} placeholder="joao@email.com" error={errors.email}/>
          <InputField label={t.password} value={form.password} onChange={v=>set('password',v)} type="password" placeholder="••••••••" error={errors.password}/>
          {authError&&<p style={{color:C.red,fontSize:12,marginBottom:12,textAlign:'center'}}>{authError}</p>}
          <Btn variant="primary" full onClick={submit} disabled={loading} style={{padding:'14px 0'}}>
            {loading?<Dots/>:mode==='signin'?t.signIn:t.signUp}
          </Btn>
        </div>
        <p style={{textAlign:'center',marginTop:16,fontSize:12,color:C.muted}}>
          {mode==='signin'?t.noAccount:t.alreadyHave}{' '}
          <button onClick={()=>setMode(mode==='signin'?'signup':'signin')} style={{background:'none',border:'none',color:C.accent,cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:12}}>
            {mode==='signin'?t.signUp:t.signIn}
          </button>
        </p>
      </div>
    </div>
  )
}

/* ── Book Search Modal ── */
function BookSearchModal({onSelect,onClose,title}:{onSelect:(b:any)=>void,onClose:()=>void,title:string}) {
  const {lang}=useLang()
  const [q,setQ]=useState(''),[results,setResults]=useState<any[]|null>(null),[loading,setLoading]=useState(false)
  const search=async()=>{
    if(!q.trim()||loading)return;setLoading(true)
    const isPt=lang==='pt'
    try{
      const text=await callAI(
        isPt?'Retorne JSON APENAS (sem markdown): {"books":[{"title":"...","author":"...","year":"...","genre":"...","pages":300}]}. 10 livros.':'Return JSON ONLY (no markdown): {"books":[{"title":"...","author":"...","year":"...","genre":"...","pages":300}]}. 10 books.',
        `${isPt?'Busca':'Search'}: "${q}"`,
        800,{model:'haiku',cacheKey:`search:${q.toLowerCase().trim()}`}
      )
      const m=text.match(/\{[\s\S]*\}/)
      if(m)setResults(JSON.parse(m[0]).books||[])
    }catch{}finally{setLoading(false)}
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400,padding:24}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,border:`1px solid ${C.border}`,padding:26,maxWidth:480,width:'100%',maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
          <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim}}>{title}</p>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>×</button>
        </div>
        <div style={{display:'flex',background:C.bg,border:`1px solid ${C.border}`,marginBottom:14}}>
          <input type="text" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder={lang==='pt'?'ex: Dom Casmurro, Tolkien…':'e.g. 1984, Tolkien…'} style={{flex:1,padding:'12px 14px',background:'transparent',border:'none',outline:'none',color:C.text,fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:'italic'}}/>
          <button onClick={search} disabled={loading||!q.trim()} style={{padding:'0 18px',background:C.accent,border:'none',color:'#0F0D0B',fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'2px',cursor:'pointer',opacity:loading||!q.trim()?0.4:1}}>{loading?<Dots/>:lang==='pt'?'Buscar':'Search'}</button>
        </div>
        <div style={{overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:1,background:results?.length?C.border:'transparent'}}>
          {(results||[]).map((b,i)=>(
            <button key={i} onClick={()=>onSelect(b)} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:C.surface,border:'none',cursor:'pointer',textAlign:'left'}}>
              <Spine title={b.title} author={b.author} size={34} showText={false}/>
              <div style={{flex:1}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:C.text,margin:0}}>{b.title}</p>
                <p style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:C.accentDim,margin:'2px 0 0'}}>{b.author}{b.year?` · ${b.year}`:''}</p>
              </div>
              <span style={{fontSize:9,color:C.accentDim,border:`1px solid ${C.border}`,padding:'2px 7px'}}>+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Home Tab ── */
function HomeTab({user,profile,library,finished,reading,challenges,followers,following}:{user:any,profile:any,library:any[],finished:any[],reading:any[],challenges:any[],followers:string[],following:string[]}) {
  const {t,lang}=useLang()
  const loved=library.filter(b=>b.rating==='loved')
  const completed=challenges.filter(c=>c.completed)
  const booksThisMonth=finished.filter(r=>{const d=new Date(r.finishedAt);return d.getMonth()===mo&&d.getFullYear()===yr})
  const MO=lang==='pt'?MONTHS:MONTHS_EN
  const name=`${profile?.firstName||user?.user_metadata?.first_name||''}`.trim()||'Leitor'
  const activities=[
    ...completed.slice(0,3).map((c:any)=>({icon:c.badge,text:lang==='pt'?`Você conquistou o selo "${c.title}"!`:`You earned the "${c.title}" badge!`,date:c.completedAt||Date.now(),color:c.color})),
    ...finished.slice(0,3).map((r:any)=>({icon:'✅',text:lang==='pt'?`Você terminou "${r.book.title}"`:`You finished "${r.book.title}"`,date:r.finishedAt,color:C.green})),
    ...followers.slice(0,2).map((f:string)=>({icon:'👤',text:lang==='pt'?`@${f} começou a te seguir`:`@${f} started following you`,date:Date.now()-Math.random()*86400000*3,color:C.blue})),
  ].sort((a,b)=>b.date-a.date).slice(0,10)
  return(
    <main style={{padding:'32px 24px 80px',maxWidth:920,margin:'0 auto'}}>
      <div style={{marginBottom:32}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <Avatar photo={profile?.photo} name={name} size={52}/>
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:300,lineHeight:1.1,margin:0}}>{lang==='pt'?'Olá,':'Hello,'} <em style={{color:C.accent,fontStyle:'italic'}}>{name}</em></h2>
            {profile?.username&&<p style={{fontSize:11,color:C.muted,letterSpacing:'1px',margin:'4px 0 0'}}>@{profile.username}</p>}
          </div>
        </div>
        <div style={{display:'flex',gap:1,background:C.border}}>
          {[[loved.length,t.loved],[finished.length,t.booksRead],[reading.length,t.readingNow],[followers.length,t.followers],[following.length,t.following]].map(([v,l])=>(
            <div key={String(l)} style={{flex:1,background:C.surface,padding:'14px 8px',textAlign:'center'}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,color:C.gold,lineHeight:1,margin:0}}>{v}</p>
              <p style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:C.muted,marginTop:3,marginBottom:0}}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        <div>
          <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:14}}>{lang==='pt'?'Atividade Recente':'Recent Activity'}</p>
          {activities.length===0
            ?<div style={{border:`1px dashed ${C.border}`,padding:32,textAlign:'center'}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:'italic',color:C.muted}}>{t.noActivity}</p></div>
            :<div style={{display:'flex',flexDirection:'column',gap:1,background:C.border}}>
              {activities.map((a,i)=>(
                <div key={i} style={{background:C.surface,padding:'14px 16px',display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:32,height:32,background:'#2E2820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,borderLeft:`3px solid ${a.color}`}}>{a.icon}</div>
                  <div><p style={{fontSize:13,color:C.text,lineHeight:1.5,fontWeight:300,margin:0}}>{a.text}</p><p style={{fontSize:10,color:C.muted,marginTop:3,marginBottom:0}}>{new Date(a.date).toLocaleDateString(lang==='pt'?'pt-BR':'en-US',{day:'2-digit',month:'short'})}</p></div>
                </div>
              ))}
            </div>
          }
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,padding:20}}>
            <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:12}}>{MO[mo]} · {yr}</p>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{textAlign:'center'}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:C.gold,lineHeight:1,margin:0}}>{booksThisMonth.length}</p>
                <p style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:C.muted}}>{lang==='pt'?'este mês':'this month'}</p>
              </div>
              <div style={{flex:1,display:'flex',gap:4,flexWrap:'wrap'}}>{booksThisMonth.slice(0,4).map((r:any)=><Spine key={r.book.title} title={r.book.title} size={36} showText={false}/>)}</div>
            </div>
          </div>
          {challenges.filter((c:any)=>!c.completed).slice(0,1).map((ch:any)=>(
            <div key={ch.id} style={{background:'#1F1A14',border:`2px solid ${ch.color}`,padding:20}}>
              <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:8}}>{t.challenge}</p>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:28}}>{ch.badge}</span>
                <div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:ch.color,margin:0}}>{ch.title}</p><p style={{fontSize:11,color:C.textDim,marginTop:2,marginBottom:0}}>{ch.desc}</p></div>
              </div>
              <span style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:ch.color,border:`1px solid ${ch.color}`,padding:'2px 8px'}}>{t.inProgress}</span>
            </div>
          ))}
          {completed.length>0&&(
            <div style={{background:C.surface,border:`1px solid ${C.border}`,padding:18}}>
              <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:12}}>{t.badge}s</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {completed.map((c:any)=>(
                  <div key={c.id} title={c.title} style={{width:44,height:44,background:'#2E2820',border:`2px solid ${c.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{c.badge}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/* ── Timeline Tab ── */
function TimelineTab({finished}:{finished:any[]}) {
  const {t,lang}=useLang()
  const byYear:Record<string,Record<string,any[]>>={}
  finished.forEach(r=>{const d=new Date(r.finishedAt);const y=String(d.getFullYear());const m=String(d.getMonth());if(!byYear[y])byYear[y]={};if(!byYear[y][m])byYear[y][m]=[];byYear[y][m].push(r)})
  const years=Object.keys(byYear).sort((a,b)=>Number(b)-Number(a))
  const MO=lang==='pt'?MONTHS:MONTHS_EN
  if(!finished.length)return(
    <main style={{padding:'80px 24px',maxWidth:920,margin:'0 auto',textAlign:'center'}}>
      <span style={{fontSize:48,display:'block',marginBottom:20}}>📖</span>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:'italic',color:C.muted}}>{t.timelineEmpty}</p>
    </main>
  )
  return(
    <main style={{padding:'48px 24px 80px',maxWidth:920,margin:'0 auto'}}>
      <div style={{marginBottom:40}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,letterSpacing:-1,marginBottom:4}}>{lang==='pt'?'Linha do ':''}<em style={{color:C.accent,fontStyle:'italic'}}>{lang==='pt'?'Tempo':'Timeline'}</em></h2>
        <p style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',color:C.textDim}}>{finished.length} {t.booksRead}</p>
      </div>
      {years.map(year=>(
        <div key={year} style={{marginBottom:48}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28}}>
            <div style={{height:1,background:C.border,flex:1}}/>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:300,color:C.gold,letterSpacing:2}}>{year}</span>
            <div style={{height:1,background:C.border,flex:1}}/>
          </div>
          {Object.keys(byYear[year]).sort((a,b)=>Number(b)-Number(a)).map(m=>(
            <div key={m} style={{display:'grid',gridTemplateColumns:'80px 1fr',gap:'0 20px',marginBottom:28}}>
              <div style={{textAlign:'right',paddingTop:8}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,color:C.accentDim,margin:0}}>{MO[Number(m)]}</p>
                <p style={{fontSize:10,color:C.muted,margin:'2px 0 0'}}>{byYear[year][m].length} {lang==='pt'?'livro'+(byYear[year][m].length>1?'s':''):'book'+(byYear[year][m].length>1?'s':'')}</p>
              </div>
              <div style={{borderLeft:`2px solid ${C.border}`,paddingLeft:20}}>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-start'}}>
                  {byYear[year][m].map((r:any,i:number)=>(
                    <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,maxWidth:66}}>
                      <div style={{position:'relative'}}>
                        <Spine title={r.book.title} author={r.book.author||''} size={54}/>
                        <div style={{position:'absolute',bottom:-4,right:-4,width:16,height:16,background:C.green,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff'}}>✓</div>
                      </div>
                      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:11,textAlign:'center',color:C.textDim,lineHeight:1.2,maxWidth:60,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'} as React.CSSProperties}>{r.book.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}

/* ── Challenges Tab ── */
function ChallengesTab({challenges,onComplete,onJoin}:{challenges:any[],onComplete:(c:any)=>void,onJoin:(c:any)=>void}) {
  const {t,lang}=useLang()
  const ALL=lang==='pt'?CHALLENGES_PT:CHALLENGES_EN
  const monthly=ALL.filter(c=>c.type==='monthly')
  const global=ALL.filter(c=>c.type==='global')
  const completed=challenges.filter(c=>c.completed)
  const ChallengeCard=({ch}:{ch:any})=>{
    const state=challenges.find(c=>c.id===ch.id)
    const done=state?.completed;const joined=!!state
    return(
      <div style={{background:done?'#1F1A14':C.surface,border:`1px solid ${done?ch.color:C.border}`,padding:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div style={{width:52,height:52,background:'#2E2820',border:`2px solid ${done?ch.color:C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{ch.badge}</div>
          {done&&<span style={{fontSize:10,letterSpacing:'1.5px',textTransform:'uppercase',color:ch.color,border:`1px solid ${ch.color}`,padding:'3px 8px'}}>✓ {t.completed}</span>}
        </div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,color:done?ch.color:C.text,marginBottom:6,marginTop:0}}>{ch.title}</p>
        <p style={{fontSize:12,color:C.textDim,lineHeight:1.6,marginBottom:14,fontWeight:300}}>{ch.desc}</p>
        {!done&&<div style={{display:'flex',gap:8}}>
          {!joined&&<Btn onClick={()=>onJoin(ch)} style={{fontSize:9,padding:'6px 12px'}}>{lang==='pt'?'Participar':'Join'}</Btn>}
          {joined&&<Btn variant="primary" onClick={()=>onComplete(ch)} style={{fontSize:9,padding:'6px 12px'}}>{lang==='pt'?'Concluído':'Mark Done'}</Btn>}
        </div>}
      </div>
    )
  }
  return(
    <main style={{padding:'48px 24px 80px',maxWidth:920,margin:'0 auto'}}>
      <div style={{marginBottom:36}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,letterSpacing:-1,marginBottom:4}}><em style={{color:C.accent,fontStyle:'italic'}}>{t.challenges}</em></h2>
        <p style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',color:C.textDim}}>{completed.length} {lang==='pt'?'selos conquistados':'badges earned'}</p>
      </div>
      {completed.length>0&&(
        <div style={{background:'#1F1A14',border:`1px solid ${C.accentDim}`,padding:24,marginBottom:32}}>
          <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.accentDim,marginBottom:16}}>✦ {lang==='pt'?'Seus Selos':'Your Badges'}</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {completed.map((c:any)=>(
              <div key={c.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,width:72}}>
                <div style={{width:60,height:60,background:'#2E2820',border:`2px solid ${c.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,boxShadow:`0 0 16px ${c.color}44`}}>{c.badge}</div>
                <p style={{fontSize:9,letterSpacing:'1px',textTransform:'uppercase',color:C.textDim,textAlign:'center',lineHeight:1.3,margin:0}}>{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:16}}>📅 {t.monthlyChallenge}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14,marginBottom:32}}>
        {monthly.map(ch=><ChallengeCard key={ch.id} ch={ch}/>)}
      </div>
      <p style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.textDim,marginBottom:16}}>🌍 {t.globalChallenge}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
        {global.map(ch=><ChallengeCard key={ch.id} ch={ch}/>)}
      </div>
    </main>
  )
}

/* ── Shelf Tab ── */
function ShelfTab({library,onRate,onUpdLib,onAddToWish,aiAnalysis,onRefreshAi}:{library:any[],onRate:(b:any,r:string)=>void,onUpdLib:(fn:(p:any[])=>any[])=>void,onAddToWish:(b:any)=>void,aiAnalysis:any,onRefreshAi:(mode:string)=>Promise<void>}) {
  const {t,lang}=useLang()
  const [filter,setFilter]=useState('all'),[showSearch,setShowSearch]=useState(false),[aiLoading,setAiLoading]=useState(false)
  const loved=library.filter(b=>b.rating==='loved')
  const groups:Record<string,any[]>={loved,saved:library.filter(b=>b.rating==='saved'),disliked:library.filter(b=>b.rating==='disliked')}
  const shown=filter==='all'?library:(groups[filter]||[])
  const FILTERS=lang==='pt'?[['all',`Todos (${library.length})`],['loved',`❤️ Amei (${loved.length})`],['saved',`🔖 Salvos (${groups.saved.length})`],['disliked',`👎 Não curti (${groups.disliked.length})`]]:[['all',`All (${library.length})`],['loved',`❤️ Loved (${loved.length})`],['saved',`🔖 Saved (${groups.saved.length})`],['disliked',`👎 Disliked (${groups.disliked.length})`]]
  const addBook=(book:any)=>{onUpdLib(p=>{if(p.find(b=>b.title===book.title))return p;return[{...book,rating:'loved',addedAt:Date.now()},...p]});setShowSearch(false)}
  return(
    <main style={{padding:'48px 24px 80px',maxWidth:960,margin:'0 auto'}}>
      {showSearch&&<BookSearchModal title={lang==='pt'?'Pesquisar livro já lido':'Search a book you\'ve read'} onSelect={addBook} onClose={()=>setShowSearch(false)}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,letterSpacing:-1,marginBottom:4}}>{t.shelf}</h2><p style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',color:C.textDim}}>{library.length} {lang==='pt'?'livros':'books'}</p></div>
        <button onClick={()=>setShowSearch(true)} style={{padding:'10px 18px',background:C.accent,border:'none',color:'#0F0D0B',fontFamily:"'Jost',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',cursor:'pointer'}}>+ {lang==='pt'?'Adicionar Lido':'Add Read Book'}</button>
      </div>
      {loved.length>=5&&(
        <div style={{background:'#1F1A14',border:`1px solid ${C.accentDim}`,padding:22,marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><span>🧠</span><span style={{fontSize:10,letterSpacing:'3px',textTransform:'uppercase',color:C.accentDim}}>{lang==='pt'?'Análise do perfil':'Profile Analysis'}</span></div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={async()=>{setAiLoading(true);await onRefreshAi('last5');setAiLoading(false)}} disabled={aiLoading} style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:C.textDim,background:'none',border:`1px solid ${C.border}`,padding:'5px 10px',cursor:'pointer',fontFamily:"'Jost',sans-serif",opacity:aiLoading?0.4:1}}>↻ {lang==='pt'?'Últimos 5':'Last 5'}</button>
              <button onClick={async()=>{setAiLoading(true);await onRefreshAi('all');setAiLoading(false)}} disabled={aiLoading} style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:C.accentDim,background:'none',border:`1px solid ${C.accentDim}`,padding:'5px 10px',cursor:'pointer',fontFamily:"'Jost',sans-serif",opacity:aiLoading?0.4:1}}>↻ {lang==='pt'?'Todos':'All'}</button>
            </div>
          </div>
          {aiLoading&&<div style={{display:'flex',gap:10,alignItems:'center'}}><Dots/><span style={{fontSize:12,color:C.textDim}}>{lang==='pt'?'Analisando…':'Analyzing…'}</span></div>}
          {!aiLoading&&aiAnalysis&&(
            <>
              <p style={{fontSize:14,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',lineHeight:1.8,color:'#C0B09A',fontWeight:300,marginBottom:16}}>{aiAnalysis.profile}</p>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {(aiAnalysis.recs||[]).map((r:any,i:number)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<(aiAnalysis.recs.length-1)?`1px solid ${C.border}`:'none'}}>
                    <Spine title={r.title} author={r.author} size={38}/>
                    <div style={{flex:1}}>
                      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,marginBottom:2,marginTop:0}}>{r.title}</p>
                      <p style={{fontSize:9,letterSpacing:'2px',textTransform:'uppercase',color:C.accentDim,marginBottom:3,marginTop:0}}>{r.author}</p>
                      <p style={{fontSize:11,color:C.textDim,fontWeight:300,lineHeight:1.6,margin:0}}>{r.reason}</p>
                    </div>
                    <button onClick={()=>onAddToWish({title:r.title,author:r.author})} title={lang==='pt'?'Adicionar aos Desejos':'Add to Wishlist'} style={{flexShrink:0,alignSelf:'flex-start',marginTop:4,width:26,height:26,background:'transparent',border:`1px solid ${C.border}`,color:C.accentDim,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>🎯</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {!aiLoading&&!aiAnalysis&&<Btn onClick={()=>{setAiLoading(true);onRefreshAi('all').finally(()=>setAiLoading(false))}}>{lang==='pt'?'Gerar análise':'Generate analysis'}</Btn>}
        </div>
      )}
      <div style={{display:'flex',gap:0,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        {FILTERS.map(([id,lbl])=><button key={id} onClick={()=>setFilter(id)} style={{padding:'9px 13px',background:'none',border:'none',borderBottom:filter===id?`2px solid ${C.accent}`:'2px solid transparent',cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:filter===id?C.accent:C.muted,marginBottom:-1}}>{lbl}</button>)}
      </div>
      {shown.length===0
        ?<div style={{textAlign:'center',padding:'36px 0',border:`1px dashed ${C.border}`}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:'italic',color:C.muted}}>{lang==='pt'?'Nenhum livro aqui ainda':'No books here yet'}</p></div>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(138px,1fr))',gap:13}}>
          {shown.map((book:any,i:number)=>(
            <div key={book.title+i} style={{background:C.surface,border:`1px solid ${C.border}`}}>
              <div style={{height:116,overflow:'hidden',position:'relative'}}>
                <Spine title={book.title} author={book.author||''} size={138}/>
                <div style={{position:'absolute',top:4,right:4,fontSize:11,background:'rgba(0,0,0,.7)',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center'}}>{book.rating==='loved'?'❤️':book.rating==='saved'?'🔖':'👎'}</div>
              </div>
              <div style={{padding:'8px 9px'}}>
                <h4 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,fontWeight:400,lineHeight:1.2,marginBottom:3,marginTop:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'} as React.CSSProperties}>{book.title}</h4>
                <p style={{fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',color:C.accentDim,marginBottom:6,marginTop:0}}>{book.author}</p>
                <div style={{display:'flex',gap:3}}>
                  {[['loved','❤️'],['saved','🔖'],['disliked','👎']].map(([r,icon])=><button key={r} onClick={()=>onRate(book,r)} style={{flex:1,padding:'4px 0',fontSize:10,background:book.rating===r?'#2E2820':'transparent',border:`1px solid`,borderColor:book.rating===r?C.accent:C.border,cursor:'pointer',filter:book.rating&&book.rating!==r?'opacity(.25)':'none'}}>{icon}</button>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </main>
  )
}

function DiscoverTab({t,lang}:{t:(k:string)=>string;lang:'pt'|'en'}) {
  const [q,setQ]=useState('')
  const [res,setRes]=useState('')
  const [loading,setLoading]=useState(false)
  const [err,setErr]=useState('')
  const [hist,setHist]=useState<{q:string;r:string}[]>([])
  const ask=useCallback(async()=>{
    if(!q.trim()||loading)return
    setLoading(true);setErr('');setRes('')
    try{
      const r=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:q,model:'haiku'})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'error')
      const ans=d.result||d.content||d.message||JSON.stringify(d)
      setRes(ans);setHist(h=>[{q,r:ans},...h.slice(0,4)])
    }catch(e:any){setErr(t('aiError'))}
    finally{setLoading(false)}
  },[q,loading,t])
  const sug=lang==='pt'?['Me recomende 5 romances brasileiros','Ficção científica para iniciantes','Livros como O Alquimista','Autoconhecimento 2024']:['5 modern novels','Sci-fi for beginners','Books like The Alchemist','Self-help 2024']
  return(
    <div style={{padding:'24px',maxWidth:700,fontFamily:"'Cormorant Garamond',serif"}}>
      <h1 style={{color:C.accent,fontSize:28,fontWeight:300,marginBottom:8}}>📖 {t('discover')}</h1>
      <p style={{color:C.textDim,fontSize:13,marginBottom:24,fontFamily:'inherit'}}>{lang==='pt'?'Inteligência artificial para leitores':'AI-powered book discovery'}</p>
      <div style={{background:C.surface,border:'1px solid '+C.accentDim,borderRadius:12,padding:20,marginBottom:16}}>
        <p style={{color:C.text,marginBottom:4,fontSize:14}}>{t('aiWelcome')}</p>
        <p style={{color:C.textDim,fontSize:12,marginBottom:14}}>{t('aiSubtitle')}</p>
        <div style={{position:'relative'}}>
          <textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))ask()}} placeholder={t('aiPlaceholder')} style={{width:'100%',minHeight:90,background:C.surface2,border:'1px solid '+C.border,borderRadius:8,padding:'10px 130px 10px 12px',color:C.text,fontSize:13,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box' as any,outline:'none'}} />
          <button onClick={ask} disabled={loading||!q.trim()} style={{position:'absolute',right:10,bottom:10,padding:'8px 18px',background:C.accent,border:'none',borderRadius:6,color:C.bg,fontWeight:600,fontSize:13,cursor:loading||!q.trim()?'default':'pointer',opacity:loading||!q.trim()?0.5:1}}>{loading?t('aiLoading'):t('aiButton')}</button>
        </div>
        <p style={{color:C.textDim,fontSize:11,marginTop:6}}>{lang==='pt'?'Ctrl+Enter para enviar':'Ctrl+Enter to send'}</p>
      </div>
      {err&&<div style={{background:'rgba(168,106,106,0.1)',border:'1px solid rgba(168,106,106,0.3)',borderRadius:8,padding:'12px 16px',marginBottom:12,color:C.red,fontSize:13}}>{err}</div>}
      {loading&&<div style={{background:C.surface,border:'1px solid '+C.border,borderRadius:10,padding:16,display:'flex',alignItems:'center',gap:12,marginBottom:12}}><div style={{width:8,height:8,borderRadius:'50%',background:C.accent}} /><span style={{color:C.textDim,fontStyle:'italic',fontSize:14}}>{t('aiLoading')}</span></div>}
      {res&&!loading&&<div style={{background:C.surface,border:'1px solid '+C.accentDim,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span style={{fontSize:18}}>✨</span><span style={{color:C.accent,fontSize:11,letterSpacing:1,textTransform:'uppercase' as any}}>{lang==='pt'?'Resposta do Claude':"Claude's Response"}</span></div>
        <div style={{color:C.text,fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap' as any,borderLeft:'3px solid '+C.accent,paddingLeft:16}}>{res}</div>
        <div style={{marginTop:14,display:'flex',gap:8}}>
          <button onClick={()=>{setQ('');setRes('')}} style={{padding:'6px 14px',background:'transparent',border:'1px solid '+C.accentDim,borderRadius:6,color:C.text,cursor:'pointer',fontSize:12}}>{lang==='pt'?'🔄 Nova pergunta':'🔄 New question'}</button>
          <button onClick={()=>navigator.clipboard?.writeText(res)} style={{padding:'6px 14px',background:'transparent',border:'1px solid '+C.accentDim,borderRadius:6,color:C.text,cursor:'pointer',fontSize:12}}>{lang==='pt'?'📋 Copiar':'📋 Copy'}</button>
        </div>
      </div>}
      {!res&&!loading&&<div style={{marginBottom:16}}>
        <p style={{color:C.textDim,fontSize:12,marginBottom:10,textTransform:'uppercase' as any,letterSpacing:1}}>{lang==='pt'?'Sugestões':'Suggestions'}</p>
        <div style={{display:'flex',flexWrap:'wrap' as any,gap:8}}>{sug.map((s,i)=><button key={i} onClick={()=>setQ(s)} style={{padding:'7px 14px',background:C.surface,border:'1px solid '+C.accentDim,borderRadius:20,color:C.text,cursor:'pointer',fontSize:12}}>{s}</button>)}</div>
      </div>}
      {hist.length>0&&<div>
        <p style={{color:C.textDim,fontSize:12,marginBottom:10,textTransform:'uppercase' as any,letterSpacing:1}}>{lang==='pt'?'Histórico':'History'}</p>
        {hist.map((h,i)=><div key={i} onClick={()=>{setQ(h.q);setRes(h.r)}} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:10,padding:14,marginBottom:8,cursor:'pointer',opacity:i===0?1:0.7}}>
          <p style={{color:C.accent,fontSize:12,marginBottom:4}}>❓ {h.q}</p>
          <p style={{color:C.textDim,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.r.substring(0,100)}...</p>
        </div>)}
      </div>}
    </div>
  )
}

/* ── Main App ── */
export default function FolhearApp() {
  const [lang,setLang]=useState('pt')
  const [user,setUser]=useState<any>(null)
  const [checking,setChecking]=useState(true)
  const [tab,setTab]=useState('home')
  const [library,setLibrary]=useState<any[]>([])
  const [reading,setReading]=useState<any[]>([])
  const [finished,setFinished]=useState<any[]>([])
  const [notes,setNotes]=useState<Record<string,any[]>>({})
  const [wishlist,setWishlist]=useState<any[]>([])
  const [goal,setGoal]=useState({target:12,done:0})
  const [profile,setProfile]=useState<any>(null)
  const [aiAnalysis,setAiAnalysis]=useState<any>(null)
  const [challenges,setChallenges]=useState<any[]>([])
  const [followers,setFollowers]=useState<string[]>([])
  const [following,setFollowing]=useState<string[]>([])
  const [toast,setToast]=useState<string|null>(null)
  const [ready,setReady]=useState(false)
  const t=TR[lang]
  const toggleLang=()=>setLang(l=>l==='pt'?'en':'pt')
  const toast$=useCallback((m:string)=>{setToast(m);setTimeout(()=>setToast(null),2800)},[])

  /* Auth */
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setChecking(false)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user||null);setChecking(false)})
    return()=>subscription.unsubscribe()
  },[])

  /* Load data */
  useEffect(()=>{
    if(!user){setReady(true);return}
    const uid=user.id
    Promise.all([
      supabase.from('library').select('*').eq('user_id',uid).order('added_at',{ascending:false}),
      supabase.from('reading').select('*').eq('user_id',uid),
      supabase.from('finished').select('*').eq('user_id',uid).order('finished_at',{ascending:false}),
      supabase.from('notes').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
      supabase.from('wishlist').select('*').eq('user_id',uid).order('added_at',{ascending:false}),
      supabase.from('goals').select('*').eq('user_id',uid).eq('year',yr).maybeSingle(),
      supabase.from('profiles').select('*').eq('id',uid).maybeSingle(),
      supabase.from('challenges').select('*').eq('user_id',uid),
      supabase.from('follows').select('following_id').eq('follower_id',uid),
      supabase.from('follows').select('follower_id').eq('following_id',uid),
    ]).then(([lib,rd,fin,nt,wl,gl,pr,ch,foing,fol])=>{
      setLibrary((lib.data||[]).map((b:any)=>({title:b.title,author:b.author,year:b.year,genre:b.genre,pages:b.pages,rating:b.rating,addedAt:new Date(b.added_at).getTime(),dbId:b.id})))
      setReading((rd.data||[]).map((r:any)=>({book:{title:r.title,author:r.author},pages:r.pages,totalPages:r.total_pages,startDate:new Date(r.start_date).getTime(),dbId:r.id})))
      setFinished((fin.data||[]).map((r:any)=>({book:{title:r.title,author:r.author},totalPages:r.total_pages,finishedAt:new Date(r.finished_at).getTime()})))
      const ng:Record<string,any[]>={}
      for(const n of (nt.data||[])){if(!ng[n.book_title])ng[n.book_title]=[];ng[n.book_title].push({type:n.type,text:n.content,date:new Date(n.created_at).getTime(),dbId:n.id})}
      setNotes(ng)
      setWishlist((wl.data||[]).map((b:any)=>({title:b.title,author:b.author,pages:b.pages,priority:b.priority,addedAt:new Date(b.added_at).getTime(),dbId:b.id})))
      if(gl.data)setGoal({target:gl.data.target,done:gl.data.done})
      if(pr.data)setProfile({username:pr.data.username,bio:pr.data.bio,photo:pr.data.photo_url,firstName:pr.data.first_name,lastName:pr.data.last_name})
      setChallenges((ch.data||[]).map((c:any)=>{
        const ALL=lang==='pt'?CHALLENGES_PT:CHALLENGES_EN
        const def=ALL.find(x=>x.id===c.challenge_id)||{desc:'',badge:c.badge,color:c.color,type:'monthly',title:c.title}
        return{...def,id:c.challenge_id,title:c.title||def.title,badge:c.badge||def.badge,color:c.color||def.color,joined:c.joined,completed:c.completed,joinedAt:c.joined_at?new Date(c.joined_at).getTime():Date.now(),completedAt:c.completed_at?new Date(c.completed_at).getTime():undefined}
      }))
      setFollowing((foing.data||[]).map((f:any)=>f.following_id))
      setFollowers((fol.data||[]).map((f:any)=>f.follower_id))
      setReady(true)
    })
  },[user])

  const onLogout=async()=>{await supabase.auth.signOut();setUser(null);setLibrary([]);setReady(false)}

  const updLib=useCallback((fn:(p:any[])=>any[])=>{
    setLibrary(p=>{
      const n=fn(p)
      if(user){
        const newBook=n[0]
        if(newBook&&!p.find(b=>b.title===newBook.title)){
          supabase.from('library').insert({user_id:user.id,title:newBook.title,author:newBook.author||'',year:newBook.year||'',genre:newBook.genre||'',pages:newBook.pages||300,rating:newBook.rating}).then()
        } else {
          const changed=n.find(b=>p.find(x=>x.title===b.title&&x.rating!==b.rating))
          if(changed)supabase.from('library').update({rating:changed.rating}).eq('user_id',user.id).eq('title',changed.title).then()
        }
      }
      return n
    })
  },[user])

  const rateBook=useCallback((book:any,rating:string)=>{
    updLib(p=>{
      const e=p.find(b=>b.title===book.title)
      if(e&&e.rating===rating){toast$(lang==='pt'?'↩ Avaliação removida':'↩ Rating removed');return p.map(b=>b.title===book.title?{...b,rating:null}:b)}
      return e?p.map(b=>b.title===book.title?{...b,rating}:b):[{...book,rating,addedAt:Date.now()},...p]
    })
    toast$({loved:'❤️',saved:'🔖',disliked:'👎'}[rating]||'')
  },[updLib,toast$,lang])

  const addToWish=useCallback(async(book:any,priority='media')=>{
    if(wishlist.find(b=>b.title===book.title)){toast$(lang==='pt'?'Já na lista':'Already in list');return}
    const{data}=await supabase.from('wishlist').insert({user_id:user.id,title:book.title,author:book.author||'',pages:book.pages||300,priority}).select().single()
    setWishlist(p=>[{...book,priority,addedAt:Date.now(),dbId:data?.id},...p])
    toast$('🎯 '+t.bookAdded)
  },[wishlist,user,toast$,t,lang])

  const refreshAi=useCallback(async(mode:string)=>{
    const loved=library.filter(b=>b.rating==='loved');const books=mode==='last5'?loved.slice(0,5):loved;if(!books.length)return
    const isPt=lang==='pt'
    const cacheKey=`ai_profile:${user?.id}:${mode}:${books.map(b=>b.title).join(',').slice(0,80)}`
    try{
      const text=await callAI(
        isPt?'Retorne JSON APENAS (sem markdown):\n{"profile":"2-3 frases em português sobre o DNA literário do leitor","recs":[{"title":"...","author":"...","reason":"1-2 frases em português"}]}':'Return JSON ONLY (no markdown):\n{"profile":"2-3 sentences in English about this reader\'s literary DNA","recs":[{"title":"...","author":"...","reason":"1-2 sentences in English"}]}',
        isPt?`Livros amados: ${books.map(b=>`"${b.title}"`).join(', ')}\nAnalise e recomende 6 livros. Responda em português.`:`Books loved: ${books.map(b=>`"${b.title}"`).join(', ')}\nAnalyze and recommend 6 books. Respond in English.`,
        1200,{model:'sonnet',cacheKey}
      )
      const m=text.match(/\{[\s\S]*\}/)
      if(m){const ai=JSON.parse(m[0]);setAiAnalysis(ai)}
    }catch{}
  },[library,user,lang])

  const joinChallenge=useCallback(async(ch:any)=>{
    if(!user)return
    await supabase.from('challenges').insert({user_id:user.id,challenge_id:ch.id,title:ch.title,badge:ch.badge,color:ch.color,joined:true})
    setChallenges(p=>[...p.filter(c=>c.id!==ch.id),{...ch,joined:true,joinedAt:Date.now()}])
    toast$(lang==='pt'?'🎯 Desafio iniciado!':'🎯 Challenge started!')
  },[user,toast$,lang])

  const completeChallenge=useCallback(async(ch:any)=>{
    if(!user)return
    await supabase.from('challenges').update({completed:true,completed_at:new Date().toISOString()}).eq('user_id',user.id).eq('challenge_id',ch.id)
    setChallenges(p=>p.map(c=>c.id===ch.id?{...c,completed:true,completedAt:Date.now()}:c))
    toast$(`${ch.badge} ${lang==='pt'?'Selo conquistado!':'Badge earned!'}`)
  },[user,toast$,lang])

  const TABS=[
    {id:'home',label:t.home,icon:'🏠'},{id:'discover',label:t.discover,icon:'🔍'},
    {id:'shelf',label:t.shelf,icon:'📚'},{id:'reading',label:t.reading,icon:'📖'},
    {id:'timeline',label:t.timeline,icon:'📅'},{id:'challenges',label:t.challenges,icon:'🏅'},
    {id:'wishlist',label:t.wishlist,icon:'🎯'},{id:'social',label:t.social,icon:'👥'},
  ]

  if(checking||(!ready&&user))return(
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg}}>
      <style>{`@keyframes pulse{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}`}</style>
      <Dots/>
    </div>
  )

  return(
    <LangCtx.Provider value={{lang,t,toggle:toggleLang}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0F0D0B;color:#EDE8DE;font-family:'Jost',sans-serif}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#1A1714}::-webkit-scrollbar-thumb{background:#3D3428}
        @keyframes pulse{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
      {!user
        ?<AuthScreen onAuth={setUser} lang={lang} toggleLang={toggleLang}/>
        :<>
          <Toast msg={toast}/>
          <nav style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:100}}>
            <div style={{maxWidth:1060,margin:'0 auto',padding:'0 8px',display:'flex',alignItems:'center',justifyContent:'space-between',height:50}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:500,color:C.accent,letterSpacing:1,flexShrink:0,marginRight:8}}>📖 {t.appName}</span>
              <div style={{display:'flex',gap:0,overflowX:'auto',flex:1}}>
                {TABS.map(tb=>(
                  <button key={tb.id} onClick={()=>setTab(tb.id)} style={{padding:'7px 8px',border:'none',cursor:'pointer',background:'transparent',color:tab===tb.id?C.accent:C.muted,fontFamily:"'Jost',sans-serif",fontSize:9,fontWeight:tab===tb.id?600:400,letterSpacing:'0.8px',textTransform:'uppercase',borderBottom:tab===tb.id?`2px solid ${C.accent}`:'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:2,whiteSpace:'nowrap',flexShrink:0}}>
                    <span style={{fontSize:14}}>{tb.icon}</span><span>{tb.label}</span>
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0,marginLeft:8}}>
                <button onClick={toggleLang} style={{background:'none',border:`1px solid ${C.border}`,color:C.textDim,padding:'4px 10px',cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:9,letterSpacing:'1.5px'}}>{t.lang}</button>
                <button onClick={onLogout} style={{background:'none',border:`1px solid ${C.border}`,color:C.muted,padding:'4px 10px',cursor:'pointer',fontFamily:"'Jost',sans-serif",fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase'}}>{t.logout}</button>
              </div>
            </div>
          </nav>
          <div>
            {tab==='home'&&<HomeTab user={user} profile={profile} library={library} finished={finished} reading={reading} challenges={challenges} followers={followers} following={following}/>}
            {tab==='shelf'&&<ShelfTab library={library} onRate={rateBook} onUpdLib={updLib} onAddToWish={addToWish} aiAnalysis={aiAnalysis} onRefreshAi={refreshAi}/>}
            {tab==='timeline'&&<TimelineTab finished={finished}/>}
            {tab==='challenges'&&<ChallengesTab challenges={challenges} onComplete={completeChallenge} onJoin={joinChallenge}/>}
            {tab==='discover'&&<DiscoverTab t={t} lang={lang}/>}
            {tab==='reading'&&<div style={{padding:'48px 24px',maxWidth:920,margin:'0 auto'}}><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300}}>📖 {t.reading}</h2><div style={{marginTop:20,display:'flex',flexDirection:'column',gap:1,background:reading.length?C.border:'transparent'}}>{reading.length===0?<p style={{color:C.muted,fontStyle:'italic',fontFamily:"'Cormorant Garamond',serif",fontSize:17}}>{lang==='pt'?'Nenhum livro em andamento':'No books in progress'}</p>:reading.map((r:any,i:number)=><div key={i} style={{background:C.surface,padding:'14px 16px',display:'flex',gap:14,alignItems:'center'}}><Spine title={r.book.title} author={r.book.author||''} size={54}/><div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17}}>{r.book.title}</p><p style={{fontSize:10,color:C.accentDim,letterSpacing:'1.5px',textTransform:'uppercase',marginTop:3}}>{r.book.author}</p><div style={{marginTop:8,height:4,background:C.border,width:200}}><div style={{height:'100%',background:C.accent,width:`${Math.round(r.pages/Math.max(r.totalPages,1)*100)}%`}}/></div><p style={{fontSize:11,color:C.textDim,marginTop:4}}>{r.pages}/{r.totalPages} pgs · {Math.round(r.pages/Math.max(r.totalPages,1)*100)}%</p></div></div>)}</div></div>}
            {tab==='social'&&<div style={{padding:'48px 24px',maxWidth:920,margin:'0 auto'}}><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300}}>👥 {t.social}</h2><div style={{marginTop:20,background:C.surface,border:`1px solid ${C.border}`,padding:24,maxWidth:400}}><div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}><Avatar photo={profile?.photo} name={profile?.firstName||'Leitor'} size={52}/><div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20}}>{profile?.username?`@${profile.username}`:profile?.firstName||'Leitor'}</p><div style={{display:'flex',gap:12,marginTop:4}}><span style={{fontSize:11,color:C.muted}}>{followers.length} {t.followers}</span><span style={{fontSize:11,color:C.muted}}>{following.length} {t.following}</span></div></div></div><Btn full onClick={()=>toast$(lang==='pt'?'Perfil completo em breve!':'Full profile coming soon!')}>✎ {t.editProfile}</Btn></div></div>}
          </div>
        </>
      }
    </LangCtx.Provider>
  )
}
