import { useState } from 'react'
import {
  X,
  Copy,
  ListFilter,
  ChevronDown,
  Trash2,
  History,
  User,
  Users,
  Receipt,
  BadgeDollarSign
} from 'lucide-react'
import {
  normalizarStatus,
  classeStatus,
  calcularValorAtualizado,
  classeValorAtualizado,
  textoDetalheJuros,
  formatarMoeda,
  formatarData,
  formatarDataCurta,
  formatarDataPagamentoRegistrado,
  formatarDataInputPagamento,
  criarDataPagamentoManual,
  numeroMoeda,
  htmlEscape
} from '../../usePainelAdmin'
import type {
  Solicitacao,
  StatusSolicitacao,
  HistoricoSolicitante
} from '../../usePainelAdmin'

interface DetailModalProps {
  item: Solicitacao
  onClose: () => void
  onCopiarPix: (pix: string) => void
  onAtualizarStatus: (id: string, status: StatusSolicitacao) => void
  onRemover: (id: string) => void
  onRegistrarPagamento: (
    id: string,
    valorPago: string,
    dataPagamento: Date
  ) => void
  onLimparPagamento: (id: string) => void
  historico: HistoricoSolicitante
}

export function DetailModal({
  item,
  onClose,
  onCopiarPix,
  onAtualizarStatus,
  onRemover,
  onRegistrarPagamento,
  onLimparPagamento,
  historico
}: DetailModalProps) {
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [valorPagoInput, setValorPagoInput] = useState(
    item.pagamento?.valorPago ?? ''
  )
  const [dataPagoInput, setDataPagoInput] = useState(
    formatarDataInputPagamento(item.pagamento?.pagoEm)
  )

  const status = normalizarStatus(item.status)
  const resumo = calcularValorAtualizado(item)
  const valorPago = numeroMoeda(item.pagamento?.valorPago)
  const ganho = item.pagamento?.pago ? valorPago - resumo.valorEmprestado : 0

  const statuses: StatusSolicitacao[] = [
    'Pendente',
    'Em Análise',
    'Pix Feito',
    'Golpe'
  ]

  function handleMarcarPago() {
    const data = criarDataPagamentoManual(dataPagoInput)
    if (!data) return
    onRegistrarPagamento(item.id, valorPagoInput, data)
  }

  return (
    <div
      className="detail-modal is-open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="detail-panel">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {htmlEscape(item.solicitante?.nome) || '—'}
            </h2>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${classeStatus(
                status
              )}`}
            >
              {status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.solicitante?.pix && (
            <button
              type="button"
              onClick={() => onCopiarPix(item.solicitante?.pix ?? '')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar PIX
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenStatusMenu((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Alterar status
              <ChevronDown className="w-3 h-3" />
            </button>
            {openStatusMenu && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-[#1a1a1a] border border-zinc-700 rounded-xl shadow-xl z-10 py-1">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${
                      s === status
                        ? 'text-emerald-400 font-semibold'
                        : 'text-zinc-300'
                    }`}
                    onClick={() => {
                      onAtualizarStatus(item.id, s)
                      setOpenStatusMenu(false)
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemover(item.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        </div>

        {/* Historico */}
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400">
              Historico do solicitante
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-600">Total</span>
              <p className="text-zinc-200 font-semibold">{historico.total}</p>
            </div>
            <div>
              <span className="text-zinc-600">Pagos corretamente</span>
              <p className="text-emerald-400 font-semibold">
                {historico.pagosCorretamente}
              </p>
            </div>
            <div>
              <span className="text-zinc-600">Com atraso</span>
              <p className="text-amber-400 font-semibold">
                {historico.pagosComAtraso}
              </p>
            </div>
            <div>
              <span className="text-zinc-600">Em aberto</span>
              <p className="text-red-400 font-semibold">{historico.emAberto}</p>
            </div>
          </div>
          <p
            className={`text-xs mt-2 font-semibold ${historico.classeAvaliacao}`}
          >
            {historico.avaliacao}
          </p>
        </div>

        {/* Dados */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {/* Solicitante */}
          <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400">
                Solicitante
              </span>
            </div>
            <dl className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-zinc-600">Nome</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.solicitante?.nome) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">CPF</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.solicitante?.cpf) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Telefone</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.solicitante?.telefone) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Valor</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.solicitante?.valor) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">PIX</dt>
                <dd className="text-zinc-200 truncate max-w-[140px]">
                  {htmlEscape(item.solicitante?.pix) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Pagamento</dt>
                <dd className="text-zinc-200">
                  {formatarDataCurta(item.solicitante?.dataPagamento)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Contato */}
          <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400">
                Contato de confianca
              </span>
            </div>
            <dl className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-zinc-600">Nome</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.contato?.nome) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">CPF</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.contato?.cpf) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Telefone</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.contato?.telefone) || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Relacionamento</dt>
                <dd className="text-zinc-200">
                  {htmlEscape(item.contato?.relacionamento) || '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Pagamento */}
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400">
              Pagamento
            </span>
          </div>

          {!item.pagamento?.pago ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Valor pago"
                  value={valorPagoInput}
                  onChange={(e) => setValorPagoInput(e.target.value)}
                  className="field w-full rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-600"
                />
                <input
                  type="date"
                  value={dataPagoInput}
                  onChange={(e) => setDataPagoInput(e.target.value)}
                  className="field w-full rounded-lg py-2 px-3 text-sm text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleMarcarPago}
                className="w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
              >
                Marcar pago
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-emerald-400 font-semibold">
                Pago em {formatarDataPagamentoRegistrado(item.pagamento.pagoEm)}
              </p>
              <p className="text-xs text-zinc-400">
                Valor: {htmlEscape(item.pagamento.valorPago)}
              </p>
              <button
                type="button"
                onClick={() => onLimparPagamento(item.id)}
                className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition-colors"
              >
                Limpar pagamento
              </button>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgeDollarSign className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400">Resumo</span>
          </div>
          <dl className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Emprestado</dt>
              <dd className="text-zinc-200 font-semibold">
                {formatarMoeda(resumo.valorEmprestado)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Atualizado</dt>
              <dd
                className={`font-semibold ${classeValorAtualizado(resumo)}`}
                title={textoDetalheJuros(resumo)}
              >
                {formatarMoeda(resumo.valorAtualizado)}
              </dd>
            </div>
            {item.pagamento?.pago && (
              <>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Pago</dt>
                  <dd className="text-zinc-200 font-semibold">
                    {formatarMoeda(valorPago)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Ganho</dt>
                  <dd
                    className={`font-semibold ${
                      ganho >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatarMoeda(ganho)}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <p className="text-[10px] text-zinc-600 mt-2">
            {textoDetalheJuros(resumo)}
          </p>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
          <span>ID: {item.id}</span>
          <span>
            Criada: {formatarData(item.criadaEm)}
            {item.atualizadoEm && (
              <> | Atualizada: {formatarData(item.atualizadoEm)}</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
