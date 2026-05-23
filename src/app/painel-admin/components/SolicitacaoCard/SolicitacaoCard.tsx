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

  return (
    <button
      type="button"
      className="solicitacao-card flex flex-col justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${classeStatus(
              status
            )}`}
          >
            {status}
          </span>
        </div>
        <p className="text-sm font-bold text-white truncate">
          {htmlEscape(item.solicitante?.nome) || '—'}
        </p>
        <p className="text-[11px] text-zinc-600 truncate mt-0.5">{item.id}</p>
      </div>

      <div className="mt-auto pt-2 space-y-1">
        <p className="text-xs text-zinc-500">
          Valor:{' '}
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
