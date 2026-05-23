import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSolicitacao,
  CriarSolicitacaoParams
} from '../../../api/solicitacoes'

export function useCriarSolicitacaoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CriarSolicitacaoParams) => createSolicitacao(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
