import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from '../../../api/accounts'

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Invalida e limpa o cache de dados administrativos
      queryClient.invalidateQueries({ queryKey: ['solicitacoes'] })
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
    }
  })
}
