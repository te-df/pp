/**
 * @file RetryService.gs
 * @description Sistema de retry com backoff exponencial
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Implementa retry automático para operações que podem falhar temporariamente:
 * - Chamadas a APIs externas
 * - Operações de rede
 * - Operações de planilha em momentos de alta carga
 * - Operações de Drive
 */

// ============================================================================
// CONFIGURAÇÃO DE RETRY
// ============================================================================

/**
 * @const {Object} RETRY_CONFIG
 * @description Configuração do sistema de retry
 */
var RETRY_CONFIG = {
  // Número máximo de tentativas
  MAX_RETRIES: 3,
  
  // Delay inicial em ms
  INITIAL_DELAY: 1000,
  
  // Multiplicador para backoff exponencial
  BACKOFF_MULTIPLIER: 2,
  
  // Delay máximo em ms
  MAX_DELAY: 30000,
  
  // Jitter (aleatoriedade) para evitar thundering herd
  JITTER: true,
  
  // Erros que devem ser retentados
  RETRYABLE_ERRORS: [
    'Service invoked too many times',
    'Rate limit exceeded',
    'Timeout',
    'Service unavailable',
    'Internal error',
    'Temporary failure',
    'Lock wait timeout',
    'Connection timeout',
    'Network error'
  ]
};

// ============================================================================
// RETRY SERVICE - SERVIÇO DE RETRY
// ============================================================================

/**
 * @class RetryService
 * @description Serviço de retry com backoff exponencial
 */
var RetryService = (function() {
  
  /**
   * Construtor do RetryService
   * 
   * @constructor
   * @param {Object} [options] - Opções
   */
  function RetryService(options) {
    options = options || {};
    
    this.maxRetries = options.maxRetries || RETRY_CONFIG.MAX_RETRIES;
    this.initialDelay = options.initialDelay || RETRY_CONFIG.INITIAL_DELAY;
    this.backoffMultiplier = options.backoffMultiplier || RETRY_CONFIG.BACKOFF_MULTIPLIER;
    this.maxDelay = options.maxDelay || RETRY_CONFIG.MAX_DELAY;
    this.jitter = options.jitter !== false;
    
    // Estatísticas
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      retries: 0
    };
  }
  
  /**
   * Executa operação com retry
   * 
   * @param {Function} operation - Operação a executar
   * @param {Object} [options] - Opções
   * @return {*} Resultado da operação
   * 
   * @example
   * var result = retry.execute(function() {
   *   return UrlFetchApp.fetch(url);
   * });
   */
  RetryService.prototype.execute = function(operation, options) {
    options = options || {};
    var maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.maxRetries;
    var onRetry = options.onRetry;
    
    if (typeof operation !== 'function') {
      throw new Error('RetryService.execute: operation must be a function');
    }
    
    var attempt = 0;
    var lastError = null;
    
    while (attempt <= maxRetries) {
      try {
        this.stats.attempts++;
        
        // Executa operação
        var result = operation();
        
        // Sucesso
        this.stats.successes++;
        return result;
        
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Se atingiu máximo de tentativas, lança erro
        if (attempt > maxRetries) {
          this.stats.failures++;
          throw error;
        }
        
        // Verifica se erro é retryable
        if (!this._isRetryableError(error)) {
          this.stats.failures++;
          throw error;
        }
        
        // Calcula delay
        var delay = this._calculateDelay(attempt);
        
        // Callback de retry
        if (onRetry && typeof onRetry === 'function') {
          onRetry(attempt, delay, error);
        }
        
        // Log
        try {
          getLogger().warn('Retry attempt ' + attempt + '/' + maxRetries, {
            delay: delay,
            error: error.message
          });
        } catch (e) {
          Logger.log('⚠️ Retry attempt ' + attempt + '/' + maxRetries + ' (delay: ' + delay + 'ms)');
        }
        
        // Aguarda antes de tentar novamente
        Utilities.sleep(delay);
        
        this.stats.retries++;
      }
    }
    
    // Não deveria chegar aqui, mas por segurança
    this.stats.failures++;
    throw lastError;
  };
  
  /**
   * Executa operação com retry (Promise-based)
   * 
   * @param {Function} operation - Operação que retorna Promise
   * @param {Object} [options] - Opções
   * @return {Promise} Promise com resultado
   * 
   * @example
   * retry.executeAsync(function() {
   *   return fetch(url);
   * }).then(result => console.log(result));
   */
  RetryService.prototype.executeAsync = function(operation, options) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
      try {
        var result = self.execute(operation, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  /**
   * Executa múltiplas operações com retry
   * 
   * @param {Array<Function>} operations - Array de operações
   * @param {Object} [options] - Opções
   * @return {Array} Array de resultados
   * 
   * @example
   * var results = retry.executeBatch([
   *   function() { return fetchData1(); },
   *   function() { return fetchData2(); }
   * ]);
   */
  RetryService.prototype.executeBatch = function(operations, options) {
    var self = this;
    var results = [];
    
    for (var i = 0; i < operations.length; i++) {
      try {
        var result = self.execute(operations[i], options);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  };
  
  /**
   * Wrapper para UrlFetchApp.fetch com retry
   * 
   * @param {string} url - URL
   * @param {Object} [params] - Parâmetros
   * @param {Object} [options] - Opções de retry
   * @return {HTTPResponse} Resposta
   * 
   * @example
   * var response = retry.fetch('https://api.example.com/data');
   */
  RetryService.prototype.fetch = function(url, params, options) {
    return this.execute(function() {
      return UrlFetchApp.fetch(url, params);
    }, options);
  };
  
  /**
   * Wrapper para operações de planilha com retry
   * 
   * @param {Function} operation - Operação de planilha
   * @param {Object} [options] - Opções de retry
   * @return {*} Resultado
   * 
   * @example
   * var data = retry.sheetOperation(function() {
   *   return sheet.getDataRange().getValues();
   * });
   */
  RetryService.prototype.sheetOperation = function(operation, options) {
    return this.execute(operation, options);
  };
  
  /**
   * Wrapper para operações de Drive com retry
   * 
   * @param {Function} operation - Operação de Drive
   * @param {Object} [options] - Opções de retry
   * @return {*} Resultado
   * 
   * @example
   * var file = retry.driveOperation(function() {
   *   return DriveApp.createFile('test.txt', 'content');
   * });
   */
  RetryService.prototype.driveOperation = function(operation, options) {
    return this.execute(operation, options);
  };
  
  /**
   * Calcula delay com backoff exponencial
   * 
   * @private
   * @param {number} attempt - Número da tentativa
   * @return {number} Delay em ms
   */
  RetryService.prototype._calculateDelay = function(attempt) {
    // Backoff exponencial: delay = initialDelay * (multiplier ^ (attempt - 1))
    var delay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    
    // Limita ao máximo
    delay = Math.min(delay, this.maxDelay);
    
    // Adiciona jitter (aleatoriedade)
    if (this.jitter) {
      var jitterAmount = delay * 0.1; // 10% de jitter
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    }
    
    return Math.floor(delay);
  };
  
  /**
   * Verifica se erro é retryable
   * 
   * @private
   * @param {Error} error - Erro
   * @return {boolean}
   */
  RetryService.prototype._isRetryableError = function(error) {
    var message = error.message || error.toString();
    
    for (var i = 0; i < RETRY_CONFIG.RETRYABLE_ERRORS.length; i++) {
      if (message.indexOf(RETRY_CONFIG.RETRYABLE_ERRORS[i]) !== -1) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Obtém estatísticas
   * 
   * @return {Object} Estatísticas
   */
  RetryService.prototype.getStats = function() {
    var successRate = this.stats.attempts > 0
      ? ((this.stats.successes / this.stats.attempts) * 100).toFixed(2)
      : 0;
    
    return {
      attempts: this.stats.attempts,
      successes: this.stats.successes,
      failures: this.stats.failures,
      retries: this.stats.retries,
      successRate: successRate + '%'
    };
  };
  
  /**
   * Reseta estatísticas
   */
  RetryService.prototype.resetStats = function() {
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      retries: 0
    };
  };
  
  return RetryService;
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

// Função getRetryService() movida para ServiceManager.gs

/**
 * Executa operação com retry (wrapper)
 * 
 * @param {Function} operation - Operação
 * @param {Object} [options] - Opções
 * @return {*} Resultado
 */
function retryOperation(operation, options) {
  return getRetryService().execute(operation, options);
}

/**
 * Fetch com retry (wrapper)
 * 
 * @param {string} url - URL
 * @param {Object} [params] - Parâmetros
 * @return {HTTPResponse} Resposta
 */
function retryFetch(url, params) {
  return getRetryService().fetch(url, params);
}

/**
 * Operação de planilha com retry (wrapper)
 * 
 * @param {Function} operation - Operação
 * @return {*} Resultado
 */
function retrySheetOperation(operation) {
  return getRetryService().sheetOperation(operation);
}

// ============================================================================
// DECORATORS - DECORADORES PARA FUNÇÕES
// ============================================================================

/**
 * Decorator para adicionar retry a uma função
 * 
 * @param {Function} fn - Função original
 * @param {Object} [options] - Opções de retry
 * @return {Function} Função com retry
 * 
 * @example
 * var fetchDataWithRetry = withRetry(fetchData, { maxRetries: 5 });
 */
function withRetry(fn, options) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var retry = getRetryService();
    
    return retry.execute(function() {
      return fn.apply(null, args);
    }, options);
  };
}



// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa RetryService
 */
function testRetryService() {
  Logger.log('🧪 Testando RetryService...\n');
  
  try {
    var retry = new RetryService({ maxRetries: 3 });
    
    // Teste 1: Operação que falha 2 vezes e depois sucede
    Logger.log('Teste 1: Operação com falhas temporárias');
    var attempts = 0;
    var result = retry.execute(function() {
      attempts++;
      if (attempts < 3) {
        throw new Error('Service invoked too many times');
      }
      return 'Sucesso!';
    });
    Logger.log('✓ Resultado: ' + result + ' (tentativas: ' + attempts + ')');
    
    // Teste 2: Operação que sempre falha
    Logger.log('\nTeste 2: Operação que sempre falha');
    try {
      retry.execute(function() {
        throw new Error('Service invoked too many times');
      });
    } catch (error) {
      Logger.log('✓ Erro capturado após todas as tentativas: ' + error.message);
    }
    
    // Teste 3: Erro não-retryable
    Logger.log('\nTeste 3: Erro não-retryable');
    try {
      retry.execute(function() {
        throw new Error('Invalid parameter');
      });
    } catch (error) {
      Logger.log('✓ Erro não-retryable lançado imediatamente: ' + error.message);
    }
    
    // Teste 4: Estatísticas
    Logger.log('\nTeste 4: Estatísticas');
    var stats = retry.getStats();
    Logger.log('✓ Stats: ' + JSON.stringify(stats, null, 2));
    
    // Teste 5: Wrapper
    Logger.log('\nTeste 5: Wrapper');
    var wrapperResult = retryOperation(function() {
      return 'Wrapper funcionando!';
    });
    Logger.log('✓ Wrapper: ' + wrapperResult);
    
    // Teste 6: Decorator
    Logger.log('\nTeste 6: Decorator');
    var testFn = function(x) { return x * 2; };
    var testFnWithRetry = withRetry(testFn);
    var decoratorResult = testFnWithRetry(5);
    Logger.log('✓ Decorator: ' + decoratorResult);
    
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


