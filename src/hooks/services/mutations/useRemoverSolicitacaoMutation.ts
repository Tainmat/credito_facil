import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSolicitacao } from '../../../api/solicitacoes'

export function useRemoverSolicitacaoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSolicitacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
