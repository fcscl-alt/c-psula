'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Conta criada! Agora clique em Entrar.')
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  // ROTA PROTEGIDA: Só aparece se o usuário estiver logado
  if (session) {
    return (
      <div className="min-h-screen bg-black text-gray-300 flex flex-col items-center justify-center p-4 font-mono">
        <h1 className="text-2xl font-bold mb-2 text-white">Câmera de Intenção</h1>
        <p className="mb-8 text-xs text-zinc-500">Sessão autenticada e protegida.</p>
        
        {/* Mockup do Visor do MVP */}
        <div className="w-full max-w-sm bg-zinc-900 h-96 border-2 border-zinc-700 flex flex-col items-center justify-center mb-8 p-4 text-center">
          <p className="text-zinc-600 mb-4">[ Visor da Câmera ]</p>
        </div>

        <button className="bg-white text-black px-6 py-3 font-bold mb-8 w-full max-w-sm">
          Hold to record intent
        </button>

        <button onClick={() => supabase.auth.signOut()} className="text-sm underline text-zinc-600">
          Encerrar sessão (Logout)
        </button>
      </div>
    )
  }

  // TELA DE LOGIN: Aparece para quem não tem sessão
  return (
    <div className="min-h-screen bg-black text-gray-300 flex flex-col items-center justify-center p-4 font-mono">
      <h1 className="text-2xl font-bold mb-8 text-white">Acesso Restrito</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <input 
          type="email" 
          placeholder="E-mail" 
          className="p-3 bg-zinc-900 border border-zinc-700 text-white outline-none focus:border-white" 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Senha" 
          className="p-3 bg-zinc-900 border border-zinc-700 text-white outline-none focus:border-white" 
          onChange={e => setPassword(e.target.value)} 
        />
        <button onClick={handleLogin} className="bg-white text-black font-bold p-3 mt-2">
          Entrar
        </button>
        <button onClick={handleSignUp} className="border border-zinc-700 text-zinc-400 font-bold p-3 hover:text-white">
          Criar Conta
        </button>
      </div>
    </div>
  )
}