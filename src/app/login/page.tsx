'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

const AUTH_KEY = 'microcredito_admin_session'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem(AUTH_KEY)
      if (session) {
        router.replace('/painel-admin')
      }
    }
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) {
      setErro('Informe e-mail e senha para acessar o painel.')
      return
    }
    setErro('')
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ email, autenticadoEm: new Date().toISOString() })
    )
    router.replace('/painel-admin')
  }

  return (
    <div className="auth-glow min-h-screen flex items-center justify-center p-6 text-zinc-100 selection:bg-emerald-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center relative z-10">
        {/* Lado esquerdo */}
        <div className="hidden lg:block space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Microcredito Inteligente
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Acesso ao <span className="text-emerald-500">Painel</span>
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Gerencie solicitacoes, acompanhe pagamentos e controle o fluxo
            financeiro do microcredito em tempo real.
          </p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className="auth-card rounded-3xl p-8 space-y-6"
        >
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Entrar no painel</h2>
              <p className="text-sm text-zinc-500 mt-1">Area administrativa</p>
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field w-full rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-4 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="field w-full rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Erro */}
          {erro && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {erro}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            Entrar <ArrowRight className="w-5 h-5" />
          </button>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
            <span className="text-xs text-zinc-600">Acesso restrito</span>
          </div>
        </form>
      </div>
    </div>
  )
}
