'use client'

import { useState } from 'react'
import {
  Clock3,
  ScanSearch,
  CheckCircle2,
  ShieldAlert,
  ListChecks,
  WalletCards,
  Search,
  ChevronDown,
  RefreshCw,
  LogOut,
  ListFilter,
  Inbox,
  Plus,
  Minus,
  History
} from 'lucide-react'
import { usePainelAdmin, formatarMoeda, Solicitacao } from './usePainelAdmin'
import { SolicitacaoCard } from './components/SolicitacaoCard'
import { StatCard } from './components/StatCard'
import { DetailModal } from './components/DetailModal'
import { OperacaoCaixaModal } from './components/OperacaoCaixaModal'
import { HistoricoCaixaModal } from './components/HistoricoCaixaModal'

// ─── Page ─────────────────────────────────────────────────
export default function PainelAdminPage() {
  const {
    isAuthenticated,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    inputCaixa,
    modalAberta,
    setModalAberta,
    transacoesCaixa,
    solicitacoesFiltradas,
    indicadores,
    financeiro,
    sair,
    realizarTransacaoCaixa,
    recarregar,
    atualizarStatus,
    registrarPagamento,
    limparPagamento,
    copiarPix,
    removerSolicitacao,
    obterHistoricoSolicitante
  } = usePainelAdmin()

  const [modalCaixa, setModalCaixa] = useState<
    'aporte' | 'resgate' | 'historico' | null
  >(null)

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 md:p-8 selection:bg-emerald-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Painel <span className="text-emerald-500">Admin</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Gerenciamento de solicitacoes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recarregar}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
            <button
              type="button"
              onClick={sair}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            icon={Clock3}
            label="Pendentes"
            value={indicadores.pendente}
            color="amber"
          />
          <StatCard
            icon={ScanSearch}
            label="Em Analise"
            value={indicadores.analise}
            color="sky"
          />
          <StatCard
            icon={CheckCircle2}
            label="Pix Feito"
            value={indicadores.pix}
            color="emerald"
          />
          <StatCard
            icon={ShieldAlert}
            label="Golpe"
            value={indicadores.golpe}
            color="red"
          />
          <StatCard
            icon={ListChecks}
            label="Total"
            value={indicadores.total}
            color="zinc"
          />
        </div>

        {/* Controle financeiro */}
        <div className="rounded-2xl bg-[#121212] border border-zinc-800/60 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <WalletCards className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Controle Financeiro
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Caixa */}
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Caixa Total
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModalCaixa('aporte')}
                    className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    title="Aportar Capital"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalCaixa('resgate')}
                    className="p-1 rounded bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Resgatar Capital"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalCaixa('historico')
                    }}
                    className="p-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    title="Histórico do Caixa"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-lg font-bold text-white mt-1">{inputCaixa}</p>
            </div>

            {/* Disponibilizado */}
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Emprestado
              </span>
              <p className="text-lg font-bold text-amber-300 mt-1">
                {formatarMoeda(financeiro.disponibilizado)}
              </p>
            </div>

            {/* Disponivel */}
            <div className="rounded-xl bg-zinc-900/60 border border-sky-500/25 p-3">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Disponivel
              </span>
              <p className="text-lg font-bold text-sky-300 mt-1">
                {formatarMoeda(financeiro.disponivel)}
              </p>
            </div>

            {/* Lucro */}
            <div className="rounded-xl bg-zinc-900/60 border border-emerald-500/25 p-3">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Lucro
              </span>
              <p className="text-lg font-bold text-emerald-300 mt-1">
                {formatarMoeda(financeiro.ganho)}
              </p>
            </div>
          </div>
        </div>

        {/* Busca + filtro */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone, PIX..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="field w-full rounded-xl py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="relative">
            <ListFilter className="absolute left-4 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="field appearance-none rounded-xl py-2.5 pl-10 pr-10 text-sm text-white cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Analise</option>
              <option value="Pix Feito">Pix Feito</option>
              <option value="Golpe">Golpe</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Grid */}
        {solicitacoesFiltradas.length > 0 ? (
          <div className="solicitacoes-grid">
            {solicitacoesFiltradas.map((item: Solicitacao) => (
              <SolicitacaoCard
                key={item.id}
                item={item}
                onClick={() => setModalAberta(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">
              Nenhuma solicitacao encontrada
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberta && (
        <DetailModal
          item={modalAberta}
          onClose={() => setModalAberta(null)}
          onCopiarPix={(pix) => copiarPix(pix)}
          onAtualizarStatus={atualizarStatus}
          onRemover={removerSolicitacao}
          onRegistrarPagamento={registrarPagamento}
          onLimparPagamento={limparPagamento}
          historico={obterHistoricoSolicitante(modalAberta)}
        />
      )}

      {/* Modal Aporte / Resgate */}
      {modalCaixa && modalCaixa !== 'historico' && (
        <OperacaoCaixaModal
          tipo={modalCaixa}
          onClose={() => setModalCaixa(null)}
          onConfirm={realizarTransacaoCaixa}
        />
      )}

      {/* Modal Histórico */}
      {modalCaixa === 'historico' && (
        <HistoricoCaixaModal
          onClose={() => setModalCaixa(null)}
          transacoes={transacoesCaixa}
        />
      )}
    </div>
  )
}
