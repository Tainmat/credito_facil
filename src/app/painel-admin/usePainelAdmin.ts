import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// ─── Constants ────────────────────────────────────────────
export const AUTH_KEY = 'microcredito_admin_session'
export const STORAGE_KEY = 'microcredito_solicitacoes'
export const FINANCEIRO_KEY = 'microcredito_financeiro'
export const TAXA_JUROS_FIXO = 0.12
export const TAXA_MULTA_ATRASO = 0.02
export const TAXA_JUROS_ATRASO_DIA = 0.00033
export const MS_POR_DIA = 24 * 60 * 60 * 1000

// ─── Types ────────────────────────────────────────────────
export type StatusSolicitacao =
  | 'Pendente'
  | 'Em Análise'
  | 'Pix Feito'
  | 'Golpe'

export type Solicitacao = {
  id: string
  status?: string
  criadaEm?: string
  atualizadoEm?: string
  solicitante?: {
    nome?: string
    cpf?: string
    telefone?: string
    valor?: string
    pix?: string
    dataPagamento?: string
  }
  contato?: {
    nome?: string
    cpf?: string
    telefone?: string
    relacionamento?: string
  }
  pagamento?: {
    pago?: boolean
    valorPago?: string
    pagoEm?: string
  }
}

export type Financeiro = {
  caixa?: string
  caixaSalvo?: boolean
}

export type TransacaoCaixa = {
  id: string
  tipo: 'aporte' | 'resgate'
  valor: number
  descricao: string
  criadaEm: string
}

export interface DbSolicitacao {
  id: string
  status: string
  created_at: string
  updated_at: string
  solicitante_nome: string | null
  solicitante_cpf: string | null
  solicitante_telefone: string | null
  solicitante_valor: number | null
  solicitante_pix: string | null
  solicitante_data_pagamento: string | null
  contato_nome: string | null
  contato_cpf: string | null
  contato_telefone: string | null
  contato_relacionamento: string | null
  pagamento_pago: boolean | null
  pagamento_valor_pago: number | null
  pagamento_pago_em: string | null
}

export interface DbTransacaoCaixa {
  id: string
  tipo: string
  valor: number
  descricao: string | null
  created_at: string
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [inputCaixa, setInputCaixa] = useState('')
  const [caixaSalvo, setCaixaSalvo] = useState(false)
  const [modalAberta, setModalAberta] = useState<Solicitacao | null>(null)
  const [transacoesCaixa, setTransacoesCaixa] = useState<TransacaoCaixa[]>([])
  const cardsMinimizadosRef = useRef(new Set<string>())
  const [, forceUpdate] = useState(0)

  // Auth check & Load data
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
      recarregar()
    }

    checkAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const { data: dbSolicitacoes, error: sError } = await supabase
      .from('solicitacoes')
      .select('*')
      .order('created_at', { ascending: false })

    if (sError) {
      console.error('Erro ao carregar solicitações do Supabase:', sError)
      return
    }

    const { data: dbTransacoes, error: tError } = await supabase
      .from('transacoes_caixa')
      .select('*')
      .order('created_at', { ascending: false })

    if (tError) {
      console.error('Erro ao carregar transações de caixa do Supabase:', tError)
      return
    }

    const solicitacoesMapeadas = (dbSolicitacoes || []).map(mapearSolicitacao)
    setSolicitacoes(solicitacoesMapeadas)

    const txsMapeadas = (dbTransacoes || []).map((tx: DbTransacaoCaixa) => ({
      id: tx.id,
      tipo: tx.tipo as 'aporte' | 'resgate',
      valor: Number(tx.valor),
      descricao: tx.descricao || '',
      criadaEm: tx.created_at
    }))

    setTransacoesCaixa(txsMapeadas)

    // Calculate current caixa balance from the transaction history
    const totalAportes = txsMapeadas
      .filter((t) => t.tipo === 'aporte')
      .reduce((acc, t) => acc + t.valor, 0)
    const totalResgates = txsMapeadas
      .filter((t) => t.tipo === 'resgate')
      .reduce((acc, t) => acc + t.valor, 0)
    const saldoCaixa = totalAportes - totalResgates

    setInputCaixa(formatarMoeda(saldoCaixa))
    setCaixaSalvo(true)
  }

  async function sair() {
    await supabase.auth.signOut()
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

    // Fetch transactions to verify balance for withdrawals
    const { data: txs, error: fetchError } = await supabase
      .from('transacoes_caixa')
      .select('tipo, valor')

    if (fetchError) {
      console.error('Erro ao carregar transações para validação:', fetchError)
      return false
    }

    const totalAportes = (txs || [])
      .filter((t) => t.tipo === 'aporte')
      .reduce((acc, t) => acc + Number(t.valor), 0)
    const totalResgates = (txs || [])
      .filter((t) => t.tipo === 'resgate')
      .reduce((acc, t) => acc + Number(t.valor), 0)
    const caixaAtual = totalAportes - totalResgates

    if (tipo === 'resgate' && caixaAtual < valor) {
      alert('Saldo de caixa insuficiente para realizar o resgate!')
      return false
    }

    const { error: insertError } = await supabase
      .from('transacoes_caixa')
      .insert({
        id: `TX-${Date.now()}`,
        tipo,
        valor,
        descricao:
          descricao.trim() ||
          (tipo === 'aporte' ? 'Aporte de Capital' : 'Resgate de Capital'),
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Erro ao registrar transação no Supabase:', insertError)
      return false
    }

    await recarregar()
    return true
  }

  async function atualizarStatus(id: string, status: StatusSolicitacao) {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar status no Supabase:', error)
      return
    }

    await recarregar()

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
  }

  async function registrarPagamento(
    id: string,
    valorPago: string,
    dataPagamento: Date
  ) {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        pagamento_pago: true,
        pagamento_valor_pago: numeroMoeda(valorPago),
        pagamento_pago_em: dataPagamento.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao registrar pagamento no Supabase:', error)
      return
    }

    await recarregar()

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
  }

  async function limparPagamento(id: string) {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        pagamento_pago: false,
        pagamento_valor_pago: null,
        pagamento_pago_em: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao limpar pagamento no Supabase:', error)
      return
    }

    await recarregar()

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
    const { error } = await supabase.from('solicitacoes').delete().eq('id', id)

    if (error) {
      console.error('Erro ao remover solicitação no Supabase:', error)
      return
    }

    await recarregar()
    if (modalAberta?.id === id) setModalAberta(null)
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
      (s) => chaveHistoricoSolicitante(s) === chave
    )
    const anteriores = mesmos.filter((s) => s.id !== item.id)
    const pagos = anteriores.filter((s) => s.pagamento?.pago)
    const pagosCorretamente = pagos.filter(pagamentoFoiCorreto).length
    const pagosComAtraso = pagos.length - pagosCorretamente
    const emAberto = anteriores.filter((s) => !s.pagamento?.pago).length

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
  const solicitacoesFiltradas = solicitacoes.filter((s) => {
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
      (s) => normalizarStatus(s.status) === 'Pendente'
    ).length,
    analise: solicitacoes.filter(
      (s) => normalizarStatus(s.status) === 'Em Análise'
    ).length,
    pix: solicitacoes.filter((s) => normalizarStatus(s.status) === 'Pix Feito')
      .length,
    golpe: solicitacoes.filter((s) => normalizarStatus(s.status) === 'Golpe')
      .length,
    total: solicitacoes.length
  }

  const caixaValor = numeroMoeda(inputCaixa)
  const totalDisponibilizado = solicitacoes
    .filter((s) => normalizarStatus(s.status) === 'Pix Feito')
    .reduce((acc, s) => acc + numeroMoeda(s.solicitante?.valor), 0)

  const totalGanho = solicitacoes
    .filter(
      (s) => normalizarStatus(s.status) === 'Pix Feito' && s.pagamento?.pago
    )
    .reduce((acc, s) => {
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
