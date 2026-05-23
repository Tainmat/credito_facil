import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  return parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
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

  // Auth check
  useEffect(() => {
    const session = localStorage.getItem(AUTH_KEY)
    if (!session) {
      router.push('/login')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return
    recarregar()
    const fin: Financeiro = JSON.parse(
      localStorage.getItem(FINANCEIRO_KEY) || '{}'
    )
    if (fin.caixa) {
      setInputCaixa(fin.caixa)
      setCaixaSalvo(!!fin.caixaSalvo)
    } else {
      setInputCaixa('R$ 0,00')
      setCaixaSalvo(true)
    }
    const txs = JSON.parse(
      localStorage.getItem('microcredito_transacoes_caixa') || '[]'
    )
    setTransacoesCaixa(txs)
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function recarregar() {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    setSolicitacoes(data)
  }

  function sair() {
    localStorage.removeItem(AUTH_KEY)
    router.push('/login')
  }

  function salvarFinanceiro() {
    const formatted = formatarCampoCaixa(inputCaixa)
    setInputCaixa(formatted)
    setCaixaSalvo(true)
    localStorage.setItem(
      FINANCEIRO_KEY,
      JSON.stringify({ caixa: formatted, caixaSalvo: true })
    )
  }

  function editarCaixa() {
    setCaixaSalvo(false)
  }

  function realizarTransacaoCaixa(
    tipo: 'aporte' | 'resgate',
    valor: number,
    descricao: string
  ): boolean {
    if (valor <= 0) return false

    const caixaAtual = numeroMoeda(inputCaixa)
    let novoCaixa = caixaAtual
    if (tipo === 'aporte') {
      novoCaixa += valor
    } else {
      if (caixaAtual < valor) {
        alert('Saldo de caixa insuficiente para realizar o resgate!')
        return false
      }
      novoCaixa -= valor
    }

    const formattedCaixa = formatarMoeda(novoCaixa)
    setInputCaixa(formattedCaixa)
    setCaixaSalvo(true)
    localStorage.setItem(
      FINANCEIRO_KEY,
      JSON.stringify({ caixa: formattedCaixa, caixaSalvo: true })
    )

    const novaTx: TransacaoCaixa = {
      id: `TX-${Date.now()}`,
      tipo,
      valor,
      descricao:
        descricao.trim() ||
        (tipo === 'aporte' ? 'Aporte de Capital' : 'Resgate de Capital'),
      criadaEm: new Date().toISOString()
    }

    const novasTxs = [novaTx, ...transacoesCaixa]
    setTransacoesCaixa(novasTxs)
    localStorage.setItem(
      'microcredito_transacoes_caixa',
      JSON.stringify(novasTxs)
    )
    return true
  }

  function atualizarStatus(id: string, status: StatusSolicitacao) {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    const updated = data.map((s) =>
      s.id === id ? { ...s, status, atualizadoEm: new Date().toISOString() } : s
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSolicitacoes(updated)
    if (modalAberta?.id === id) {
      setModalAberta({
        ...modalAberta,
        status,
        atualizadoEm: new Date().toISOString()
      })
    }
  }

  function registrarPagamento(
    id: string,
    valorPago: string,
    dataPagamento: Date
  ) {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    const updated = data.map((s) =>
      s.id === id
        ? {
            ...s,
            pagamento: {
              pago: true,
              valorPago,
              pagoEm: dataPagamento.toISOString()
            },
            atualizadoEm: new Date().toISOString()
          }
        : s
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSolicitacoes(updated)
    const updatedItem = updated.find((s) => s.id === id)
    if (modalAberta?.id === id && updatedItem) {
      setModalAberta(updatedItem)
    }
  }

  function limparPagamento(id: string) {
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    const updated = data.map((s) =>
      s.id === id
        ? {
            ...s,
            pagamento: { pago: false, valorPago: '', pagoEm: '' },
            atualizadoEm: new Date().toISOString()
          }
        : s
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSolicitacoes(updated)
    const updatedItem = updated.find((s) => s.id === id)
    if (modalAberta?.id === id && updatedItem) {
      setModalAberta(updatedItem)
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

  function removerSolicitacao(id: string) {
    if (!window.confirm('Remover esta solicitacao do painel?')) return
    const data: Solicitacao[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    const updated = data.filter((s) => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSolicitacoes(updated)
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
