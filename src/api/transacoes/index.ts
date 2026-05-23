import { supabase } from '../../lib/supabase'

export interface DbTransacaoCaixa {
  id: string
  tipo: string
  valor: number
  descricao: string | null
  created_at: string
}

export type TransacaoCaixa = {
  id: string
  tipo: 'aporte' | 'resgate'
  valor: number
  descricao: string
  criadaEm: string
}

export async function getTransacoes(): Promise<TransacaoCaixa[]> {
  const { data, error } = await supabase
    .from('transacoes_caixa')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((tx: DbTransacaoCaixa) => ({
    id: tx.id,
    tipo: tx.tipo as 'aporte' | 'resgate',
    valor: Number(tx.valor),
    descricao: tx.descricao || '',
    criadaEm: tx.created_at
  }))
}

export interface CriarTransacaoParams {
  id: string
  tipo: 'aporte' | 'resgate'
  valor: number
  descricao: string
}

export async function createTransacao(params: CriarTransacaoParams) {
  const { data, error } = await supabase.from('transacoes_caixa').insert({
    id: params.id,
    tipo: params.tipo,
    valor: params.valor,
    descricao: params.descricao,
    created_at: new Date().toISOString()
  })

  if (error) throw error
  return data
}
