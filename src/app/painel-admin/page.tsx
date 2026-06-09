'use client'

import { useMemo, useState } from 'react'
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
import {
  usePainelAdmin,
  calcularValorAtualizado,
  formatarMoeda,
  normalizarStatus,
  Solicitacao
} from './usePainelAdmin'
import { SolicitacaoCard } from './components/SolicitacaoCard'
import { StatCard } from './components/StatCard'
import { DetailModal } from './components/DetailModal'
import { OperacaoCaixaModal } from './components/OperacaoCaixaModal'
import { HistoricoCaixaModal } from './components/HistoricoCaixaModal'
import { NovoEmprestimoModal } from './components/NovoEmprestimoModal'

// ─── Page ─────────────────────────────────────────────────
type FiltroRecebimentos =
  | 'todos'
  | 'vencidos'
  | 'hoje'
  | 'proximos7'
  | 'proximos30'
  | 'semData'

type RecebimentoAberto = {
  item: Solicitacao
  resumo: ReturnType<typeof calcularValorAtualizado>
  diasAtePagamento: number | null
}

type ResumoRecebimentos = {
  total: number
  futuro: number
  vencido: number
  quantidade: number
}

const MS_POR_DIA = 24 * 60 * 60 * 1000

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

function parseDataPagamentoLocal(dataPagamento?: string): Date | null {
  if (!dataPagamento) return null
  const dataIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataPagamento)

  if (dataIso) {
    const data = new Date(
      Number(dataIso[1]),
      Number(dataIso[2]) - 1,
      Number(dataIso[3])
    )
    return Number.isNaN(data.getTime()) ? null : data
  }

  const data = new Date(dataPagamento)
  return Number.isNaN(data.getTime()) ? null : data
}

function obterDiasAtePagamento(dataPagamento?: string): number | null {
  const data = parseDataPagamentoLocal(dataPagamento)
  if (!data) return null

  const hoje = inicioDoDia(new Date())
  const vencimento = inicioDoDia(data)
  return Math.round((vencimento.getTime() - hoje.getTime()) / MS_POR_DIA)
}

function formatarDataRecebimento(dataPagamento?: string): string {
  const data = parseDataPagamentoLocal(dataPagamento)
  if (!data) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short'
  }).format(data)
}

function descreverPrazo(dias: number | null): string {
  if (dias === null) return 'Sem data'
  if (dias < 0) return `${Math.abs(dias)}d atrasado`
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanha'
  return `Em ${dias} dias`
}

function classePrazo(dias: number | null): string {
  if (dias === null) return 'text-zinc-400 border-zinc-700 bg-zinc-800/70'
  if (dias < 0) return 'text-red-300 border-red-500/25 bg-red-500/10'
  if (dias <= 7) return 'text-amber-300 border-amber-500/25 bg-amber-500/10'
  return 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10'
}

export default function PainelAdminPage() {
  const {
    isAuthenticated,
    solicitacoes,
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
    criarSolicitacaoManual,
    obterHistoricoSolicitante
  } = usePainelAdmin()

  const [modalCaixa, setModalCaixa] = useState<
    'aporte' | 'resgate' | 'historico' | null
  >(null)
  const [showNovoEmprestimo, setShowNovoEmprestimo] = useState(false)
  const [buscaRecebimentos, setBuscaRecebimentos] = useState('')
  const [filtroRecebimentos, setFiltroRecebimentos] =
    useState<FiltroRecebimentos>('todos')

  const recebimentosEmAberto = useMemo<RecebimentoAberto[]>(() => {
    return solicitacoes
      .filter(
        (item: Solicitacao) =>
          normalizarStatus(item.status) === 'Pix Feito' && !item.pagamento?.pago
      )
      .map((item: Solicitacao) => ({
        item,
        resumo: calcularValorAtualizado(item),
        diasAtePagamento: obterDiasAtePagamento(item.solicitante?.dataPagamento)
      }))
  }, [solicitacoes])

  const resumoRecebimentos = useMemo<ResumoRecebimentos>(() => {
    return recebimentosEmAberto.reduce<ResumoRecebimentos>(
      (acc, recebimento) => {
        acc.total += recebimento.resumo.valorAtualizado
        acc.quantidade += 1

        if (recebimento.diasAtePagamento !== null) {
          if (recebimento.diasAtePagamento < 0) {
            acc.vencido += recebimento.resumo.valorAtualizado
          } else {
            acc.futuro += recebimento.resumo.valorAtualizado
          }
        }

        return acc
      },
      { total: 0, futuro: 0, vencido: 0, quantidade: 0 }
    )
  }, [recebimentosEmAberto])

  const recebimentosFiltrados = useMemo<RecebimentoAberto[]>(() => {
    const termo = buscaRecebimentos.trim().toLowerCase()

    return recebimentosEmAberto
      .filter(({ diasAtePagamento }) => {
        if (filtroRecebimentos === 'vencidos') {
          return diasAtePagamento !== null && diasAtePagamento < 0
        }
        if (filtroRecebimentos === 'hoje') return diasAtePagamento === 0
        if (filtroRecebimentos === 'proximos7') {
          return (
            diasAtePagamento !== null &&
            diasAtePagamento >= 0 &&
            diasAtePagamento <= 7
          )
        }
        if (filtroRecebimentos === 'proximos30') {
          return (
            diasAtePagamento !== null &&
            diasAtePagamento >= 0 &&
            diasAtePagamento <= 30
          )
        }
        if (filtroRecebimentos === 'semData') {
          return diasAtePagamento === null
        }
        return true
      })
      .filter(({ item }) => {
        if (!termo) return true
        const campos = [
          item.id,
          item.solicitante?.nome,
          item.solicitante?.cpf,
          item.solicitante?.telefone
        ]
        return campos.some((campo) =>
          (campo ?? '').toLowerCase().includes(termo)
        )
      })
      .sort((a, b) => {
        if (a.diasAtePagamento === null && b.diasAtePagamento === null) {
          return 0
        }
        if (a.diasAtePagamento === null) return 1
        if (b.diasAtePagamento === null) return -1
        return a.diasAtePagamento - b.diasAtePagamento
      })
  }, [buscaRecebimentos, filtroRecebimentos, recebimentosEmAberto])

  const totalRecebimentosFiltrados = recebimentosFiltrados.reduce<number>(
    (acc, recebimento) => acc + recebimento.resumo.valorAtualizado,
    0
  )

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
              onClick={() => setShowNovoEmprestimo(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Empréstimo
            </button>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

            {/* A receber */}
            <div className="rounded-xl bg-zinc-900/60 border border-emerald-500/25 p-3">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                A receber
              </span>
              <p className="text-lg font-bold text-emerald-300 mt-1">
                {formatarMoeda(resumoRecebimentos.total)}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {resumoRecebimentos.quantidade} em aberto
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

          <div className="mt-5 border-t border-zinc-800/70 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Emprestimos a receber
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                    Filtrado: {formatarMoeda(totalRecebimentosFiltrados)}
                  </span>
                  <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    Futuro: {formatarMoeda(resumoRecebimentos.futuro)}
                  </span>
                  <span className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300">
                    Vencido: {formatarMoeda(resumoRecebimentos.vencido)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar recebimento..."
                    value={buscaRecebimentos}
                    onChange={(e) => setBuscaRecebimentos(e.target.value)}
                    className="field w-full sm:w-64 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="relative">
                  <ListFilter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={filtroRecebimentos}
                    onChange={(e) =>
                      setFiltroRecebimentos(
                        e.target.value as FiltroRecebimentos
                      )
                    }
                    className="field w-full appearance-none rounded-xl py-2 pl-9 pr-9 text-xs text-white cursor-pointer"
                  >
                    <option value="todos">Todos</option>
                    <option value="vencidos">Vencidos</option>
                    <option value="hoje">Hoje</option>
                    <option value="proximos7">Proximos 7 dias</option>
                    <option value="proximos30">Proximos 30 dias</option>
                    <option value="semData">Sem data</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {recebimentosFiltrados.length > 0 ? (
              <div className="space-y-2">
                {recebimentosFiltrados.map(
                  ({ item, resumo, diasAtePagamento }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setModalAberta(item)}
                      className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-left hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {item.solicitante?.nome || 'Sem nome'}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                            {item.id}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] text-zinc-600">
                            Vencimento
                          </span>
                          <p className="text-xs font-semibold text-zinc-300">
                            {formatarDataRecebimento(
                              item.solicitante?.dataPagamento
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] text-zinc-600">
                            Emprestado
                          </span>
                          <p className="text-xs font-semibold text-amber-300">
                            {formatarMoeda(resumo.valorEmprestado)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 md:block">
                          <div>
                            <span className="text-[11px] text-zinc-600">
                              A receber
                            </span>
                            <p className="text-sm font-bold text-emerald-300">
                              {formatarMoeda(resumo.valorAtualizado)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-semibold ${classePrazo(
                              diasAtePagamento
                            )}`}
                          >
                            {descreverPrazo(diasAtePagamento)}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center">
                <p className="text-sm text-zinc-500">
                  Nenhum emprestimo a receber neste filtro
                </p>
              </div>
            )}
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

      {/* Modal Novo Empréstimo */}
      {showNovoEmprestimo && (
        <NovoEmprestimoModal
          onClose={() => setShowNovoEmprestimo(false)}
          onConfirm={criarSolicitacaoManual}
        />
      )}
    </div>
  )
}
