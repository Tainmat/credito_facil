import { useState } from 'react'
import {
  X,
  User,
  FileText,
  Smartphone,
  DollarSign,
  Zap,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react'
import {
  maskCPF,
  maskPhone,
  formatISO,
  formatDisplayDate,
  startOfDay,
  addDays,
  sameDay
} from '../../../solicitacao/useSolicitacao'
import { formatarCampoCaixa } from '../../usePainelAdmin'

interface NovoEmprestimoModalProps {
  onClose: () => void
  onConfirm: (params: {
    nome: string
    cpf: string
    telefone: string
    valor: string
    pix: string
    dataPagamento: string | null
    contatoNome: string
    contatoCpf: string
    contatoTelefone: string
    contatoRelacionamento: string
  }) => Promise<boolean>
}

// ─── Calendar Component (adapted from solicitacao/page.tsx) ───
type CalendarProps = {
  isOpen: boolean
  selectedDate: Date | null
  minDate: Date
  maxDate: Date
  onSelect: (d: Date) => void
  onClear: () => void
  onClose: () => void
}

function Calendar({
  isOpen,
  selectedDate,
  minDate,
  maxDate,
  onSelect,
  onClear,
  onClose
}: CalendarProps) {
  const [activeMonth, setActiveMonth] = useState(
    new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  )

  if (!isOpen) return null

  const monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  })
    .format(activeMonth)
    .replace(/^\w/, (c) => c.toUpperCase())

  const startOfMonth = new Date(
    activeMonth.getFullYear(),
    activeMonth.getMonth(),
    1
  )
  const gridStart = new Date(startOfMonth)
  gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }

  const prevDisabled =
    new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 0) < minDate
  const nextStart = new Date(
    activeMonth.getFullYear(),
    activeMonth.getMonth() + 1,
    1
  )
  const nextDisabled = nextStart > maxDate
  const todayDate = startOfDay(new Date())

  function isDisabled(d: Date) {
    return d < minDate || d > maxDate
  }

  return (
    <div
      className="calendar-modal is-open z-[60]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="calendar-panel shadow-2xl border border-zinc-800">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-white">Data de pagamento</p>
            <p className="text-sm text-zinc-500">Prazo máximo de 28 dias</p>
          </div>
          <button
            type="button"
            className="calendar-nav-button"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="calendar-nav-button"
            disabled={prevDisabled}
            onClick={() =>
              setActiveMonth(
                new Date(
                  activeMonth.getFullYear(),
                  activeMonth.getMonth() - 1,
                  1
                )
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-white">
              {monthLabel}
            </p>
          </div>
          <button
            type="button"
            className="calendar-nav-button"
            disabled={nextDisabled}
            onClick={() =>
              setActiveMonth(
                new Date(
                  activeMonth.getFullYear(),
                  activeMonth.getMonth() + 1,
                  1
                )
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-zinc-500">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const disabled = isDisabled(d)
            const isMuted = d.getMonth() !== activeMonth.getMonth()
            const isToday = sameDay(d, todayDate)
            const isSelected = selectedDate ? sameDay(d, selectedDate) : false
            let cls = 'calendar-day'
            if (isMuted) cls += ' is-muted'
            if (isToday) cls += ' is-today'
            if (isSelected) cls += ' is-selected'
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={disabled}
                onClick={() => {
                  onSelect(startOfDay(d))
                  onClose()
                }}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            onClick={() => {
              const t = startOfDay(new Date())
              if (!isDisabled(t)) {
                onSelect(t)
                onClose()
              }
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-200 transition-colors"
            onClick={onClear}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  )
}

export function NovoEmprestimoModal({
  onClose,
  onConfirm
}: NovoEmprestimoModalProps) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [valor, setValor] = useState('')
  const [pix, setPix] = useState('')
  const [dataPagamento, setDataPagamento] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [contatoNome, setContatoNome] = useState('')
  const [contatoCpf, setContatoCpf] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')
  const [contatoRelacionamento, setContatoRelacionamento] = useState('')

  const [enviando, setEnviando] = useState(false)

  const minDate = startOfDay(new Date())
  const maxDate = addDays(minDate, 28)

  const isValid =
    nome.trim() !== '' &&
    cpf.trim().length === 14 &&
    telefone.trim().length >= 14 &&
    valor.trim() !== '' &&
    pix.trim() !== '' &&
    dataPagamento !== null &&
    contatoNome.trim() !== '' &&
    contatoCpf.trim().length === 14 &&
    contatoTelefone.trim().length >= 14 &&
    contatoRelacionamento !== ''

  async function handleSubmit() {
    if (!isValid) return
    setEnviando(true)
    try {
      const success = await onConfirm({
        nome,
        cpf,
        telefone,
        valor,
        pix,
        dataPagamento: dataPagamento ? formatISO(dataPagamento) : null,
        contatoNome,
        contatoCpf,
        contatoTelefone,
        contatoRelacionamento
      })
      if (success) {
        onClose()
      }
    } finally {
      setEnviando(false)
    }
  }

  const inputCls =
    'field w-full rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600'

  return (
    <div
      className="detail-modal is-open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="detail-panel max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Lançar Empréstimo Manual
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna 1: Dados do Solicitante */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Dados do Solicitante
            </h3>

            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="CPF"
                  value={cpf}
                  maxLength={14}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Telefone"
                  value={telefone}
                  maxLength={15}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Valor"
                  value={valor}
                  onChange={(e) => setValor(formatarCampoCaixa(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className={`${inputCls} text-left truncate`}
                >
                  {dataPagamento
                    ? formatDisplayDate(dataPagamento)
                    : 'Pagamento'}
                </button>
              </div>
            </div>

            <div className="relative">
              <Zap className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Chave PIX"
                value={pix}
                onChange={(e) => setPix(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Coluna 2: Dados do Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
              Contato de Confiança
            </h3>

            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Nome do contato"
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="CPF do contato"
                value={contatoCpf}
                maxLength={14}
                onChange={(e) => setContatoCpf(maskCPF(e.target.value))}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Telefone do contato"
                value={contatoTelefone}
                maxLength={15}
                onChange={(e) => setContatoTelefone(maskPhone(e.target.value))}
                className={inputCls}
              />
            </div>

            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <select
                value={contatoRelacionamento}
                onChange={(e) => setContatoRelacionamento(e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Relacionamento
                </option>
                <option value="parente">Parente</option>
                <option value="conjuge">Cônjuge</option>
                <option value="amigo">Amigo</option>
                <option value="colega">Colega</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6">
          <button
            type="button"
            disabled={!isValid || enviando}
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {enviando ? 'Enviando...' : 'Lançar Empréstimo'}
          </button>
        </div>
      </div>

      <Calendar
        isOpen={calendarOpen}
        selectedDate={dataPagamento}
        minDate={minDate}
        maxDate={maxDate}
        onSelect={(d) => setDataPagamento(d)}
        onClear={() => setDataPagamento(null)}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  )
}
