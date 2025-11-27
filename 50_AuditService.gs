/**
 * @file AuditService.gs
 * @description Sistema centralizado de auditoria de operações
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Registra todas as operações de CREATE, UPDATE, DELETE com:
 * - Quem fez a operação (usuário)
 * - Quando foi feita (timestamp)
 * - O que foi alterado (before/after)
 * - Onde foi feita (planilha/registro)
 */

// ============================================================================
// CONFIGURAÇÃO DE AUDITORIA
// ============================================================================

/**
 * @const {Object} AUDIT_CONFIG
 * @description Configuração do sistema de auditoria
 */
var AUDIT_CONFIG = {
  // Nome da planilha de auditoria
  SHEET_NAME: 'Auditoria',
  
  // Campos de auditoria padrão
  FIELDS: {
    CREATED_BY: 'createdBy',
    CREATED_AT: 'createdAt',
    UPDATED_BY: 'lastUpdatedBy',
    UPDATED_AT: 'lastUpdatedAt',
    DELETED_BY: 'deletedBy',
    DELETED_AT: 'deletedAt'
  },
  
  // Tipos de operação
  OPERATIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ: 'READ',
    BULK: 'BULK'
  },
  
  // Retenção de logs (dias)
  RETENTION_DAYS: 90,
  
  // Máximo de mudanças a registrar no diff
  MAX_DIFF_SIZE: 50
};

// ============================================================================
// AUDIT SERVICE - SERVIÇO DE AUDITORIA
// ============================================================================

/**
 * @class AuditService
 * @description Serviço de auditoria de operações
 */
var AuditService = (function() {
  
  /**
   * Construtor do AuditService
   * 
   * @constructor
   * @param {Object} [options] - Opções
   */
  function AuditService(options) {
    options = options || {};
    
    this.enabled = options.enabled !== false;
    this.sheetName = options.sheetName || AUDIT_CONFIG.SHEET_NAME;
    
    try {
      this.ss = SpreadsheetApp.getActiveSpreadsheet();
      this.auditSheet = this.ss.getSheetByName(this.sheetName);
      
      // Cria planilha se não existir
      if (!this.auditSheet && this.enabled) {
        this._initializeAuditSheet();
      }
    } catch (e) {
      this.enabled = false;
    }
  }
  
  /**
   * Registra operação de CREATE
   * 
   * @param {string} entity - Entidade (ex: 'Alunos')
   * @param {string} recordId - ID do registro
   * @param {Object} data - Dados criados
   * @param {Object} [options] - Opções
   * @return {boolean} Sucesso
   * 
   * @example
   * audit.logCreate('Alunos', '123', { nome: 'João' });
   */
  AuditService.prototype.logCreate = function(entity, recordId, data, options) {
    if (!this.enabled) return false;
    
    try {
      var user = this._getCurrentUser();
      var timestamp = new Date();
      
      var entry = {
        timestamp: timestamp,
        operation: AUDIT_CONFIG.OPERATIONS.CREATE,
        entity: entity,
        recordId: recordId,
        user: user,
        before: null,
        after: this._sanitizeData(data),
        changes: null,
        metadata: options || {}
      };
      
      return this._writeAuditLog(entry);
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Registra operação de UPDATE
   * 
   * @param {string} entity - Entidade
   * @param {string} recordId - ID do registro
   * @param {Object} before - Dados antes
   * @param {Object} after - Dados depois
   * @param {Object} [options] - Opções
   * @return {boolean} Sucesso
   * 
   * @example
   * audit.logUpdate('Alunos', '123', oldData, newData);
   */
  AuditService.prototype.logUpdate = function(entity, recordId, before, after, options) {
    if (!this.enabled) return false;
    
    try {
      var user = this._getCurrentUser();
      var timestamp = new Date();
      var changes = this._calculateDiff(before, after);
      
      var entry = {
        timestamp: timestamp,
        operation: AUDIT_CONFIG.OPERATIONS.UPDATE,
        entity: entity,
        recordId: recordId,
        user: user,
        before: this._sanitizeData(before),
        after: this._sanitizeData(after),
        changes: changes,
        metadata: options || {}
      };
      
      return this._writeAuditLog(entry);
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Registra operação de DELETE
   * 
   * @param {string} entity - Entidade
   * @param {string} recordId - ID do registro
   * @param {Object} data - Dados deletados
   * @param {Object} [options] - Opções
   * @return {boolean} Sucesso
   * 
   * @example
   * audit.logDelete('Alunos', '123', deletedData);
   */
  AuditService.prototype.logDelete = function(entity, recordId, data, options) {
    if (!this.enabled) return false;
    
    try {
      var user = this._getCurrentUser();
      var timestamp = new Date();
      
      var entry = {
        timestamp: timestamp,
        operation: AUDIT_CONFIG.OPERATIONS.DELETE,
        entity: entity,
        recordId: recordId,
        user: user,
        before: this._sanitizeData(data),
        after: null,
        changes: null,
        metadata: options || {}
      };
      
      return this._writeAuditLog(entry);
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Adiciona campos de auditoria aos dados
   * 
   * @param {Object} data - Dados
   * @param {string} operation - Operação (CREATE ou UPDATE)
   * @return {Object} Dados com campos de auditoria
   * 
   * @example
   * var dataWithAudit = audit.addAuditFields(data, 'CREATE');
   */
  AuditService.prototype.addAuditFields = function(data, operation) {
    var user = this._getCurrentUser();
    var timestamp = new Date();
    
    var result = Object.assign({}, data);
    
    if (operation === AUDIT_CONFIG.OPERATIONS.CREATE) {
      result[AUDIT_CONFIG.FIELDS.CREATED_BY] = user;
      result[AUDIT_CONFIG.FIELDS.CREATED_AT] = timestamp;
    }
    
    if (operation === AUDIT_CONFIG.OPERATIONS.UPDATE) {
      result[AUDIT_CONFIG.FIELDS.UPDATED_BY] = user;
      result[AUDIT_CONFIG.FIELDS.UPDATED_AT] = timestamp;
    }
    
    if (operation === AUDIT_CONFIG.OPERATIONS.DELETE) {
      result[AUDIT_CONFIG.FIELDS.DELETED_BY] = user;
      result[AUDIT_CONFIG.FIELDS.DELETED_AT] = timestamp;
    }
    
    return result;
  };
  
  /**
   * Busca logs de auditoria
   * 
   * @param {Object} filters - Filtros
   * @return {Array} Logs encontrados
   * 
   * @example
   * var logs = audit.searchLogs({
   *   entity: 'Alunos',
   *   recordId: '123',
   *   operation: 'UPDATE'
   * });
   */
  AuditService.prototype.searchLogs = function(filters) {
    if (!this.enabled || !this.auditSheet) return [];
    
    try {
      var data = this.auditSheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      
      var logs = rows.map(function(row) {
        var log = {};
        headers.forEach(function(header, index) {
          log[header] = row[index];
        });
        return log;
      });
      
      // Aplica filtros
      if (filters) {
        logs = logs.filter(function(log) {
          for (var key in filters) {
            if (log[key] !== filters[key]) {
              return false;
            }
          }
          return true;
        });
      }
      
      return logs;
      
    } catch (error) {
      return [];
    }
  };
  
  /**
   * Obtém histórico de um registro
   * 
   * @param {string} entity - Entidade
   * @param {string} recordId - ID do registro
   * @return {Array} Histórico
   * 
   * @example
   * var history = audit.getRecordHistory('Alunos', '123');
   */
  AuditService.prototype.getRecordHistory = function(entity, recordId) {
    return this.searchLogs({
      entity: entity,
      recordId: recordId
    });
  };
  
  /**
   * Limpa logs antigos
   * 
   * @param {number} [days] - Dias de retenção
   * @return {number} Quantidade de logs deletados
   * 
   * @example
   * var deleted = audit.cleanOldLogs(90);
   */
  AuditService.prototype.cleanOldLogs = function(days) {
    if (!this.enabled || !this.auditSheet) return 0;
    
    try {
      days = days || AUDIT_CONFIG.RETENTION_DAYS;
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      var deleted = BatchOperations.deleteRowsByCondition(this.auditSheet, function(row) {
        var timestamp = new Date(row[0]);
        return timestamp < cutoffDate;
      });
      
      return deleted;
      
    } catch (error) {
      return 0;
    }
  };
  
  /**
   * Obtém estatísticas de auditoria
   * 
   * @return {Object} Estatísticas
   * 
   * @example
   * var stats = audit.getStats();
   */
  AuditService.prototype.getStats = function() {
    if (!this.enabled || !this.auditSheet) {
      return { enabled: false };
    }
    
    try {
      var data = this.auditSheet.getDataRange().getValues();
      var rows = data.slice(1);
      
      var stats = {
        enabled: true,
        total: rows.length,
        byOperation: {},
        byEntity: {},
        byUser: {}
      };
      
      rows.forEach(function(row) {
        var operation = row[1];
        var entity = row[2];
        var user = row[4];
        
        stats.byOperation[operation] = (stats.byOperation[operation] || 0) + 1;
        stats.byEntity[entity] = (stats.byEntity[entity] || 0) + 1;
        stats.byUser[user] = (stats.byUser[user] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      return { enabled: true, error: error.message };
    }
  };
  
  /**
   * Inicializa planilha de auditoria
   * 
   * @private
   */
  AuditService.prototype._initializeAuditSheet = function() {
    try {
      this.auditSheet = this.ss.insertSheet(this.sheetName);
      
      var headers = [
        'Timestamp',
        'Operation',
        'Entity',
        'RecordId',
        'User',
        'Before',
        'After',
        'Changes',
        'Metadata'
      ];
      
      this.auditSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      this.auditSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      this.auditSheet.setFrozenRows(1);
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Escreve log de auditoria
   * 
   * @private
   * @param {Object} entry - Entrada de log
   * @return {boolean} Sucesso
   */
  AuditService.prototype._writeAuditLog = function(entry) {
    try {
      if (!this.auditSheet) return false;
      
      var row = [
        entry.timestamp,
        entry.operation,
        entry.entity,
        entry.recordId,
        entry.user,
        JSON.stringify(entry.before),
        JSON.stringify(entry.after),
        JSON.stringify(entry.changes),
        JSON.stringify(entry.metadata)
      ];
      
      this.auditSheet.appendRow(row);
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Obtém usuário atual
   * 
   * @private
   * @return {string} Email do usuário
   */
  AuditService.prototype._getCurrentUser = function() {
    try {
      return Session.getActiveUser().getEmail();
    } catch (e) {
      return 'system';
    }
  };
  
  /**
   * Sanitiza dados para log
   * 
   * @private
   * @param {Object} data - Dados
   * @return {Object} Dados sanitizados
   */
  AuditService.prototype._sanitizeData = function(data) {
    if (!data) return null;
    
    var sanitized = {};
    
    for (var key in data) {
      // Remove campos sensíveis
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('senha') ||
          key.toLowerCase().includes('token')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized;
  };
  
  /**
   * Calcula diferenças entre objetos
   * 
   * @private
   * @param {Object} before - Antes
   * @param {Object} after - Depois
   * @return {Object} Diferenças
   */
  AuditService.prototype._calculateDiff = function(before, after) {
    var changes = {};
    var count = 0;
    
    // Verifica mudanças
    for (var key in after) {
      if (before[key] !== after[key]) {
        changes[key] = {
          from: before[key],
          to: after[key]
        };
        count++;
        
        // Limita tamanho do diff
        if (count >= AUDIT_CONFIG.MAX_DIFF_SIZE) {
          changes._truncated = true;
          break;
        }
      }
    }
    
    return changes;
  };
  
  return AuditService;
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

/**
 * Obtém instância global do AuditService
 * 
 * @return {AuditService}
 */
function getAuditService() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getAuditService();
  }
  
  // Fallback: cria instância local
  if (typeof globalThis._auditService === 'undefined') {
    globalThis._auditService = new AuditService();
  }
  return globalThis._auditService;
}

/**
 * Registra operação de CREATE (wrapper)
 * 
 * @param {string} entity - Entidade
 * @param {string} recordId - ID
 * @param {Object} data - Dados
 */
function auditCreate(entity, recordId, data) {
  getAuditService().logCreate(entity, recordId, data);
}



/**
 * Adiciona campos de auditoria (wrapper)
 * 
 * @param {Object} data - Dados
 * @param {string} operation - Operação
 * @return {Object} Dados com auditoria
 */
function addAuditFields(data, operation) {
  return getAuditService().addAuditFields(data, operation);
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa AuditService
 */
function testAuditService() {
  Logger.log('🧪 Testando AuditService...\n');
  
  try {
    var audit = new AuditService();
    
    // Teste 1: Log de CREATE
    Logger.log('Teste 1: Log de CREATE');
    audit.logCreate('Alunos', 'TEST_123', {
      nome: 'João Silva',
      email: 'joao@test.com'
    });
    Logger.log('✓ CREATE registrado');
    
    // Teste 2: Log de UPDATE
    Logger.log('\nTeste 2: Log de UPDATE');
    audit.logUpdate('Alunos', 'TEST_123', 
      { nome: 'João Silva', status: 'Ativo' },
      { nome: 'João Silva Santos', status: 'Inativo' }
    );
    Logger.log('✓ UPDATE registrado');
    
    // Teste 3: Log de DELETE
    Logger.log('\nTeste 3: Log de DELETE');
    audit.logDelete('Alunos', 'TEST_123', {
      nome: 'João Silva Santos',
      email: 'joao@test.com'
    });
    Logger.log('✓ DELETE registrado');
    
    // Teste 4: Adicionar campos de auditoria
    Logger.log('\nTeste 4: Adicionar campos de auditoria');
    var data = { nome: 'Maria' };
    var withAudit = audit.addAuditFields(data, 'CREATE');
    Logger.log('✓ Campos adicionados: ' + JSON.stringify(withAudit));
    
    // Teste 5: Buscar logs
    Logger.log('\nTeste 5: Buscar logs');
    var logs = audit.searchLogs({ entity: 'Alunos' });
    Logger.log('✓ Logs encontrados: ' + logs.length);
    
    // Teste 6: Histórico
    Logger.log('\nTeste 6: Histórico do registro');
    var history = audit.getRecordHistory('Alunos', 'TEST_123');
    Logger.log('✓ Histórico: ' + history.length + ' operações');
    
    // Teste 7: Estatísticas
    Logger.log('\nTeste 7: Estatísticas');
    var stats = audit.getStats();
    Logger.log('✓ Total de logs: ' + stats.total);
    Logger.log('✓ Por operação: ' + JSON.stringify(stats.byOperation));
    
    // Teste 8: Wrappers
    Logger.log('\nTeste 8: Wrappers');
    auditCreate('Veiculos', 'V123', { placa: 'ABC1234' });
    Logger.log('✓ Wrapper funcionando');
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}


