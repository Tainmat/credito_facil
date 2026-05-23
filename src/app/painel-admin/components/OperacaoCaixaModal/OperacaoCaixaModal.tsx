import { useState } from 'react'
import { X } from 'lucide-react'
import { formatarCampoCaixa } from '../../usePainelAdmin'

interface OperacaoCaixaModalProps {
  tipo: 'aporte' | 'resgate'
  onClose: () => void
  onConfirm: (
    tipo: 'aporte' | 'resgate',
    valor: number,
    descricao: string
  ) => boolean
}

export function OperacaoCaixaModal({
  tipo,
  onClose,
  onConfirm
}: OperacaoCaixaModalProps) {
  const [valorOp, setValorOp] = useState('')
  const [descricaoOp, setDescricaoOp] = useState('')

  function handleSubmit() {
    const numVal = parseFloat(
      valorOp.replace(/[^\d,.-]/g, '').replace(',', '.')
    )
    if (!numVal || isNaN(numVal) || numVal <= 0) {
      alert('Por favor, informe um valor válido maior que zero.')
      return
    }
    const success = onConfirm(tipo, numVal, descricaoOp)
    if (success) {
      onClose()
    }
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
      <div className="detail-panel max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {tipo === 'aporte' ? 'Aportar Capital' : 'Resgatar Capital'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">
              VALOR
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valorOp}
              onChange={(e) => setValorOp(formatarCampoCaixa(e.target.value))}
              className="field w-full rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">
              DESCRIÇÃO / MOTIVO (OPCIONAL)
            </label>
            <input
              type="text"
              placeholder={
                tipo === 'aporte'
                  ? 'Ex: Entrada de novos investidores'
                  : 'Ex: Retirada de lucros'
              }
              value={descricaoOp}
              onChange={(e) => setDescricaoOp(e.target.value)}
              className="field w-full rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className={`w-full py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${
              tipo === 'aporte'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {tipo === 'aporte' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
          </button>
        </div>
      </div>
    </div>
  )
}
