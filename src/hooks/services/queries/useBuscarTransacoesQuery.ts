import { useQuery } from '@tanstack/react-query'
import { getTransacoes, TransacaoCaixa } from '../../../api/transacoes'

export function useBuscarTransacoesQuery() {
  return useQuery<TransacaoCaixa[], Error>({
    queryKey: ['transacoes'],
    queryFn: getTransacoes
  })
}
