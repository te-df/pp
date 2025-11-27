/**
 * @file LoggerService.gs
 * @description Sistema estruturado de logging
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo implementa um sistema completo de logging com níveis,
 * rotação automática, persistência e métricas.
 * 
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// LOG LEVELS - NÍVEIS DE LOG
// ============================================================================

/**
 * @enum {string}
 * @description Níveis de log do sistema
 * @readonly
 */
var LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * @const {Object} LOG_LEVEL_PRIORITY
 * @description Prioridade dos níveis de log
 * @readonly
 */
var LOG_LEVEL_PRIORITY = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// ============================================================================
// LOGGER SERVICE - SERVIÇO DE LOGGING
// ============================================================================

/**
 * @class LoggerService
 * @description Serviço estruturado de logging
 */
var LoggerService = (function() {
  
  /**
   * @typedef {Object} LogEntry
   * @property {string} level - Nível do log
   * @property {string} message - Mensagem
   * @property {string} timestamp - Timestamp ISO
   * @property {string} [source] - Fonte do log
   * @property {Object} [context] - Contexto adicional
   * @property {string} [userId] - ID do usuário
   * @property {string} [sessionId] - ID da sessão
   */
  
  /**
   * Construtor do LoggerService
   * 
   * @constructor
   * @param {Object} [options] - Opções de configuração
   * @param {string} [options.minLevel] - Nível mínimo de log
   * @param {boolean} [options.persistToSheet] - Persistir em planilha
   * @param {boolean} [options.consoleOutput] - Saída no console
   */
  function LoggerService(options) {
    options = options || {};
    
    this.minLevel = options.minLevel || LogLevel.INFO;
    this.persistToSheet = options.persistToSheet !== false;
    this.consoleOutput = options.consoleOutput !== false;
    this.buffer = [];
    this.maxBufferSize = 100;
    this.stats = {
      total: 0,
      byLevel: {},
      bySource: {}
    };
    
    // Inicializa contadores
    Object.keys(LogLevel).forEach(function(level) {
      this.stats.byLevel[level] = 0;
    }.bind(this));
  }
  
  /**
   * Log de nível DEBUG
   * 
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   * 
   * @example
   * logger.debug('Processando dados', { count: 10 }, 'processData');
   */
  LoggerService.prototype.debug = function(message, context, source) {
    this._log(LogLevel.DEBUG, message, context, source);
  };
  
  /**
   * Log de nível INFO
   * 
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   * 
   * @example
   * logger.info('Usuário autenticado', { userId: 123 });
   */
  LoggerService.prototype.info = function(message, context, source) {
    this._log(LogLevel.INFO, message, context, source);
  };
  
  /**
   * Log de nível WARN
   * 
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   * 
   * @example
   * logger.warn('Cache miss', { key: 'user_123' });
   */
  LoggerService.prototype.warn = function(message, context, source) {
    this._log(LogLevel.WARN, message, context, source);
  };
  
  /**
   * Log de nível ERROR
   * 
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   * 
   * @example
   * logger.error('Falha ao salvar', { error: err.message });
   */
  LoggerService.prototype.error = function(message, context, source) {
    this._log(LogLevel.ERROR, message, context, source);
  };
  
  /**
   * Log de nível CRITICAL
   * 
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   * 
   * @example
   * logger.critical('Sistema fora do ar', { reason: 'timeout' });
   */
  LoggerService.prototype.critical = function(message, context, source) {
    this._log(LogLevel.CRITICAL, message, context, source);
  };
  
  /**
   * Log genérico com nível especificado
   * 
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   */
  LoggerService.prototype.log = function(level, message, context, source) {
    this._log(level, message, context, source);
  };
  
  /**
   * Implementação interna de log
   * 
   * @private
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} [context] - Contexto adicional
   * @param {string} [source] - Fonte do log
   */
  LoggerService.prototype._log = function(level, message, context, source) {
    try {
      // Verifica se deve logar baseado no nível mínimo
      if (!this._shouldLog(level)) {
        return;
      }
      
      // Cria entrada de log
      var entry = {
        level: level,
        message: message,
        timestamp: new Date().toISOString(),
        source: source || this._detectSource(),
        context: context || {}
      };
      
      // Adiciona informações de usuário/sessão se disponíveis
      this._enrichEntry(entry);
      
      // Saída no console
      if (this.consoleOutput) {
        this._consoleOutput(entry);
      }
      
      // Adiciona ao buffer
      this.buffer.push(entry);
      
      // Atualiza estatísticas
      this._updateStats(entry);
      
      // Flush se buffer cheio
      if (this.buffer.length >= this.maxBufferSize) {
        this.flush();
      }
      
    } catch (error) {
      // Fallback para Logger nativo se falhar
      Logger.log('[LoggerService] Erro ao logar: ' + error.message);
    }
  };
  
  /**
   * Verifica se deve logar baseado no nível
   * 
   * @private
   * @param {string} level - Nível do log
   * @return {boolean}
   */
  LoggerService.prototype._shouldLog = function(level) {
    var levelPriority = LOG_LEVEL_PRIORITY[level] || 0;
    var minPriority = LOG_LEVEL_PRIORITY[this.minLevel] || 0;
    return levelPriority >= minPriority;
  };
  
  /**
   * Detecta fonte do log automaticamente
   * 
   * @private
   * @return {string}
   */
  LoggerService.prototype._detectSource = function() {
    try {
      // Tenta obter da stack trace
      var stack = new Error().stack;
      if (stack) {
        var lines = stack.split('\n');
        // Pega a 4ª linha (ignora Error, _detectSource, _log)
        if (lines.length > 3) {
          var line = lines[3];
          var match = line.match(/at (\w+)/);
          if (match) {
            return match[1];
          }
        }
      }
    } catch (e) {
      // Ignora erro
    }
    return 'unknown';
  };
  
  /**
   * Enriquece entrada com informações adicionais
   * 
   * @private
   * @param {LogEntry} entry - Entrada de log
   */
  LoggerService.prototype._enrichEntry = function(entry) {
    try {
      // Adiciona ambiente
      if (typeof EnvironmentManager !== 'undefined') {
        entry.environment = EnvironmentManager.getEnvironment();
      }
      
      // Adiciona usuário se disponível
      if (typeof Session !== 'undefined') {
        try {
          entry.userId = Session.getActiveUser().getEmail();
        } catch (e) {
          // Ignora se não disponível
        }
      }
      
    } catch (error) {
      // Ignora erro de enriquecimento
    }
  };
  
  /**
   * Saída formatada no console
   * 
   * @private
   * @param {LogEntry} entry - Entrada de log
   */
  LoggerService.prototype._consoleOutput = function(entry) {
    var icon = this._getLevelIcon(entry.level);
    var message = icon + ' [' + entry.level + '] ' + entry.message;
    
    if (entry.source) {
      message += ' (' + entry.source + ')';
    }
    
    Logger.log(message);
    
    // Log contexto em DEBUG
    if (entry.level === LogLevel.DEBUG && Object.keys(entry.context).length > 0) {
      Logger.log('  Context: ' + JSON.stringify(entry.context));
    }
  };
  
  /**
   * Obtém ícone para o nível
   * 
   * @private
   * @param {string} level - Nível do log
   * @return {string}
   */
  LoggerService.prototype._getLevelIcon = function(level) {
    var icons = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    };
    return icons[level] || '📝';
  };
  
  /**
   * Atualiza estatísticas
   * 
   * @private
   * @param {LogEntry} entry - Entrada de log
   */
  LoggerService.prototype._updateStats = function(entry) {
    this.stats.total++;
    this.stats.byLevel[entry.level]++;
    
    if (entry.source) {
      this.stats.bySource[entry.source] = (this.stats.bySource[entry.source] || 0) + 1;
    }
  };
  
  /**
   * Flush do buffer para planilha
   * 
   * @return {Object} Resultado do flush
   */
  LoggerService.prototype.flush = function() {
    try {
      if (this.buffer.length === 0) {
        return { success: true, flushed: 0 };
      }
      
      if (this.persistToSheet) {
        this._persistToSheet(this.buffer);
      }
      
      var flushed = this.buffer.length;
      this.buffer = [];
      
      return { success: true, flushed: flushed };
      
    } catch (error) {
      Logger.log('[LoggerService] Erro no flush: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Persiste logs na planilha
   * 
   * @private
   * @param {Array<LogEntry>} entries - Entradas a persistir
   */
  LoggerService.prototype._persistToSheet = function(entries) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAMES.LOGS);
      
      if (!sheet) {
        // Cria planilha se não existir
        sheet = ss.insertSheet(SHEET_NAMES.LOGS);
        this._initializeLogSheet(sheet);
      }
      
      // Prepara dados
      var rows = entries.map(function(entry) {
        return [
          entry.timestamp,
          entry.level,
          entry.message,
          entry.source || '',
          JSON.stringify(entry.context || {}),
          entry.userId || '',
          entry.environment || ''
        ];
      });
      
      // Adiciona linhas
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
      }
      
      // Rotação automática se necessário
      this._rotateLogsIfNeeded(sheet);
      
    } catch (error) {
      Logger.log('[LoggerService] Erro ao persistir: ' + error.message);
    }
  };
  
  /**
   * Inicializa planilha de logs
   * 
   * @private
   * @param {Sheet} sheet - Planilha
   */
  LoggerService.prototype._initializeLogSheet = function(sheet) {
    var headers = ['Timestamp', 'Level', 'Message', 'Source', 'Context', 'User', 'Environment'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  };
  
  /**
   * Rotaciona logs se necessário
   * 
   * @private
   * @param {Sheet} sheet - Planilha
   */
  LoggerService.prototype._rotateLogsIfNeeded = function(sheet) {
    try {
      var maxRows = 10000;
      var currentRows = sheet.getLastRow();
      
      if (currentRows > maxRows) {
        // Remove linhas antigas (mantém header + últimas 5000)
        var rowsToDelete = currentRows - 5000 - 1;
        if (rowsToDelete > 0) {
          sheet.deleteRows(2, rowsToDelete);
          Logger.log('[LoggerService] Rotação: ' + rowsToDelete + ' linhas removidas');
        }
      }
    } catch (error) {
      Logger.log('[LoggerService] Erro na rotação: ' + error.message);
    }
  };
  
  /**
   * Obtém estatísticas de logs
   * 
   * @return {Object} Estatísticas
   */
  LoggerService.prototype.getStats = function() {
    return {
      total: this.stats.total,
      byLevel: this.stats.byLevel,
      bySource: this.stats.bySource,
      bufferSize: this.buffer.length,
      minLevel: this.minLevel
    };
  };
  
  /**
   * Busca logs por filtros
   * 
   * @param {Object} filters - Filtros
   * @param {string} [filters.level] - Nível
   * @param {string} [filters.source] - Fonte
   * @param {number} [filters.limit] - Limite de resultados
   * @return {Array<LogEntry>} Logs encontrados
   */
  LoggerService.prototype.search = function(filters) {
    filters = filters || {};
    var limit = filters.limit || 100;
    
    var results = this.buffer.filter(function(entry) {
      if (filters.level && entry.level !== filters.level) {
        return false;
      }
      if (filters.source && entry.source !== filters.source) {
        return false;
      }
      return true;
    });
    
    return results.slice(-limit);
  };
  
  /**
   * Limpa buffer
   */
  LoggerService.prototype.clear = function() {
    this.buffer = [];
    Logger.log('[LoggerService] Buffer limpo');
  };
  
  /**
   * Define nível mínimo de log
   * 
   * @param {string} level - Nível mínimo
   */
  LoggerService.prototype.setMinLevel = function(level) {
    this.minLevel = level;
    Logger.log('[LoggerService] Nível mínimo alterado para: ' + level);
  };
  
  return LoggerService;
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

/**
 * Obtém instância global do logger
 * 
 * @return {LoggerService}
 */
function getLogger() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getLoggerService();
  }
  
  // Fallback: cria instância local
  if (typeof globalThis._logger === 'undefined') {
    globalThis._logger = new LoggerService();
  }
  return globalThis._logger;
}

/**
 * Log rápido de info (wrapper)
 * 
 * @param {string} message - Mensagem
 * @param {Object} [context] - Contexto
 */
function logInfo(message, context) {
  getLogger().info(message, context);
}

/**
 * Log rápido de erro (wrapper)
 * 
 * @param {string} message - Mensagem
 * @param {Object} [context] - Contexto
 */
function logError(message, context) {
  getLogger().error(message, context);
}

/**
 * Log rápido de warning (wrapper)
 * 
 * @param {string} message - Mensagem
 * @param {Object} [context] - Contexto
 */
function logWarn(message, context) {
  getLogger().warn(message, context);
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa LoggerService
 * 
 * @return {Object} Resultado dos testes
 */
function testLoggerService() {
  Logger.log('🧪 Testando LoggerService...\n');
  
  try {
    // Criar logger
    var logger = new LoggerService({
      minLevel: LogLevel.DEBUG,
      persistToSheet: false,
      consoleOutput: true
    });
    
    // Teste 1: Logs de diferentes níveis
    Logger.log('Teste 1: Diferentes níveis');
    logger.debug('Mensagem de debug', { test: 1 });
    logger.info('Mensagem de info', { test: 2 });
    logger.warn('Mensagem de warning', { test: 3 });
    logger.error('Mensagem de erro', { test: 4 });
    logger.critical('Mensagem crítica', { test: 5 });
    
    // Teste 2: Estatísticas
    Logger.log('\nTeste 2: Estatísticas');
    var stats = logger.getStats();
    Logger.log('Total de logs: ' + stats.total);
    Logger.log('Por nível: ' + JSON.stringify(stats.byLevel));
    
    // Teste 3: Busca
    Logger.log('\nTeste 3: Busca');
    var errors = logger.search({ level: LogLevel.ERROR });
    Logger.log('Erros encontrados: ' + errors.length);
    
    // Teste 4: Flush
    Logger.log('\nTeste 4: Flush');
    var flushResult = logger.flush();
    Logger.log('Flushed: ' + flushResult.flushed + ' logs');
    
    // Teste 5: Wrappers globais
    Logger.log('\nTeste 5: Wrappers globais');
    logInfo('Teste de wrapper info');
    logWarn('Teste de wrapper warn');
    logError('Teste de wrapper error');
    
    Logger.log('\n✅ Testes concluídos!');
    
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


