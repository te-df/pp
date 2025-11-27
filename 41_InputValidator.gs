/**
 * InputValidator.gs
 * Input validation logic and rules.
 */

/**
 * Validador de entrada para operações CRUD
 */
class InputValidator {
  /**
   * Valida dados de entrada
   * @param {Object} data - Dados a validar
   * @param {Object} rules - Regras de validação
   * @returns {Object} Resultado da validação
   */
  static validate(data, rules = {}) {
    const errors = [];
    const warnings = [];
    
    // Valida campos obrigatórios
    if (rules.required) {
      rules.required.forEach(field => {
        if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`Campo obrigatório ausente: ${field}`);
        }
      });
    }
    
    // Valida tipos de dados
    if (rules.types && data) {
      Object.entries(rules.types).forEach(([field, expectedType]) => {
        if (data[field] !== undefined && data[field] !== null) {
          const actualType = typeof data[field];
          if (actualType !== expectedType) {
            errors.push(`Campo '${field}' deve ser ${expectedType}, recebido ${actualType}`);
          }
        }
      });
    }
    
    // Valida formatos (email, CPF, telefone, etc)
    if (rules.formats && data) {
      Object.entries(rules.formats).forEach(([field, format]) => {
        if (data[field]) {
          if (!this.validateFormat(data[field], format)) {
            errors.push(`Campo '${field}' com formato inválido (esperado: ${format})`);
          }
        }
      });
    }
    
    // Valida comprimentos
    if (rules.lengths && data) {
      Object.entries(rules.lengths).forEach(([field, length]) => {
        if (data[field]) {
          const value = String(data[field]);
          if (length.min && value.length < length.min) {
            errors.push(`Campo '${field}' muito curto (mínimo ${length.min} caracteres)`);
          }
          if (length.max && value.length > length.max) {
            warnings.push(`Campo '${field}' muito longo (máximo ${length.max} caracteres)`);
          }
        }
      });
    }
    
    // Valida valores permitidos (enums)
    if (rules.enums && data) {
      Object.entries(rules.enums).forEach(([field, allowedValues]) => {
        if (data[field] && !allowedValues.includes(data[field])) {
          errors.push(`Campo '${field}' com valor inválido. Valores permitidos: ${allowedValues.join(', ')}`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
  
  /**
   * Valida formato específico
   * @param {string} value - Valor a validar
   * @param {string} format - Formato esperado
   * @returns {boolean} Válido ou não
   */
  static validateFormat(value, format) {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
      telefone: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
      cep: /^\d{5}-?\d{3}$/,
      placa: /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/,
      date: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/,
      url: /^https?:\/\/.+/
    };
    
    const pattern = patterns[format];
    return pattern ? pattern.test(value) : true;
  }
  
  /**
   * Sanitiza string removendo caracteres perigosos
   * @param {string} input - String a sanitizar
   * @returns {string} String sanitizada
   */
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    
    // Remove tags HTML
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove caracteres de controle perigosos
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Escapa aspas para prevenir injeção
    sanitized = sanitized.replace(/"/g, '&quot;');
    sanitized = sanitized.replace(/'/g, '&#39;');
    
    return sanitized.trim();
  }
  
  /**
   * Valida ID
   * @param {string} id - ID a validar
   * @param {string} prefix - Prefixo esperado (opcional)
   * @returns {boolean} Válido ou não
   */
  static validateId(id, prefix = null) {
    if (!id || typeof id !== 'string') return false;
    
    if (prefix) {
      return id.startsWith(prefix) && id.length > prefix.length;
    }
    
    return id.length > 0;
  }
  
  /**
   * Normaliza dados de entrada
   * @param {Object} data - Dados a normalizar
   * @returns {Object} Dados normalizados
   */
  static normalize(data) {
    if (!data || typeof data !== 'object') return data;
    
    const normalized = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Normaliza strings
      if (typeof value === 'string') {
        normalized[key] = this.sanitize(value);
      }
      // Normaliza números
      else if (typeof value === 'number') {
        normalized[key] = isNaN(value) ? 0 : value;
      }
      // Normaliza booleans
      else if (typeof value === 'boolean') {
        normalized[key] = value;
      }
      // Normaliza datas
      else if (value instanceof Date) {
        normalized[key] = value;
      }
      // Outros tipos (arrays, objetos)
      else {
        normalized[key] = value;
      }
    });
    
    return normalized;
  }
}

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

/**
 * Obtém regras de validação para uma entidade
 * @param {string} sheetName - Nome da planilha/entidade
 * @returns {Object} Regras de validação ou objeto vazio
 */
function getValidationRules(sheetName) {
  return VALIDATION_RULES[sheetName] || {};
}
