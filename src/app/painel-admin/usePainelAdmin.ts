import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getSession, onAuthStateChange } from '../../api/accounts'
import {
  StatusSolicitacao,
  Solicitacao,
  DbSolicitacao
} from '../../api/solicitacoes'
import { DbTransacaoCaixa, TransacaoCaixa } from '../../api/transacoes'

// Queries
import { useBuscarSolicitacoesQuery } from '../../hooks/services/queries/useBuscarSolicitacoesQuery'
import { useBuscarTransacoesQuery } from '../../hooks/services/queries/useBuscarTransacoesQuery'

// Mutations
import { useSignOutMutation } from '../../hooks/services/mutations/useSignOutMutation'
import { useAdicionarTransacaoCaixaMutation } from '../../hooks/services/mutations/useAdicionarTransacaoCaixaMutation'
import { useAtualizarSolicitacaoStatusMutation } from '../../hooks/services/mutations/useAtualizarSolicitacaoStatusMutation'
import { useRegistrarPagamentoMutation } from '../../hooks/services/mutations/useRegistrarPagamentoMutation'
import { useLimparPagamentoMutation } from '../../hooks/services/mutations/useLimparPagamentoMutation'
import { useRemoverSolicitacaoMutation } from '../../hooks/services/mutations/useRemoverSolicitacaoMutation'

// Re-exportação de tipos para manter retrocompatibilidade com componentes das páginas
export type {
  StatusSolicitacao,
  Solicitacao,
  DbSolicitacao,
  DbTransacaoCaixa,
  TransacaoCaixa
}

// ─── Constants ────────────────────────────────────────────
export const AUTH_KEY = 'microcredito_admin_session'
export const STORAGE_KEY = 'microcredito_solicitacoes'
export const FINANCEIRO_KEY = 'microcredito_financeiro'
export const TAXA_JUROS_FIXO = 0.12
export const TAXA_MULTA_ATRASO = 0.02
export const TAXA_JUROS_ATRASO_DIA = 0.00033
export const MS_POR_DIA = 24 * 60 * 60 * 1000

// ─── Types ────────────────────────────────────────────────
export type Financeiro = {
  caixa?: string
  caixaSalvo?: boolean
}

export type ResumoJuros = {
  valorEmprestado: number
  valorComJuros: number
  valorAtualizado: number
  jurosFixo: number
  multaAtraso: number
  jurosAtraso: number
  atrasoDias: number
}

export type HistoricoSolicitante = {
  total: number
  anteriores: number
  pagosCorretamente: number
  pagosComAtraso: number
  emAberto: number
  avaliacao: string
  classeAvaliacao: string
}

// ─── Pure functions ───────────────────────────────────────
export function normalizarStatus(status?: string): StatusSolicitacao {
  const map: Record<string, StatusSolicitacao> = {
    pendente: 'Pendente',
    'em análise': 'Em Análise',
    'em analise': 'Em Análise',
    'pix feito': 'Pix Feito',
    golpe: 'Golpe'
  }
  return map[(status ?? '').toLowerCase().trim()] ?? 'Pendente'
}

export function classeStatus(status: StatusSolicitacao): string {
  const map: Record<StatusSolicitacao, string> = {
    Pendente: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    'Em Análise': 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
    'Pix Feito':
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    Golpe: 'bg-red-500/15 text-red-300 border border-red-500/25'
  }
  return map[status] ?? ''
}

export function numeroMoeda(valor: string | undefined | null): number {
  if (!valor) return 0
  const limpo = valor.replace(/[^\d,.]/g, '')
  if (limpo.includes(',') && limpo.includes('.')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.')) || 0
  }
  if (limpo.includes(',')) {
    return parseFloat(limpo.replace(',', '.')) || 0
  }
  return parseFloat(limpo) || 0
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function formatarCampoCaixa(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export function formatarData(dataISO?: string): string {
  if (!dataISO) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dataISO))
  } catch {
    return '—'
  }
}

export function formatarDataCurta(data?: string): string {
  if (!data) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short'
    }).format(new Date(data))
  } catch {
    return '—'
  }
}

export function formatarDataPagamentoRegistrado(dataISO?: string): string {
  if (!dataISO) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dataISO))
  } catch {
    return '—'
  }
}

export function formatarDataInputPagamento(dataISO?: string): string {
  if (!dataISO) return ''
  try {
    const d = new Date(dataISO)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

export function criarDataPagamentoManual(valor: string): Date | null {
  if (!valor) return null
  const parts = valor.split('-')
  if (parts.length !== 3) return null
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  )
  return isNaN(d.getTime()) ? null : d
}

export function parseDataPagamento(data?: string): Date | null {
  if (!data) return null
  const d = new Date(data)
  return isNaN(d.getTime()) ? null : d
}

export function dataSemHorario(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

export function diasDeAtraso(
  dataPagamento?: string,
  dataReferencia?: Date
): number {
  const dp = parseDataPagamento(dataPagamento)
  if (!dp) return 0
  const ref = dataReferencia
    ? dataSemHorario(dataReferencia)
    : dataSemHorario(new Date())
  const pagDia = dataSemHorario(dp)
  const diff = ref.getTime() - pagDia.getTime()
  return diff > 0 ? Math.floor(diff / MS_POR_DIA) : 0
}

export function calcularValorAtualizado(
  item: Solicitacao,
  dataReferenciaManual?: Date | null
): ResumoJuros {
  const valorEmprestado = numeroMoeda(item.solicitante?.valor)
  const jurosFixo = valorEmprestado * TAXA_JUROS_FIXO
  const valorComJuros = valorEmprestado + jurosFixo

  const atraso = diasDeAtraso(
    item.solicitante?.dataPagamento,
    dataReferenciaManual ?? undefined
  )
  const multaAtraso = atraso > 0 ? valorComJuros * TAXA_MULTA_ATRASO : 0
  const jurosAtraso =
    atraso > 0 ? valorComJuros * TAXA_JUROS_ATRASO_DIA * atraso : 0
  const valorAtualizado = valorComJuros + multaAtraso + jurosAtraso

  return {
    valorEmprestado,
    valorComJuros,
    valorAtualizado,
    jurosFixo,
    multaAtraso,
    jurosAtraso,
    atrasoDias: atraso
  }
}

export function classeValorAtualizado(resumo: ResumoJuros): string {
  if (resumo.atrasoDias > 0) return 'text-red-400'
  return 'text-emerald-400'
}

export function textoDetalheJuros(resumo: ResumoJuros): string {
  const parts = [`Juros fixo: ${formatarMoeda(resumo.jurosFixo)} (12%)`]
  if (resumo.atrasoDias > 0) {
    parts.push(
      `Multa atraso: ${formatarMoeda(resumo.multaAtraso)} (2%)`,
      `Juros atraso: ${formatarMoeda(resumo.jurosAtraso)} (0,033%/dia x ${
        resumo.atrasoDias
      }d)`
    )
  }
  return parts.join(' | ')
}

export function normalizarTextoHistorico(valor: string): string {
  return (valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function chaveHistoricoSolicitante(item: Solicitacao): string {
  const cpf = (item.solicitante?.cpf ?? '').replace(/\D/g, '')
  if (cpf) return cpf
  return normalizarTextoHistorico(item.solicitante?.nome ?? '')
}

export function pagamentoFoiCorreto(item: Solicitacao): boolean {
  if (!item.pagamento?.pago) return false
  const dataPag = parseDataPagamento(item.solicitante?.dataPagamento)
  const dataPago = parseDataPagamento(item.pagamento?.pagoEm)
  if (!dataPag || !dataPago) return true
  return dataSemHorario(dataPago) <= dataSemHorario(dataPag)
}

export function htmlEscape(valor: unknown): string {
  const str = String(valor ?? '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function mapearSolicitacao(db: DbSolicitacao): Solicitacao {
  return {
    id: db.id,
    status: db.status,
    criadaEm: db.created_at,
    atualizadoEm: db.updated_at,
    solicitante: {
      nome: db.solicitante_nome ?? undefined,
      cpf: db.solicitante_cpf ?? undefined,
      telefone: db.solicitante_telefone ?? undefined,
      valor: db.solicitante_valor?.toString() || '0',
      pix: db.solicitante_pix ?? undefined,
      dataPagamento: db.solicitante_data_pagamento ?? undefined
    },
    contato: {
      nome: db.contato_nome ?? undefined,
      cpf: db.contato_cpf ?? undefined,
      telefone: db.contato_telefone ?? undefined,
      relacionamento: db.contato_relacionamento ?? undefined
    },
    pagamento: {
      pago: db.pagamento_pago ?? false,
      valorPago: db.pagamento_valor_pago?.toString() || '',
      pagoEm: db.pagamento_pago_em ?? undefined
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────
export function usePainelAdmin() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [inputCaixa, setInputCaixa] = useState('')
  const [caixaSalvo, setCaixaSalvo] = useState(false)
  const [modalAberta, setModalAberta] = useState<Solicitacao | null>(null)

  const cardsMinimizadosRef = useRef(new Set<string>())
  const [, forceUpdate] = useState(0)

  // Queries
  const { data: solicitacoes = [], refetch: refetchSolicitacoes } =
    useBuscarSolicitacoesQuery()
  const { data: transacoesCaixa = [], refetch: refetchTransacoes } =
    useBuscarTransacoesQuery()

  // Mutations
  const signOutMutation = useSignOutMutation()
  const adicionarTransacaoMutation = useAdicionarTransacaoCaixaMutation()
  const atualizarStatusMutation = useAtualizarSolicitacaoStatusMutation()
  const registrarPagamentoMutation = useRegistrarPagamentoMutation()
  const limparPagamentoMutation = useLimparPagamentoMutation()
  const removerSolicitacaoMutation = useRemoverSolicitacaoMutation()

  // Calculate current caixa balance from the transaction history
  const totalAportes = transacoesCaixa
    .filter((t: TransacaoCaixa) => t.tipo === 'aporte')
    .reduce((acc: number, t: TransacaoCaixa) => acc + t.valor, 0)
  const totalResgates = transacoesCaixa
    .filter((t: TransacaoCaixa) => t.tipo === 'resgate')
    .reduce((acc: number, t: TransacaoCaixa) => acc + t.valor, 0)
  const saldoCaixa = totalAportes - totalResgates

  // Sincroniza inputCaixa sempre que o saldo do banco mudar de forma reativa!
  useEffect(() => {
    setInputCaixa(formatarMoeda(saldoCaixa))
    setCaixaSalvo(true)
  }, [saldoCaixa])

  // Escuta alterações no banco de dados em tempo real via Supabase Realtime
  useEffect(() => {
    if (!isAuthenticated) return

    const channelSolicitacoes = supabase
      .channel('solicitacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
        }
      )
      .subscribe()

    const channelTransacoes = supabase
      .channel('transacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes_caixa'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transacoes'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelSolicitacoes)
      supabase.removeChannel(channelTransacoes)
    }
  }, [isAuthenticated, queryClient])

  // Auth check & Session tracking
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession()
        if (!session) {
          router.push('/login')
          return
        }
        setIsAuthenticated(true)
      } catch (err) {
        console.error('Erro na checagem de auth:', err)
        router.push('/login')
      }
    }

    checkAuth()

    const subscription = onAuthStateChange((session) => {
      if (!session) {
        setIsAuthenticated(false)
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAberta(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Block scroll when modal open
  useEffect(() => {
    if (modalAberta) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalAberta])

  async function recarregar() {
    await Promise.all([refetchSolicitacoes(), refetchTransacoes()])
  }

  async function sair() {
    await signOutMutation.mutateAsync()
    router.push('/login')
  }

  function salvarFinanceiro() {
    // Obsoleto, mas mantido para retrocompatibilidade
  }

  function editarCaixa() {
    // Obsoleto, mas mantido para retrocompatibilidade
  }

  async function realizarTransacaoCaixa(
    tipo: 'aporte' | 'resgate',
    valor: number,
    descricao: string
  ): Promise<boolean> {
    if (valor <= 0) return false

    if (tipo === 'resgate' && saldoCaixa < valor) {
      alert('Saldo de caixa insuficiente para realizar o resgate!')
      return false
    }

    try {
      await adicionarTransacaoMutation.mutateAsync({
        id: `TX-${Date.now()}`,
        tipo,
        valor,
        descricao:
          descricao.trim() ||
          (tipo === 'aporte' ? 'Aporte de Capital' : 'Resgate de Capital')
      })
      return true
    } catch (err) {
      console.error('Erro ao registrar transação:', err)
      return false
    }
  }

  async function atualizarStatus(id: string, status: StatusSolicitacao) {
    try {
      await atualizarStatusMutation.mutateAsync({ id, status })

      if (modalAberta?.id === id) {
        setModalAberta((m) => {
          if (!m) return null
          return {
            ...m,
            status,
            atualizadoEm: new Date().toISOString()
          }
        })
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  async function registrarPagamento(
    id: string,
    valorPago: string,
    dataPagamento: Date
  ) {
    try {
      await registrarPagamentoMutation.mutateAsync({
        id,
        pago: true,
        valorPago: numeroMoeda(valorPago),
        pagoEm: dataPagamento.toISOString()
      })

      if (modalAberta?.id === id) {
        setModalAberta((m) => {
          if (!m) return null
          return {
            ...m,
            pagamento: {
              pago: true,
              valorPago,
              pagoEm: dataPagamento.toISOString()
            },
            atualizadoEm: new Date().toISOString()
          }
        })
      }
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err)
    }
  }

  async function limparPagamento(id: string) {
    try {
      await limparPagamentoMutation.mutateAsync(id)

      if (modalAberta?.id === id) {
        setModalAberta((m) => {
          if (!m) return null
          return {
            ...m,
            pagamento: { pago: false, valorPago: '', pagoEm: '' },
            atualizadoEm: new Date().toISOString()
          }
        })
      }
    } catch (err) {
      console.error('Erro ao limpar pagamento:', err)
    }
  }

  const copiarPix = useCallback(async (pix: string) => {
    try {
      await navigator.clipboard.writeText(pix)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = pix
      document.body.appendChild(ta)
      ta.select()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }, [])

  async function removerSolicitacao(id: string) {
    if (!window.confirm('Remover esta solicitacao do painel?')) return
    try {
      await removerSolicitacaoMutation.mutateAsync(id)
      if (modalAberta?.id === id) setModalAberta(null)
    } catch (err) {
      console.error('Erro ao remover solicitação:', err)
    }
  }

  function alternarCard(id: string) {
    const set = cardsMinimizadosRef.current
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    forceUpdate((n) => n + 1)
  }

  function obterHistoricoSolicitante(item: Solicitacao): HistoricoSolicitante {
    const chave = chaveHistoricoSolicitante(item)
    if (!chave) {
      return {
        total: 0,
        anteriores: 0,
        pagosCorretamente: 0,
        pagosComAtraso: 0,
        emAberto: 0,
        avaliacao: 'Sem dados',
        classeAvaliacao: 'text-zinc-500'
      }
    }

    const mesmos = solicitacoes.filter(
      (s: Solicitacao) => chaveHistoricoSolicitante(s) === chave
    )
    const anteriores = mesmos.filter((s: Solicitacao) => s.id !== item.id)
    const pagos = anteriores.filter((s: Solicitacao) => s.pagamento?.pago)
    const pagosCorretamente = pagos.filter(pagamentoFoiCorreto).length
    const pagosComAtraso = pagos.length - pagosCorretamente
    const emAberto = anteriores.filter(
      (s: Solicitacao) => !s.pagamento?.pago
    ).length

    let avaliacao = 'Novo cliente'
    let classeAvaliacao = 'text-zinc-400'
    if (anteriores.length > 0) {
      if (pagosComAtraso === 0 && emAberto === 0) {
        avaliacao = 'Bom pagador'
        classeAvaliacao = 'text-emerald-400'
      } else if (emAberto > 0) {
        avaliacao = 'Com pendencias'
        classeAvaliacao = 'text-amber-400'
      } else {
        avaliacao = 'Historico misto'
        classeAvaliacao = 'text-amber-400'
      }
    }

    return {
      total: mesmos.length,
      anteriores: anteriores.length,
      pagosCorretamente,
      pagosComAtraso,
      emAberto,
      avaliacao,
      classeAvaliacao
    }
  }

  // Computed
  const solicitacoesFiltradas = solicitacoes.filter((s: Solicitacao) => {
    const status = normalizarStatus(s.status)
    if (filtroStatus && status !== filtroStatus) return false
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      const campos = [
        s.id,
        s.solicitante?.nome,
        s.solicitante?.cpf,
        s.solicitante?.telefone,
        s.solicitante?.pix,
        s.contato?.nome,
        s.contato?.cpf,
        s.contato?.telefone
      ]
      return campos.some((c) => (c ?? '').toLowerCase().includes(termo))
    }
    return true
  })

  const indicadores = {
    pendente: solicitacoes.filter(
      (s: Solicitacao) => normalizarStatus(s.status) === 'Pendente'
    ).length,
    analise: solicitacoes.filter(
      (s: Solicitacao) => normalizarStatus(s.status) === 'Em Análise'
    ).length,
    pix: solicitacoes.filter(
      (s: Solicitacao) => normalizarStatus(s.status) === 'Pix Feito'
    ).length,
    golpe: solicitacoes.filter(
      (s: Solicitacao) => normalizarStatus(s.status) === 'Golpe'
    ).length,
    total: solicitacoes.length
  }

  const caixaValor = numeroMoeda(inputCaixa)
  const totalDisponibilizado = solicitacoes
    .filter((s: Solicitacao) => normalizarStatus(s.status) === 'Pix Feito')
    .reduce(
      (acc: number, s: Solicitacao) => acc + numeroMoeda(s.solicitante?.valor),
      0
    )

  const totalGanho = solicitacoes
    .filter(
      (s: Solicitacao) =>
        normalizarStatus(s.status) === 'Pix Feito' && s.pagamento?.pago
    )
    .reduce((acc: number, s: Solicitacao) => {
      const resumo = calcularValorAtualizado(s)
      const pago = numeroMoeda(s.pagamento?.valorPago)
      return acc + (pago - resumo.valorEmprestado)
    }, 0)

  const financeiro = {
    disponibilizado: totalDisponibilizado,
    ganho: totalGanho,
    disponivel: caixaValor - totalDisponibilizado
  }

  return {
    isAuthenticated,
    solicitacoes,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    inputCaixa,
    setInputCaixa,
    caixaSalvo,
    setCaixaSalvo,
    modalAberta,
    setModalAberta,
    transacoesCaixa,
    cardsMinimizados: cardsMinimizadosRef.current,
    solicitacoesFiltradas,
    indicadores,
    financeiro,
    sair,
    salvarFinanceiro,
    editarCaixa,
    realizarTransacaoCaixa,
    recarregar,
    atualizarStatus,
    registrarPagamento,
    limparPagamento,
    copiarPix,
    removerSolicitacao,
    alternarCard,
    obterHistoricoSolicitante,
    formatarCampoCaixa
  }
}
