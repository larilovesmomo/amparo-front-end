// src/services/errorUtils.ts

import axios, { AxiosError } from 'axios';

const MENSAGENS = {
  conectividade: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
  timeout: 'O servidor demorou para responder. Tente novamente em alguns instantes.',
  credenciaisInvalidas: 'Usuário ou senha inválidos. Verifique os dados e tente novamente.',
  sessaoExpirada: 'Sua sessão expirou. Faça login novamente para continuar.',
  proibido: 'Você não tem permissão para realizar esta ação.',
  naoEncontrado: 'Este registro não foi encontrado. Ele pode ter sido excluído.',
  validacaoGenerica: 'Alguns dados informados não são válidos. Verifique os campos e tente novamente.',
  inesperado: 'Algo deu errado. Tente novamente em alguns instantes.',
};

const MENSAGENS_CAMPOS: Record<string, string> = {
  username: 'Já existe um usuário com esse nome. Escolha outro nome de usuário.',
  password: 'A senha informada não é válida. Verifique e tente novamente.',
  nome: 'Informe um nome válido para o medicamento.',
  dosagem_valor: 'Informe uma dosagem válida, maior que zero.',
  dosagem_unidade: 'Selecione uma unidade válida para a dosagem.',
  estoque_atual: 'Informe uma quantidade válida para o estoque atual.',
  aviso_estoque_minimo: 'Informe um valor válido para o estoque mínimo.',
  intervalo: 'Informe um intervalo de horas válido.',
  horario_inicio: 'Informe um horário de início válido.',
  duracao_valor: 'Informe uma duração em dias válida.',
};

// Códigos de erro sem resposta HTTP que indicam servidor inacessível
const CODIGOS_CONECTIVIDADE = [
  'ERR_NETWORK',
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_TIMED_OUT',
  'ENETUNREACH',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
];

type ErrorOptions = {
  // Indica que a requisição foi de login (401 = credenciais inválidas)
  isLogin?: boolean;
};

export function getApiErrorMessage(error: unknown, options: ErrorOptions = {}): string {
  if (axios.isAxiosError(error)) {
    return getAxiosErrorMessage(error, options);
  }
  return MENSAGENS.inesperado;
}

function getAxiosErrorMessage(error: AxiosError, options: ErrorOptions): string {
  const response = error.response;

  if (!response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return MENSAGENS.timeout;
    }
    if (error.code && CODIGOS_CONECTIVIDADE.includes(error.code)) {
      return MENSAGENS.conectividade;
    }
    return MENSAGENS.inesperado;
  }

  if (response.status === 401) {
    return options.isLogin ? MENSAGENS.credenciaisInvalidas : MENSAGENS.sessaoExpirada;
  }
  if (response.status === 403) {
    return MENSAGENS.proibido;
  }
  if (response.status === 404) {
    return MENSAGENS.naoEncontrado;
  }
  if (response.status === 400 || response.status === 422) {
    return getMensagemValidacao(response.data) ?? MENSAGENS.validacaoGenerica;
  }

  return MENSAGENS.inesperado;
}

function getMensagemValidacao(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const erros = data as Record<string, unknown>;

  for (const campo of Object.keys(MENSAGENS_CAMPOS)) {
    if (erros[campo] !== undefined) {
      return MENSAGENS_CAMPOS[campo];
    }
  }

  return null;
}
