import { useState, useEffect } from 'react'
import {
  DollarSign,
  ShieldCheck,
  User,
  Target,
  CheckCircle2,
  Zap
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function numeroMoeda(v: string): number {
  if (!v) return 0
  const limpo = v.replace(/[^\d,.]/g, '')
  if (limpo.includes(',') && limpo.includes('.')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.')) || 0
  }
  if (limpo.includes(',')) {
    return parseFloat(limpo.replace(',', '.')) || 0
  }
  return parseFloat(limpo) || 0
}

// ─── Constants ─────────────────────────────────────────────
export const STORAGE_KEY = 'microcredito_solicitacoes'

// ─── Types ─────────────────────────────────────────────────
export type Step = 'solicitante' | 'fiador' | 'agradecimento'

export type FlowStep = {
  icon: LucideIcon
  title: string
  desc: string
}

// ─── Date helpers ──────────────────────────────────────────
export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDisplayDate(d: Date) {
  const str = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(d)
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Mask helpers ──────────────────────────────────────────
export function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2')
}

// ─── Flow steps data ───────────────────────────────────────
export const flowSteps: FlowStep[] = [
  {
    icon: DollarSign,
    title: '1. Solicitação',
    desc: 'Você solicita seu crédito.'
  },
  {
    icon: ShieldCheck,
    title: '2. Validação',
    desc: 'Nós avaliamos seus dados e chave PIX.'
  },
  {
    icon: User,
    title: '3. Referência Social',
    desc: 'Você nos informa uma referência de segurança.'
  },
  {
    icon: Target,
    title: '4. Análise',
    desc: 'Realizamos toda a análise das informações.'
  },
  { icon: CheckCircle2, title: '5. Aprovação', desc: 'Definimos o limite.' },
  {
    icon: Zap,
    title: '6. Transferência PIX',
    desc: 'PIX enviado instantaneamente.'
  }
]

// ─── Hook ──────────────────────────────────────────────────
export function useSolicitacao() {
  const [step, setStep] = useState<Step>('solicitante')

  // Solicitante
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [valor, setValor] = useState('')
  const [pix, setPix] = useState('')
  const [dataPagamento, setDataPagamento] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Fiador
  const [contatoNome, setContatoNome] = useState('')
  const [contatoCpf, setContatoCpf] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')
  const [contatoRelacionamento, setContatoRelacionamento] = useState('')

  // Flow animation
  const [visibleSteps, setVisibleSteps] = useState(0)

  // Date limits
  const minDate = startOfDay(new Date())
  const maxDate = addDays(minDate, 28)

  // Computed
  const isStep1Valid =
    nome.trim() !== '' &&
    cpf.trim() !== '' &&
    telefone.trim() !== '' &&
    valor.trim() !== '' &&
    pix.trim() !== '' &&
    dataPagamento !== null

  // Flow animation on mount
  useEffect(() => {
    let count = 0
    const timer = setInterval(() => {
      count++
      setVisibleSteps(count)
      if (count >= flowSteps.length) clearInterval(timer)
    }, 700)
    return () => clearInterval(timer)
  }, [])

  // Close calendar on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCalendarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function handleFinalizarSolicitacao() {
    const { error } = await supabase.from('solicitacoes').insert({
      id: `SOL-${Date.now()}`,
      status: 'Pendente',
      solicitante_nome: nome,
      solicitante_cpf: cpf,
      solicitante_telefone: telefone,
      solicitante_valor: numeroMoeda(valor),
      solicitante_pix: pix,
      solicitante_data_pagamento: dataPagamento
        ? formatISO(dataPagamento)
        : null,
      contato_nome: contatoNome,
      contato_cpf: contatoCpf,
      contato_telefone: contatoTelefone,
      contato_relacionamento: contatoRelacionamento
    })

    if (error) {
      console.error('Erro ao salvar solicitação no Supabase:', error)
      alert(
        'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.'
      )
      return
    }

    setStep('agradecimento')
  }

  function handleReset() {
    setNome('')
    setCpf('')
    setTelefone('')
    setValor('')
    setPix('')
    setDataPagamento(null)
    setContatoNome('')
    setContatoCpf('')
    setContatoTelefone('')
    setContatoRelacionamento('')
    setStep('solicitante')
  }

  return {
    step,
    setStep,
    nome,
    setNome,
    cpf,
    setCpf,
    telefone,
    setTelefone,
    valor,
    setValor,
    pix,
    setPix,
    dataPagamento,
    setDataPagamento,
    calendarOpen,
    setCalendarOpen,
    contatoNome,
    setContatoNome,
    contatoCpf,
    setContatoCpf,
    contatoTelefone,
    setContatoTelefone,
    contatoRelacionamento,
    setContatoRelacionamento,
    visibleSteps,
    minDate,
    maxDate,
    isStep1Valid,
    handleFinalizarSolicitacao,
    handleReset
  }
}
