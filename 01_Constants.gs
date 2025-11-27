/**
 * @file Constants.gs
 * @description Constantes globais do sistema SIG-TE
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * Este arquivo centraliza todas as constantes e configurações globais
 * do sistema, facilitando manutenção e evitando magic numbers.
 */

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================

/**
 * Configuração de Ambiente
 */
var ENV_CONFIG = ENV_CONFIG || {
  SPREADSHEET_ID: null,
  CACHE_DURATION: 300,  // 5 minutos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,    // 1 segundo
  DEBUG_MODE: false
};

// ============================================================================
// ÍNDICES E POSIÇÕES
// ============================================================================

/**
 * Magic Numbers - Indices de Colunas (evita hardcoded numbers)
 */
var COLUMN_INDEX = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
  TENTH: 10,
  FIFTEENTH: 15
};

// ============================================================================
// TEMPOS E DURAÇÕES
// ============================================================================

/**
 * Tempos e Durações (milissegundos)
 */
var TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  ONE_HOUR: 3600000,
  ONE_DAY: 86400000
};

// ============================================================================
// LIMITES DE DADOS
// ============================================================================

/**
 * Limites de Dados
 */
var DATA_LIMITS = {
  MAX_BATCH_SIZE: 100,
  MAX_CACHE_SIZE: 50,
  MAX_IMAGE_CACHE: 30,
  MAX_ARCHIVE_FILES: 90,
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_SEARCH_PAGE_SIZE: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_CACHE_STRING_LENGTH: 90000,  // 90KB limite de cache
  MAX_HISTORY_ENTRIES: 100,
  BYTES_PER_CELL: 100,  // Estimativa de bytes por célula
  MEGABYTE: 1048576  // 1024 * 1024
};

// ============================================================================
// PERÍODOS DE RETENÇÃO
// ============================================================================

/**
 * Períodos de Retenção (dias)
 */
var RETENTION_DAYS = {
  LOGS: 30,
  AUDITORIA: 60,
  TELEMETRY: 15,
  ENGAGEMENT: 90,
  TRACKING: 30,
  DEFAULT: 30
};

// ============================================================================
// LIMITES DE TAMANHO
// ============================================================================

/**
 * Limites de Tamanho (MB)
 */
var SIZE_LIMITS = {
  CRITICAL_THRESHOLD: 50,  // MB
  WARNING_THRESHOLD: 30,   // MB
  MODERATE_THRESHOLD: 20,  // MB
  MAX_FILE_SIZE: 10        // MB
};

// ============================================================================
// PORCENTAGENS
// ============================================================================

/**
 * Porcentagens para Cálculos
 */
var PERCENTAGE = {
  FULL: 100,
  SUCCESS_RATE_EXCELLENT: 100,
  SUCCESS_RATE_GOOD: 80,
  SUCCESS_RATE_MODERATE: 50
};

// ============================================================================
// CÓDIGOS HTTP
// ============================================================================

/**
 * Códigos de Status HTTP
 */
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

// ============================================================================
// TIPOS DE ERRO
// ============================================================================

/**
 * Tipos de erro do sistema
 */
var ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  NOT_FOUND: 'NotFoundError',
  PERMISSION: 'PermissionError',
  NETWORK: 'NetworkError',
  DATABASE: 'DatabaseError',
  TIMEOUT: 'TimeoutError',
  UNKNOWN: 'UnknownError'
};

// ============================================================================
// CONFIGURAÇÃO DE ARQUIVAMENTO
// ============================================================================

/**
 * Configuração de arquivamento
 */
var ARCHIVE_CONFIG = ARCHIVE_CONFIG || {
  // Pasta onde os arquivos serão criados (deixe null para criar na raiz do Drive)
  ARCHIVE_FOLDER_NAME: 'SIG-TE-Arquivos-Historicos',
  
  // Formato do nome do arquivo
  FILE_NAME_FORMAT: 'SIG-TE-Backup-{date}.xlsx',
  
  // Planilhas a arquivar
  SHEETS_TO_ARCHIVE: [
    'Logs',
    'Auditoria',
    'Telemetry',
    'Engagement',
    'Tracking'
  ],
  
  // Dias de retenção de arquivos
  RETENTION_DAYS: 90,
  
  // Tamanho máximo do arquivo (MB)
  MAX_FILE_SIZE: 10
};

// ============================================================================
// REGRAS DE VALIDAÇÃO
// ============================================================================

/**
 * Regras de validação específicas por tipo de entidade
 */
var VALIDATION_RULES = {
  // Alunos
  Alunos: {
    required: ['Nome_Completo', 'RA', 'Escola'],
    types: {
      Nome_Completo: 'string',
      RA: 'string',
      Idade: 'number'
    },
    formats: {
      Email: 'email',
      CPF_Responsavel: 'cpf',
      Telefone_Responsavel: 'telefone',
      CEP: 'cep'
    },
    lengths: {
      Nome_Completo: { min: 3, max: 100 },
      RA: { min: 5, max: 20 },
      Escola: { min: 3, max: 100 }
    },
    enums: {
      Status_Ativo: ['Ativo', 'Inativo', 'Transferido', 'Cancelado'],
      Turno: ['Manhã', 'Tarde', 'Noite', 'Integral']
    }
  },
  
  // Veículos
  Veiculos: {
    required: ['Placa', 'Modelo', 'Capacidade_Total'],
    types: {
      Placa: 'string',
      Modelo: 'string',
      Ano: 'number',
      Capacidade_Total: 'number',
      Capacidade_Sentados: 'number',
      Capacidade_PCD: 'number'
    },
    formats: {
      Placa: 'placa'
    },
    lengths: {
      Placa: { min: 7, max: 8 },
      Modelo: { min: 2, max: 50 },
      Renavam: { min: 9, max: 11 }
    },
    enums: {
      Status: ['Operacional', 'Manutenção', 'Inativo'],
      Tipo_Veiculo: ['Ônibus', 'Van', 'Micro-ônibus']
    }
  },
  
  // Rotas
  Rotas: {
    required: ['Nome_Rota', 'Codigo', 'Veiculo_ID'],
    types: {
      Nome_Rota: 'string',
      Codigo: 'string',
      Capacidade: 'number',
      Distancia_KM: 'number'
    },
    lengths: {
      Nome_Rota: { min: 3, max: 100 },
      Codigo: { min: 2, max: 20 }
    },
    enums: {
      Status: ['Ativa', 'Inativa', 'Suspensa'],
      Turno: ['Manhã', 'Tarde', 'Noite']
    }
  },
  
  // Pessoal (Motoristas/Monitores)
  Pessoal: {
    required: ['Nome_Completo', 'CPF', 'Cargo'],
    types: {
      Nome_Completo: 'string',
      CPF: 'string',
      Cargo: 'string'
    },
    formats: {
      CPF: 'cpf',
      Email: 'email',
      Telefone_1: 'telefone',
      Telefone_2: 'telefone',
      CEP: 'cep'
    },
    lengths: {
      Nome_Completo: { min: 3, max: 100 },
      CNH: { min: 11, max: 11 }
    },
    enums: {
      Cargo: ['Motorista', 'Monitor'],
      Status: ['Ativo', 'Inativo', 'Afastado', 'Férias']
    }
  },
  
  // Frequência
  Frequencia: {
    required: ['Aluno_ID', 'Rota_ID', 'Data', 'Status_Presenca'],
    types: {
      Aluno_ID: 'string',
      Rota_ID: 'string'
    },
    formats: {
      Data: 'date'
    },
    enums: {
      Status_Presenca: ['Presente', 'Ausente', 'Justificado', 'Falta'],
      Turno: ['Ida', 'Volta', 'Ambos']
    }
  },
  
  // Usuários
  Usuarios: {
    required: ['Username', 'Email', 'Role'],
    types: {
      Username: 'string',
      Email: 'string',
      Role: 'string'
    },
    formats: {
      Email: 'email'
    },
    lengths: {
      Username: { min: 3, max: 50 },
      Password: { min: 8, max: 100 }
    },
    enums: {
      Role: ['admin', 'secretario', 'monitor', 'motorista', 'visualizador'],
      Status: ['Ativo', 'Inativo', 'Bloqueado']
    }
  },
  
  // Incidentes
  Incidentes: {
    required: ['Titulo', 'Descricao', 'Prioridade'],
    types: {
      Titulo: 'string',
      Descricao: 'string',
      Prioridade: 'string'
    },
    lengths: {
      Titulo: { min: 5, max: 100 },
      Descricao: { min: 10, max: 1000 }
    },
    enums: {
      Prioridade: ['Baixa', 'Média', 'Alta', 'Crítica'],
      Status: ['Aberto', 'Em Andamento', 'Resolvido', 'Fechado', 'Cancelado'],
      Categoria: ['Mecânico', 'Comportamento', 'Segurança', 'Outro']
    }
  },
  
  // Eventos
  Eventos: {
    required: ['Tipo_Evento', 'Titulo', 'Data_Inicio'],
    types: {
      Tipo_Evento: 'string',
      Titulo: 'string'
    },
    formats: {
      Data_Inicio: 'date',
      Data_Fim: 'date'
    },
    lengths: {
      Titulo: { min: 5, max: 100 },
      Descricao: { max: 500 }
    },
    enums: {
      Tipo_Evento: ['DIA_MOVEL', 'REPOSICAO', 'EXTRACURRICULAR'],
      Status: ['Agendado', 'Confirmado', 'Cancelado', 'Concluído']
    }
  }
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém regras de validação para uma entidade
 * @param {string} sheetName - Nome da planilha/entidade
 * @returns {Object} Regras de validação ou objeto vazio
 */
function getValidationRules(sheetName) {
  return VALIDATION_RULES[sheetName] || {};
}

/**
 * Obtém configuração por chave do PropertiesService
 * @param {string} key - Chave da configuração
 * @param {*} defaultValue - Valor padrão se não encontrado
 * @returns {*} Valor da configuração
 */
function getProperty(key, defaultValue = null) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value !== null ? value : defaultValue;
}
