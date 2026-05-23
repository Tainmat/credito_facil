import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateSolicitacaoStatus,
  StatusSolicitacao
} from '../../../api/solicitacoes'

export function useAtualizarSolicitacaoStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusSolicitacao }) =>
      updateSolicitacaoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
    }
  })
}
