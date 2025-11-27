/**
 * @file SchemaService.gs
 * @description Gerenciamento de esquema de dados das planilhas
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Define e gerencia esquemas de dados, separando definição de manipulação.
 * 
 * Intervenção #64 - SchemaService
 */

// ============================================================================
// SCHEMAS DAS PLANILHAS
// ============================================================================

/**
 * @const {Object} SCHEMAS
 * @description Esquemas de todas as planilhas
 */
var SCHEMAS = {
  Usuarios: {
    name: 'Usuarios',
    displayName: 'Usuários',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Username', type: 'string', required: true },
      { name: 'Email', type: 'string', required: true, unique: true, validator: 'email' },
      { name: 'Password_Hash', type: 'string', required: true },
      { name: 'Role', type: 'string', required: true, enum: ['Admin', 'Operador', 'Visualizador', 'Motorista', 'Monitor'] },
      { name: 'Status', type: 'string', required: true, enum: ['Ativo', 'Inativo'], default: 'Ativo' },
      { name: 'Criado_Em', type: 'date', required: true }
    ],
    indexes: ['ID', 'Email', 'Username'],
    relations: []
  },

  Alunos: {
    name: 'Alunos',
    displayName: 'Alunos',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Nome_Completo', type: 'string', required: true },
      { name: 'RA_Aluno', type: 'string', required: true, unique: true },
      { name: 'Data_Nascimento', type: 'date', required: true },
      { name: 'Serie_Ano', type: 'string', required: true },
      { name: 'Turno', type: 'string', required: true, enum: ['Matutino', 'Vespertino', 'Noturno'] },
      { name: 'ID_Rota', type: 'string', required: false },
      { name: 'Status_Ativo', type: 'string', required: true, enum: ['Ativo', 'Inativo'], default: 'Ativo' },
      { name: 'Timestamp', type: 'date', required: true }
    ],
    indexes: ['ID', 'RA_Aluno'],
    relations: [
      { column: 'ID_Rota', references: 'Rotas.ID' }
    ]
  },

  Pessoal: {
    name: 'Pessoal',
    displayName: 'Pessoal (Motoristas/Monitores)',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Nome_Completo', type: 'string', required: true },
      { name: 'CPF', type: 'string', required: true, unique: true, validator: 'cpf' },
      { name: 'Data_Nascimento', type: 'date', required: true },
      { name: 'Funcao', type: 'string', required: true, enum: ['Motorista', 'Monitor'] },
      { name: 'Telefone', type: 'string', required: true, validator: 'phone' },
      { name: 'Email', type: 'string', required: false, validator: 'email' },
      { name: 'Endereco', type: 'string', required: false },
      { name: 'CNH_Numero', type: 'string', required: false },
      { name: 'CNH_Categoria', type: 'string', required: false },
      { name: 'CNH_Validade', type: 'date', required: false },
      { name: 'Data_Admissao', type: 'date', required: true },
      { name: 'Status', type: 'string', required: true, enum: ['Ativo', 'Inativo'], default: 'Ativo' },
      { name: 'ID_Rota_Associada', type: 'string', required: false },
      { name: 'Observacoes', type: 'string', required: false },
      { name: 'Criado_Em', type: 'date', required: true }
    ],
    indexes: ['ID', 'CPF', 'Nome_Completo'],
    relations: [
      { column: 'ID_Rota_Associada', references: 'Rotas.ID' }
    ]
  },

  Rotas: {
    name: 'Rotas',
    displayName: 'Rotas',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Nome_Rota', type: 'string', required: true },
      { name: 'Origem', type: 'string', required: true },
      { name: 'Destino', type: 'string', required: true },
      { name: 'Turno', type: 'string', required: true, enum: ['Matutino', 'Vespertino', 'Noturno'] },
      { name: 'Status', type: 'string', required: true, enum: ['Ativa', 'Inativa'], default: 'Ativa' },
      { name: 'Capacidade_Veiculo', type: 'number', required: true },
      { name: 'Alunos_Ativos', type: 'number', required: false, default: 0 },
      { name: 'ID_Veiculo_Padrao', type: 'string', required: false },
      { name: 'ID_Motorista_Padrao', type: 'string', required: false },
      { name: 'ID_Monitor_Padrao', type: 'string', required: false },
      { name: 'Timestamp', type: 'date', required: true }
    ],
    indexes: ['ID', 'Nome_Rota'],
    relations: [
      { column: 'ID_Motorista_Padrao', references: 'Pessoal.ID' },
      { column: 'ID_Monitor_Padrao', references: 'Pessoal.ID' }
    ]
  },

  Frequencia: {
    name: 'Frequencia',
    displayName: 'Frequência',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Data', type: 'date', required: true },
      { name: 'ID_Aluno', type: 'string', required: true },
      { name: 'ID_Rota', type: 'string', required: true },
      { name: 'ID_Veiculo', type: 'string', required: false },
      { name: 'ID_Motorista', type: 'string', required: false },
      { name: 'ID_Monitor', type: 'string', required: false },
      { name: 'Status_Presenca', type: 'string', required: true, enum: ['Presente', 'Ausente'] },
      { name: 'Periodo', type: 'string', required: true, enum: ['IDA', 'VOLTA'] },
      { name: 'Horario_Embarque', type: 'string', required: false },
      { name: 'Horario_Desembarque', type: 'string', required: false },
      { name: 'KM_Inicial', type: 'number', required: false },
      { name: 'KM_Final', type: 'number', required: false },
      { name: 'Observacoes', type: 'string', required: false },
      { name: 'Timestamp', type: 'date', required: true }
    ],
    indexes: ['ID', 'Data', 'ID_Aluno', 'ID_Rota'],
    relations: [
      { column: 'ID_Aluno', references: 'Alunos.ID' },
      { column: 'ID_Rota', references: 'Rotas.ID' },
      { column: 'ID_Motorista', references: 'Pessoal.ID' },
      { column: 'ID_Monitor', references: 'Pessoal.ID' }
    ]
  },

  Incidentes: {
    name: 'Incidentes',
    displayName: 'Incidentes',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Data_Hora', type: 'date', required: true },
      { name: 'Tipo', type: 'string', required: true },
      { name: 'Descricao', type: 'string', required: true },
      { name: 'Gravidade', type: 'string', required: true, enum: ['Baixa', 'Média', 'Alta'] },
      { name: 'Status', type: 'string', required: true, enum: ['Pendente', 'Resolvido'] },
      { name: 'Responsavel', type: 'string', required: false },
      { name: 'Timestamp', type: 'date', required: true }
    ],
    indexes: ['ID', 'Data_Hora', 'Status'],
    relations: []
  },

  Eventos: {
    name: 'Eventos',
    displayName: 'Eventos Escolares',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Tipo_Evento', type: 'string', required: true, enum: ['DIA_MOVEL', 'REPOSICAO', 'EXTRACURRICULAR'] },
      { name: 'Titulo', type: 'string', required: true },
      { name: 'Descricao', type: 'string', required: false },
      { name: 'Data_Inicio', type: 'date', required: true },
      { name: 'Data_Fim', type: 'date', required: true },
      { name: 'Escola', type: 'string', required: false },
      { name: 'Status', type: 'string', required: true },
      { name: 'Dados_Adicionais', type: 'string', required: false }, // JSON string
      { name: 'Criado_Por', type: 'string', required: true },
      { name: 'Criado_Em', type: 'date', required: true },
      { name: 'Atualizado_Em', type: 'date', required: true }
    ],
    indexes: ['ID', 'Data_Inicio', 'Tipo_Evento'],
    relations: []
  },

  Logs: {
    name: 'Logs',
    displayName: 'Logs do Sistema',
    columns: [
      { name: 'ID', type: 'string', required: true, unique: true },
      { name: 'Timestamp', type: 'date', required: true },
      { name: 'Usuario', type: 'string', required: true },
      { name: 'Acao', type: 'string', required: true },
      { name: 'Detalhes', type: 'string', required: false },
      { name: 'Status', type: 'string', required: false }
    ],
    indexes: ['ID', 'Timestamp', 'Usuario'],
    relations: []
  }
};

// ============================================================================
// SCHEMA SERVICE
// ============================================================================

/**
 * @class SchemaService
 * @description Serviço de gerenciamento de esquemas
 */
var SchemaService = SchemaService || (function() {
  
  function SchemaService() {
    this.schemas = SCHEMAS;
  }
  
  /**
   * Obtém esquema de uma planilha
   * 
   * @param {string} sheetName - Nome da planilha
   * @return {Object} Esquema
   */
  SchemaService.prototype.getSchema = function(sheetName) {
    return this.schemas[sheetName] || null;
  };
  
  /**
   * Obtém colunas de uma planilha
   * 
   * @param {string} sheetName - Nome da planilha
   * @return {Array} Colunas
   */
  SchemaService.prototype.getColumns = function(sheetName) {
    var schema = this.getSchema(sheetName);
    return schema ? schema.columns : [];
  };
  
  /**
   * Obtém nomes das colunas
   * 
   * @param {string} sheetName - Nome da planilha
   * @return {Array<string>} Nomes
   */
  SchemaService.prototype.getColumnNames = function(sheetName) {
    var columns = this.getColumns(sheetName);
    return columns.map(function(col) { return col.name; });
  };
  
  /**
   * Obtém colunas obrigatórias
   * 
   * @param {string} sheetName - Nome da planilha
   * @return {Array} Colunas obrigatórias
   */
  SchemaService.prototype.getRequiredColumns = function(sheetName) {
    var columns = this.getColumns(sheetName);
    return columns.filter(function(col) { return col.required; });
  };
  
  /**
   * Valida dados contra esquema
   * 
   * @param {string} sheetName - Nome da planilha
   * @param {Object} data - Dados
   * @return {Object} Resultado
   */
  SchemaService.prototype.validate = function(sheetName, data) {
    var schema = this.getSchema(sheetName);
    
    if (!schema) {
      return { valid: false, errors: ['Esquema não encontrado'] };
    }
    
    var errors = [];
    
    schema.columns.forEach(function(col) {
      var value = data[col.name];
      
      // Required
      if (col.required && (value === null || value === undefined || value === '')) {
        errors.push(col.name + ' é obrigatório');
      }
      
      // Type
      if (value !== null && value !== undefined && value !== '') {
        var actualType = typeof value;
        if (col.type === 'date' && !(value instanceof Date)) {
          errors.push(col.name + ' deve ser uma data');
        } else if (col.type === 'number' && actualType !== 'number') {
          errors.push(col.name + ' deve ser um número');
        } else if (col.type === 'string' && actualType !== 'string') {
          errors.push(col.name + ' deve ser texto');
        }
      }
      
      // Enum
      if (col.enum && value && col.enum.indexOf(value) === -1) {
        errors.push(col.name + ' deve ser um dos valores: ' + col.enum.join(', '));
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  };
  
  /**
   * Cria planilha com esquema
   * 
   * @param {string} sheetName - Nome da planilha
   * @return {boolean} Sucesso
   */
  SchemaService.prototype.createSheet = function(sheetName) {
    try {
      var schema = this.getSchema(sheetName);
      
      if (!schema) {
        return false;
      }
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      
      if (sheet) {
        return true; // Já existe
      }
      
      // Cria planilha
      sheet = ss.insertSheet(sheetName);
      
      // Adiciona headers
      var headers = this.getColumnNames(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Lista todos os esquemas
   * 
   * @return {Array<string>} Nomes das planilhas
   */
  SchemaService.prototype.listSchemas = function() {
    return Object.keys(this.schemas);
  };
  
  return SchemaService;
})();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global
 * 
 * @return {SchemaService}
 */
function getSchemaService() {
  if (typeof globalThis._schemaService === 'undefined') {
    globalThis._schemaService = new SchemaService();
  }
  return globalThis._schemaService;
}

/**
 * Obtém esquema (wrapper)
 * 
 * @param {string} sheetName - Nome da planilha
 * @return {Object} Esquema
 */
function getSchema(sheetName) {
  return getSchemaService().getSchema(sheetName);
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa SchemaService
 */
function testSchemaService() {
  Logger.log('🧪 Testando Schema Service...\n');
  
  var schema = new SchemaService();
  
  // Teste 1: Obter esquema
  Logger.log('=== Teste 1: Obter Esquema ===');
  var alunosSchema = schema.getSchema('Alunos');
  Logger.log('✓ Alunos: ' + alunosSchema.columns.length + ' colunas');
  
  // Teste 2: Colunas
  Logger.log('\n=== Teste 2: Colunas ===');
  var columns = schema.getColumnNames('Alunos');
  Logger.log('✓ Colunas: ' + columns.join(', '));
  
  // Teste 3: Validação
  Logger.log('\n=== Teste 3: Validação ===');
  var validData = {
    ID: '123',
    Nome_Completo: 'João Silva',
    RA_Aluno: 'RA123',
    Data_Nascimento: new Date(),
    Escola: 'Escola ABC',
    Serie: '5º Ano',
    Turno: 'Matutino',
    Endereco: 'Rua X',
    Telefone_Responsavel: '61999999999',
    Status: 'Ativo'
  };
  
  var result = schema.validate('Alunos', validData);
  Logger.log('✓ Válido: ' + result.valid);
  
  // Teste 4: Dados inválidos
  Logger.log('\n=== Teste 4: Dados Inválidos ===');
  var invalidData = {
    ID: '123'
    // Faltam campos obrigatórios
  };
  
  var result2 = schema.validate('Alunos', invalidData);
  Logger.log('✓ Inválido: ' + !result2.valid);
  Logger.log('✓ Erros: ' + result2.errors.length);
  
  Logger.log('\n✅ Testes concluídos!');
}
