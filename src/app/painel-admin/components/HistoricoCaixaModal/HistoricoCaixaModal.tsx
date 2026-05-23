import { History, X } from 'lucide-react'
import { formatarMoeda } from '../../usePainelAdmin'
import type { TransacaoCaixa } from '../../usePainelAdmin'

interface HistoricoCaixaModalProps {
  onClose: () => void
  transacoes: TransacaoCaixa[]
}

export function HistoricoCaixaModal({
  onClose,
  transacoes
}: HistoricoCaixaModalProps) {
  return (
    <div
      className="detail-modal is-open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="detail-panel max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Histórico de Transações do Caixa
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {transacoes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Nenhuma transação registrada no caixa ainda.
            </div>
          ) : (
            transacoes.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {tx.descricao}
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    }).format(new Date(tx.criadaEm))}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${
                      tx.tipo === 'aporte' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.tipo === 'aporte' ? '+' : '-'} {formatarMoeda(tx.valor)}
                  </span>
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold mt-0.5">
                    {tx.tipo}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
