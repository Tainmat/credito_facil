import { useQuery } from '@tanstack/react-query'
import { getSolicitacoes, Solicitacao } from '../../../api/solicitacoes'

export function useBuscarSolicitacoesQuery() {
  return useQuery<Solicitacao[], Error>({
    queryKey: ['solicitacoes'],
    queryFn: getSolicitacoes
  })
}
