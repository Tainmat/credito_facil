'use client'

import { useState } from 'react'
import {
  CreditCard,
  User,
  FileText,
  Smartphone,
  DollarSign,
  Zap,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Users,
  CheckCircle2,
  TrendingUp,
  X,
  Link as LinkIcon
} from 'lucide-react'
import {
  useSolicitacao,
  flowSteps,
  maskCPF,
  maskPhone,
  formatDisplayDate,
  startOfDay,
  sameDay
} from './useSolicitacao'

// ─── Calendar ──────────────────────────────────────────────
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

  if (!isOpen) return null

  return (
    <div
      className="calendar-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-label="Calendário de pagamento"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="calendar-panel">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-white">Data de pagamento</p>
            <p className="text-sm text-zinc-500">Prazo máximo de 28 dias</p>
          </div>
          <button
            type="button"
            className="calendar-nav-button"
            aria-label="Fechar calendário"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="calendar-nav-button"
            aria-label="Mês anterior"
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
            <p className="text-xs text-zinc-500">Selecione o vencimento</p>
          </div>
          <button
            type="button"
            className="calendar-nav-button"
            aria-label="Próximo mês"
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
                aria-current={isSelected ? 'date' : undefined}
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

// ─── Page ──────────────────────────────────────────────────
const inputCls =
  'w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800/80 text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none'

export default function SolicitacaoPage() {
  const {
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
  } = useSolicitacao()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 md:p-8 selection:bg-emerald-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10 pt-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white">
            Microcrédito <span className="text-emerald-400">Inteligente</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed">
            Plataforma focada em microcrédito com validação social, score
            interno e liberação via PIX. Desenhada para confiança e velocidade.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* ── Form card ── */}
          <div className="bg-[#121212] rounded-3xl p-8 border border-zinc-800/60 shadow-2xl relative overflow-hidden min-h-[550px]">
            {/* Step 1: Solicitante */}
            {step === 'solicitante' && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <CreditCard className="text-emerald-400 w-6 h-6" />
                  Solicitação de Crédito
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
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
                      <Smartphone className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
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
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Valor desejado (R$ 200 - R$ 500)"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Zap className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Chave PIX"
                      value={pix}
                      onChange={(e) => setPix(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-2 ml-1">
                      Data de pagamento (prazo máximo de 28 dias)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(true)}
                      aria-expanded={calendarOpen}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800/80 text-left focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none cursor-pointer relative"
                    >
                      <CalendarDays className="absolute left-4 top-4 text-zinc-500 w-5 h-5 pointer-events-none" />
                      <span
                        className={`block truncate ${
                          dataPagamento ? 'text-zinc-100' : 'text-zinc-600'
                        }`}
                      >
                        {dataPagamento
                          ? formatDisplayDate(dataPagamento)
                          : 'Escolha uma data'}
                      </span>
                      <ChevronDown className="absolute right-4 top-4 text-zinc-500 w-5 h-5 pointer-events-none" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!isStep1Valid}
                    onClick={() => setStep('fiador')}
                    className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-300 mt-2 flex items-center justify-center gap-2 ${
                      isStep1Valid
                        ? 'bg-[#10B981] hover:bg-[#059669] cursor-pointer'
                        : 'bg-[#10B981] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Avançar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Fiador */}
            {step === 'fiador' && (
              <div>
                <button
                  onClick={() => setStep('solicitante')}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Users className="text-emerald-400 w-6 h-6" />
                  Dados do Contato de Confiança
                </h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Para validar seu crédito, informe os dados de uma pessoa de
                  confiança que servirá como sua referência social.
                </p>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="CPF"
                      value={contatoCpf}
                      maxLength={14}
                      onChange={(e) => setContatoCpf(maskCPF(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Telefone"
                      value={contatoTelefone}
                      maxLength={15}
                      onChange={(e) =>
                        setContatoTelefone(maskPhone(e.target.value))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
                    <select
                      value={contatoRelacionamento}
                      onChange={(e) => setContatoRelacionamento(e.target.value)}
                      className={`${inputCls} appearance-none cursor-pointer`}
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <option value="" disabled>
                        Qual o grau de relacionamento?
                      </option>
                      <option value="parente">
                        Parente (Pai/Mãe/Irmão/Filho)
                      </option>
                      <option value="conjuge">Cônjuge</option>
                      <option value="amigo">Amigo Próximo</option>
                      <option value="colega">Colega de Trabalho</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-zinc-500 w-5 h-5 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizarSolicitacao}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 mt-4 flex items-center justify-center gap-2"
                  >
                    Finalizar Solicitação <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  Essa pessoa é um apoio para seu dinheiro, caso haja
                  inadimplência, o seu contato não conseguirá um possível
                  empréstimo com nosso time.
                </p>
              </div>
            )}

            {/* Step 3: Agradecimento */}
            {step === 'agradecimento' && (
              <div className="h-full flex flex-col items-center justify-center text-center min-h-[480px]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="text-emerald-400 w-9 h-9" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Obrigado pela solicitação
                </h2>
                <p className="text-zinc-400 leading-relaxed max-w-md mb-8">
                  Nossa equipe já recebeu sua solicitação e irá analisar as
                  informações. Dentro de 30 minutos vamos dar um retorno.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full max-w-xs bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  OK <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* ── Fluxo da Operação ── */}
          <div className="flex flex-col justify-center py-4">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 px-2">
              <TrendingUp className="text-emerald-400 w-6 h-6" />
              Fluxo da Operação
            </h2>
            <div className="relative border-l border-zinc-800/80 ml-5 space-y-8 pb-4">
              {flowSteps.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={i}
                  className={`relative pl-8 group ${
                    i < visibleSteps
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2.5'
                  }`}
                  style={{
                    transition: 'opacity 350ms ease, transform 350ms ease'
                  }}
                >
                  <div className="absolute -left-[18px] top-0 w-9 h-9 rounded-full bg-[#121212] border border-zinc-700 flex items-center justify-center group-hover:border-emerald-500/50 transition-all duration-300">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {title}
                    </h3>
                    <p className="text-zinc-500 mt-1 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
