import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateSolicitacaoDados,
  AtualizarDadosParams
} from '../../../api/solicitacoes'

export function useAtualizarSolicitacaoDadosMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: AtualizarDadosParams) =>
      updateSolicitacaoDados(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
