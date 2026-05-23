import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransacao, CriarTransacaoParams } from '../../../api/transacoes'

export function useAdicionarTransacaoCaixaMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CriarTransacaoParams) => createTransacao(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] })
    }
  })
}
