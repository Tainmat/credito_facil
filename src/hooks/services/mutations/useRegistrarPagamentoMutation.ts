import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateSolicitacaoPagamento,
  RegistrarPagamentoParams
} from '../../../api/solicitacoes'

export function useRegistrarPagamentoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: RegistrarPagamentoParams) =>
      updateSolicitacaoPagamento(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
