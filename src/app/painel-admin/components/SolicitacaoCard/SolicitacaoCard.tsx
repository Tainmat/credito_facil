import { CreditCard, ReceiptText } from 'lucide-react'
import {
  normalizarStatus,
  calcularValorAtualizado,
  classeStatus,
  classeValorAtualizado,
  formatarMoeda,
  numeroMoeda,
  formatarDataCurta,
  htmlEscape
} from '../../usePainelAdmin'
import type { Solicitacao } from '../../usePainelAdmin'

interface SolicitacaoCardProps {
  item: Solicitacao
  onClick: () => void
}

export function SolicitacaoCard({ item, onClick }: SolicitacaoCardProps) {
  const status = normalizarStatus(item.status)
  const resumo = calcularValorAtualizado(item)
  const isBoleto = item.tipo === 'boleto'

  return (
    <button
      type="button"
      className="solicitacao-card flex flex-col justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${classeStatus(
              status
            )}`}
          >
            {status}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            {isBoleto ? (
              <ReceiptText className="h-3 w-3" />
            ) : (
              <CreditCard className="h-3 w-3" />
            )}
            {isBoleto ? 'Boleto' : 'Credito'}
          </span>
        </div>
        <p className="text-sm font-bold text-white truncate">
          {htmlEscape(item.solicitante?.nome) || '—'}
        </p>
        <p className="text-[11px] text-zinc-600 truncate mt-0.5">{item.id}</p>
      </div>

      <div className="mt-auto pt-2 space-y-1">
        <p className="text-xs text-zinc-500">
          {isBoleto ? 'Boleto' : 'Valor'}:{' '}
          <span className="text-zinc-300 font-semibold">
            {item.solicitante?.valor
              ? formatarMoeda(numeroMoeda(item.solicitante.valor))
              : '—'}
          </span>
        </p>
        <p className="text-xs text-zinc-500">
          Pag:{' '}
          <span className="text-zinc-400">
            {formatarDataCurta(item.solicitante?.dataPagamento)}
          </span>{' '}
          <span className={`font-semibold ${classeValorAtualizado(resumo)}`}>
            {formatarMoeda(resumo.valorAtualizado)}
          </span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-600">
            {formatarDataCurta(item.criadaEm)}
          </span>
          <span className="text-[11px] text-emerald-500 font-semibold">
            Detalhes
          </span>
        </div>
      </div>
    </button>
  )
}
