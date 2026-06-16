import { supabase } from '../../lib/supabase'

export const BOLETOS_BUCKET = 'boletos'

export type TipoSolicitacao = 'credito' | 'boleto'

export type StatusSolicitacao =
  | 'Pendente'
  | 'Em Análise'
  | 'Pix Feito'
  | 'Golpe'

export interface DbSolicitacao {
  id: string
  status: string
  created_at: string
  updated_at: string
  tipo_solicitacao: TipoSolicitacao | null
  solicitante_nome: string | null
  solicitante_cpf: string | null
  solicitante_telefone: string | null
  solicitante_valor: number | null
  solicitante_pix: string | null
  solicitante_data_pagamento: string | null
  boleto_nome: string | null
  boleto_tipo: string | null
  boleto_tamanho: number | null
  boleto_storage_path: string | null
  contato_nome: string | null
  contato_cpf: string | null
  contato_telefone: string | null
  contato_relacionamento: string | null
  pagamento_pago: boolean | null
  pagamento_valor_pago: number | null
  pagamento_pago_em: string | null
}

export type Solicitacao = {
  id: string
  status?: string
  criadaEm?: string
  atualizadoEm?: string
  tipo?: TipoSolicitacao
  solicitante?: {
    nome?: string
    cpf?: string
    telefone?: string
    valor?: string
    pix?: string
    dataPagamento?: string
  }
  contato?: {
    nome?: string
    cpf?: string
    telefone?: string
    relacionamento?: string
  }
  boleto?: {
    nome?: string
    tipo?: string
    tamanho?: number
    caminho?: string
  }
  pagamento?: {
    pago?: boolean
    valorPago?: string
    pagoEm?: string
  }
}

function normalizarNomeArquivo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function criarCaminhoBoleto(id: string, arquivo: File): string {
  const nome = normalizarNomeArquivo(arquivo.name) || 'boleto'
  return `${id}/${Date.now()}-${nome}`
}

export function mapearSolicitacao(db: DbSolicitacao): Solicitacao {
  return {
    id: db.id,
    status: db.status,
    criadaEm: db.created_at,
    atualizadoEm: db.updated_at,
    tipo: db.tipo_solicitacao ?? 'credito',
    solicitante: {
      nome: db.solicitante_nome ?? undefined,
      cpf: db.solicitante_cpf ?? undefined,
      telefone: db.solicitante_telefone ?? undefined,
      valor: db.solicitante_valor?.toString() || '0',
      pix: db.solicitante_pix ?? undefined,
      dataPagamento: db.solicitante_data_pagamento ?? undefined
    },
    contato: {
      nome: db.contato_nome ?? undefined,
      cpf: db.contato_cpf ?? undefined,
      telefone: db.contato_telefone ?? undefined,
      relacionamento: db.contato_relacionamento ?? undefined
    },
    boleto: {
      nome: db.boleto_nome ?? undefined,
      tipo: db.boleto_tipo ?? undefined,
      tamanho: db.boleto_tamanho ?? undefined,
      caminho: db.boleto_storage_path ?? undefined
    },
    pagamento: {
      pago: db.pagamento_pago ?? false,
      valorPago: db.pagamento_valor_pago?.toString() || '',
      pagoEm: db.pagamento_pago_em ?? undefined
    }
  }
}

export async function getSolicitacoes(): Promise<Solicitacao[]> {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapearSolicitacao)
}

export interface CriarSolicitacaoParams {
  id: string
  status?: StatusSolicitacao
  tipoSolicitacao: TipoSolicitacao
  nome: string
  cpf: string
  telefone: string
  valor: number
  pix: string
  dataPagamento: string | null
  boletoArquivo?: File | null
  contatoNome: string
  contatoCpf: string
  contatoTelefone: string
  contatoRelacionamento: string
}

export async function createSolicitacao(params: CriarSolicitacaoParams) {
  let boleto: {
    nome: string
    tipo: string
    tamanho: number
    caminho: string
  } | null = null

  if (params.tipoSolicitacao === 'boleto') {
    if (!params.boletoArquivo) {
      throw new Error('Anexe o boleto antes de enviar a solicitacao.')
    }

    const caminho = criarCaminhoBoleto(params.id, params.boletoArquivo)
    const { error: uploadError } = await supabase.storage
      .from(BOLETOS_BUCKET)
      .upload(caminho, params.boletoArquivo, {
        contentType: params.boletoArquivo.type || 'application/octet-stream',
        upsert: false
      })

    if (uploadError) throw uploadError

    boleto = {
      nome: params.boletoArquivo.name,
      tipo: params.boletoArquivo.type,
      tamanho: params.boletoArquivo.size,
      caminho
    }
  }

  const { data, error } = await supabase
    .from('solicitacoes')
    .insert({
      id: params.id,
      status: params.status || 'Pendente',
      tipo_solicitacao: params.tipoSolicitacao,
      solicitante_nome: params.nome,
      solicitante_cpf: params.cpf,
      solicitante_telefone: params.telefone,
      solicitante_valor: params.valor,
      solicitante_pix: params.pix,
      solicitante_data_pagamento: params.dataPagamento,
      boleto_nome: boleto?.nome ?? null,
      boleto_tipo: boleto?.tipo ?? null,
      boleto_tamanho: boleto?.tamanho ?? null,
      boleto_storage_path: boleto?.caminho ?? null,
      contato_nome: params.contatoNome,
      contato_cpf: params.contatoCpf,
      contato_telefone: params.contatoTelefone,
      contato_relacionamento: params.contatoRelacionamento
    })
    .select()

  if (error) {
    if (boleto?.caminho) {
      await supabase.storage.from(BOLETOS_BUCKET).remove([boleto.caminho])
    }
    throw error
  }

  return data
}

export async function updateSolicitacaoStatus(
  id: string,
  status: StatusSolicitacao
) {
  const { data, error } = await supabase
    .from('solicitacoes')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
  return data
}

export interface RegistrarPagamentoParams {
  id: string
  pago: boolean
  valorPago: number | null
  pagoEm: string | null
}

export async function updateSolicitacaoPagamento(
  params: RegistrarPagamentoParams
) {
  const { data, error } = await supabase
    .from('solicitacoes')
    .update({
      pagamento_pago: params.pago,
      pagamento_valor_pago: params.valorPago,
      pagamento_pago_em: params.pagoEm,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)

  if (error) throw error
  return data
}

export async function deleteSolicitacao(id: string) {
  const { data, error } = await supabase
    .from('solicitacoes')
    .delete()
    .eq('id', id)

  if (error) throw error
  return data
}
