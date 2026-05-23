import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSolicitacaoPagamento } from '../../../api/solicitacoes'

export function useLimparPagamentoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      updateSolicitacaoPagamento({
        id,
        pago: false,
        valorPago: null,
        pagoEm: null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
