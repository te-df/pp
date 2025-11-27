/**
 * ErrorHandler.gs
 * Centralized error handling for the application.
 */

/**
 * Handler centralizado de erros
 */
class ErrorHandler {
  /**
   * Códigos de erro amigáveis
   */
  static get FRIENDLY_ERRORS() {
    return {
      UNKNOWN: {
        code: 'ERR_001',
        message: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
      },
      NETWORK: {
        code: 'ERR_002',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.'
      },
      PERMISSION: {
        code: 'ERR_003',
        message: 'Você não tem permissão para realizar esta ação.'
      },
      VALIDATION: {
        code: 'ERR_004',
        message: 'Dados inválidos. Verifique os campos e tente novamente.'
      },
      NOT_FOUND: {
        code: 'ERR_005',
        message: 'O recurso solicitado não foi encontrado.'
      },
      TIMEOUT: {
        code: 'ERR_006',
        message: 'A operação demorou muito para responder. Tente novamente.'
      },
      AUTH: {
        code: 'ERR_007',
        message: 'Sessão expirada ou inválida. Faça login novamente.'
      }
    };
  }

  /**
   * Processa erro e retorna resposta padronizada e sanitizada
   * @param {string} context - Contexto onde o erro ocorreu
   * @param {Error} error - Objeto de erro
   * @param {Object} additionalInfo - Informações adicionais
   * @returns {Object} Resposta de erro padronizada para o cliente
   */
  static handle(context, error, additionalInfo = {}) {
    // Garante que error não seja undefined ou null
    if (!error) {
      error = new Error('Erro não especificado');
    }
    
    // Se error não for um objeto Error, converte para string
    if (typeof error === 'string') {
      error = new Error(error);
    }
    
    // Determina o tipo de erro e mensagem amigável
    const errorType = error.type || ERROR_TYPES.UNKNOWN;
    const friendlyError = this.getFriendlyError(errorType, error.message);
    
    // Constrói objeto de erro técnico (para logs)
    const technicalError = {
      success: false,
      context: context,
      message: error.message || error.toString(),
      stack: error.stack,
      type: errorType,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };
    
    // Log estruturado (apenas no backend/console do servidor)
    this.log(technicalError, error);
    
    // Retorna objeto sanitizado para o cliente
    return {
      success: false,
      message: friendlyError.message, // Mensagem amigável para o usuário
      code: friendlyError.code,       // Código de erro amigável
      type: errorType,
      // Detalhes técnicos são enviados mas o frontend decide se mostra (console) ou não (toast)
      // Em produção, podemos querer remover isso completamente para o cliente final
      technical: ENV_CONFIG.DEBUG_MODE ? `[${context}] ${technicalError.message}` : null
    };
  }
  
  /**
   * Obtém mensagem amigável baseada no tipo ou mensagem original
   */
  static getFriendlyError(type, originalMessage) {
    // Se a mensagem original já for amigável (marcada explicitamente), usa ela
    if (originalMessage && originalMessage.startsWith('::')) {
      return {
        code: 'MSG_CUSTOM',
        message: originalMessage.substring(2)
      };
    }

    switch (type) {
      case ERROR_TYPES.PERMISSION:
        return this.FRIENDLY_ERRORS.PERMISSION;
      case ERROR_TYPES.VALIDATION:
        return this.FRIENDLY_ERRORS.VALIDATION;
      case ERROR_TYPES.NOT_FOUND:
        return this.FRIENDLY_ERRORS.NOT_FOUND;
      case ERROR_TYPES.AUTH:
        return this.FRIENDLY_ERRORS.AUTH;
      default:
        // Verifica padrões comuns de erro
        const msg = originalMessage ? originalMessage.toLowerCase() : '';
        if (msg.includes('timeout') || msg.includes('tempo limite')) {
          return this.FRIENDLY_ERRORS.TIMEOUT;
        }
        if (msg.includes('network') || msg.includes('conexão') || msg.includes('offline')) {
          return this.FRIENDLY_ERRORS.NETWORK;
        }
        return this.FRIENDLY_ERRORS.UNKNOWN;
    }
  }
  
  /**
   * Log estruturado de erro
   * @param {Object} errorInfo - Informações do erro
   * @param {Error} originalError - Erro original
   */
  static log(errorInfo, originalError) {
    const logEntry = [
      '\n' + '='.repeat(80),
      `❌ ERRO: ${errorInfo.context}`,
      '-'.repeat(80),
      `Mensagem Técnica: ${errorInfo.message}`,
      `Tipo: ${errorInfo.type}`,
      `Status: ${errorInfo.statusCode}`,
      `Timestamp: ${errorInfo.timestamp}`
    ];
    
    if (errorInfo.details && Object.keys(errorInfo.details).length > 0) {
      logEntry.push(`Detalhes: ${JSON.stringify(errorInfo.details, null, 2)}`);
    }
    
    // FASE 2 - MELHORIA: Captura stack trace completo
    if (originalError) {
      if (originalError.stack) {
        logEntry.push(`Stack Trace: ${originalError.stack}`);
      } else {
        // Tenta capturar stack trace se não estiver disponível
        try {
          throw originalError;
        } catch (e) {
          if (e.stack) {
            logEntry.push(`Stack Trace (capturado): ${e.stack}`);
          }
        }
      }
      
      // Captura informações adicionais do erro
      if (originalError.fileName) {
        logEntry.push(`Arquivo: ${originalError.fileName}`);
      }
      if (originalError.lineNumber) {
        logEntry.push(`Linha: ${originalError.lineNumber}`);
      }
      if (originalError.columnNumber) {
        logEntry.push(`Coluna: ${originalError.columnNumber}`);
      }
    }
    
    logEntry.push('='.repeat(80));
    
    // FASE 2 - MELHORIA: Integração robusta com LoggerService
    try {
      // Tenta usar ServiceManager primeiro
      if (typeof ServiceManager !== 'undefined' && ServiceManager.getLoggerService) {
        var logger = ServiceManager.getLoggerService();
        if (logger && typeof logger.error === 'function') {
          logger.error(logEntry.join('\n'), { 
            context: errorInfo.context,
            error: errorInfo.message,
            stack: originalError ? originalError.stack : '',
            type: errorInfo.type,
            statusCode: errorInfo.statusCode
          });
          return; // Sucesso, não precisa de fallback
        }
      }
      
      // Fallback 1: Tenta getLogger() global
      if (typeof getLogger === 'function') {
        var logger2 = getLogger();
        if (logger2 && typeof logger2.error === 'function') {
          logger2.error(logEntry.join('\n'), { 
            error: errorInfo.message,
            stack: originalError ? originalError.stack : '' 
          });
          return;
        }
      }
      
      // Fallback 2: Logger.log nativo
      Logger.log(logEntry.join('\n'));
    } catch (e) {
      // Último recurso: Logger.log direto
      Logger.log(logEntry.join('\n'));
      Logger.log('⚠️  Erro ao usar LoggerService: ' + e.message);
    }
    
    // Grava em planilha de Logs se disponível
    this.logToSheet(errorInfo, originalError);
  }
  
  /**
   * Registra erro na planilha Logs
   * @param {Object} errorInfo - Informações do erro
   * @param {Error} originalError - Erro original para capturar stack trace
   */
  static logToSheet(errorInfo, originalError) {
    try {
      const ss = getSpreadsheet();
      const logsSheet = ss.getSheetByName('Logs');
      
      if (logsSheet) {
        const logId = `LOG-${Date.now()}`;
        const timestamp = new Date();
        const user = Session.getActiveUser().getEmail() || 'sistema';
        
        // FASE 2 - MELHORIA: Inclui stack trace na planilha
        const stackTrace = originalError && originalError.stack 
          ? originalError.stack.substring(0, 500) // Limita tamanho
          : '';
        
        logsSheet.appendRow([
          logId,
          timestamp,
          user,
          'ERRO',
          errorInfo.context,
          errorInfo.message,
          errorInfo.type,
          errorInfo.statusCode,
          stackTrace
        ]);
      }
    } catch (e) {
      // Silenciosamente falha se não conseguir logar na planilha
      try {
        if (typeof ServiceManager !== 'undefined' && ServiceManager.getLoggerService) {
          var logger = ServiceManager.getLoggerService();
          if (logger && typeof logger.warn === 'function') {
            logger.warn(`Não foi possível registrar erro na planilha Logs: ${e.message}`);
          }
        } else if (typeof getLogger === 'function') {
          getLogger().warn(`Não foi possível registrar erro na planilha Logs: ${e.message}`);
        } else {
          Logger.log(`⚠️ Não foi possível registrar erro na planilha Logs: ${e.message}`);
        }
      } catch (err) {
        Logger.log(`⚠️ Não foi possível registrar erro na planilha Logs: ${e.message}`);
      }
    }
  }
  
  /**
   * Cria erro de validação
   */
  static validation(message, details = {}) {
    // Se quiser passar mensagem customizada para o usuário, use o prefixo ::
    return new AppError(message, ERROR_TYPES.VALIDATION, HTTP_STATUS.BAD_REQUEST, details);
  }
  
  /**
   * Cria erro de não encontrado
   */
  static notFound(resource, id = null) {
    const message = id 
      ? `${resource} com ID '${id}' não encontrado`
      : `${resource} não encontrado`;
    return new AppError(message, ERROR_TYPES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  /**
   * Cria erro de permissão
   */
  static permission(action) {
    return new AppError(
      `Permissão negada para: ${action}`,
      ERROR_TYPES.PERMISSION,
      HTTP_STATUS.FORBIDDEN
    );
  }
  
  /**
   * FASE 2 - NOVO: Wrapper para capturar erros assíncronos
   * @param {Function} asyncFn - Função assíncrona
   * @param {string} context - Contexto da operação
   * @return {Function} Função wrapped com tratamento de erro
   */
  static wrapAsync(asyncFn, context) {
    return function() {
      try {
        return asyncFn.apply(this, arguments);
      } catch (error) {
        return ErrorHandler.handle(context, error);
      }
    };
  }
  
  /**
   * FASE 2 - NOVO: Executa função com retry e tratamento de erro
   * @param {Function} fn - Função a executar
   * @param {string} context - Contexto da operação
   * @param {number} maxRetries - Número máximo de tentativas
   * @param {number} delay - Delay entre tentativas (ms)
   * @return {*} Resultado da função ou erro
   */
  static withRetry(fn, context, maxRetries = 3, delay = 1000) {
    var lastError = null;
    
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          Logger.log(`[ErrorHandler] Tentativa ${attempt}/${maxRetries} falhou em ${context}. Tentando novamente em ${delay}ms...`);
          Utilities.sleep(delay);
        }
      }
    }
    
    // Todas as tentativas falharam
    return ErrorHandler.handle(context + ' (após ' + maxRetries + ' tentativas)', lastError);
  }
  
  /**
   * FASE 2 - NOVO: Captura erros de inicialização
   * @param {Function} initFn - Função de inicialização
   * @param {string} serviceName - Nome do serviço
   * @return {Object} {success: boolean, service?: any, error?: any}
   */
  static safeInit(initFn, serviceName) {
    try {
      Logger.log(`[ErrorHandler] Inicializando ${serviceName}...`);
      var service = initFn();
      
      if (!service) {
        throw new Error(`${serviceName} retornou null/undefined`);
      }
      
      Logger.log(`[ErrorHandler] ✅ ${serviceName} inicializado com sucesso`);
      return {
        success: true,
        service: service
      };
    } catch (error) {
      Logger.log(`[ErrorHandler] ❌ Falha ao inicializar ${serviceName}: ${error.message}`);
      
      return {
        success: false,
        error: ErrorHandler.handle(`Inicialização de ${serviceName}`, error)
      };
    }
  }
  
  /**
   * FASE 2 - NOVO: Valida e sanitiza entrada de dados
   * @param {*} data - Dados a validar
   * @param {Object} schema - Esquema de validação
   * @param {string} context - Contexto da validação
   * @return {Object} {valid: boolean, data?: any, error?: any}
   */
  static validateInput(data, schema, context) {
    try {
      // Validação básica
      if (!data) {
        throw new Error('Dados não fornecidos');
      }
      
      if (typeof data !== 'object') {
        throw new Error('Dados devem ser um objeto');
      }
      
      // Valida campos obrigatórios
      if (schema.required) {
        for (var i = 0; i < schema.required.length; i++) {
          var field = schema.required[i];
          if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
            throw ErrorHandler.validation(`Campo obrigatório ausente: ${field}`);
          }
        }
      }
      
      // Valida tipos
      if (schema.types) {
        for (var field in schema.types) {
          if (data.hasOwnProperty(field)) {
            var expectedType = schema.types[field];
            var actualType = typeof data[field];
            
            if (actualType !== expectedType) {
              throw ErrorHandler.validation(`Campo ${field} deve ser do tipo ${expectedType}, recebido ${actualType}`);
            }
          }
        }
      }
      
      return {
        valid: true,
        data: data
      };
    } catch (error) {
      return {
        valid: false,
        error: ErrorHandler.handle(context, error)
      };
    }
  }
}

/**
 * Função helper para backward compatibility
 * @deprecated Use ErrorHandler.handle() ao invés
 */
function handleError(context, error) {
  return ErrorHandler.handle(context, error);
}
