'use client'

import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  Route,
  ClipboardPenLine,
  ContactRound,
  TriangleAlert,
  Timer,
  Zap,
  ShieldCheck,
  Users
} from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-[#0a0a0a] text-zinc-100 min-h-screen flex flex-col items-center p-6 selection:bg-emerald-500/30">
      <div className="fixed top-0 left-0 w-full h-full hero-gradient pointer-events-none z-0" />

      <main className="max-w-5xl w-full text-center relative z-10 pt-16 md:pt-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          Crédito rápido e sem burocracia
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Microcrédito <span className="text-emerald-500">Inteligente</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Soluções financeiras simples para impulsionar seus projetos. Solicite
          agora e receba uma resposta em tempo recorde.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/solicitacao"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-emerald-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
          >
            Solicitar Crédito Agora
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Como funciona */}
        <section className="mt-20 text-left" aria-label="Como funciona">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold uppercase tracking-[0.2em]">
              <Route className="w-4 h-4 text-emerald-400" />
              Como funciona
            </span>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-12 right-12 top-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className="process-line h-full w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <article
                className="process-card glass-card relative p-5 rounded-2xl"
                style={{ '--delay': '0ms' } as React.CSSProperties}
              >
                <div className="process-icon w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                  <ClipboardPenLine className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-400 mb-2">
                  Etapa 01
                </p>
                <h3 className="text-lg font-bold text-white mb-2">
                  Dados do solicitante
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Você preenche as informações pessoais e os dados necessários
                  para iniciar a análise.
                </p>
              </article>

              <article
                className="process-card glass-card relative p-5 rounded-2xl"
                style={{ '--delay': '140ms' } as React.CSSProperties}
              >
                <div className="process-icon w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 mb-5">
                  <ContactRound className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-cyan-300 mb-2">Etapa 02</p>
                <h3 className="text-lg font-bold text-white mb-2">
                  Contato de confiança
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Em seguida, você preenche os dados do contato de confiança que
                  fará parte da solicitação.
                </p>
              </article>

              <article
                className="process-card glass-card relative p-5 rounded-2xl"
                style={{ '--delay': '280ms' } as React.CSSProperties}
              >
                <div className="process-icon w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 mb-5">
                  <TriangleAlert className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-amber-300 mb-2">
                  Etapa 03
                </p>
                <h3 className="text-lg font-bold text-white mb-2">
                  Atenção ao compromisso
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Caso a parcela não seja paga ou ocorram atrasos, o contato de
                  confiança não poderá solicitar um empréstimo no futuro.
                </p>
              </article>

              <article
                className="process-card glass-card relative p-5 rounded-2xl"
                style={{ '--delay': '420ms' } as React.CSSProperties}
              >
                <div className="process-icon w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                  <Timer className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-400 mb-2">
                  Etapa 04
                </p>
                <h3 className="text-lg font-bold text-white mb-2">
                  Crédito liberado
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Após a aprovação, disponibilizamos o empréstimo em até 20
                  minutos.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Rápido</h3>
            <p className="text-sm text-zinc-500">
              Processo simplificado e resposta ágil para suas necessidades.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Seguro</h3>
            <p className="text-sm text-zinc-500">
              Seus dados protegidos e transparência em todas as etapas.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Acessível</h3>
            <p className="text-sm text-zinc-500">
              Feito para pequenos empreendedores e pessoas físicas.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-zinc-600 text-sm relative z-10">
        &copy; 2024 Microcrédito Inteligente. Todos os direitos reservados.
      </footer>
    </div>
  )
}
