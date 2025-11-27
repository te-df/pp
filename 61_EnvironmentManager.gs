/**
 * @file EnvironmentManager.gs
 * @description Gerenciamento centralizado de ambiente e configurações
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo gerencia configurações de ambiente (development, staging, production),
 * variáveis de ambiente, e configurações dinâmicas do sistema.
 * 
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// ENVIRONMENT MANAGER - GERENCIAMENTO DE AMBIENTE
// ============================================================================

/**
 * @namespace EnvironmentManager
 * @description Gerenciador de ambiente e configurações
 */
var EnvironmentManager = (function() {
  
  /**
   * @enum {string}
   * @description Ambientes disponíveis
   * @readonly
   */
  var Environment = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
  };
  
  /**
   * @private
   * @type {string}
   */
  var currentEnvironment = null;
  
  /**
   * @private
   * @type {Object}
   */
  var environmentConfig = {};
  
  /**
   * @private
   * @type {PropertiesService.Properties}
   */
  var properties = PropertiesService.getScriptProperties();
  
  return {
    /**
     * Inicializa o gerenciador de ambiente
     * 
     * Detecta ambiente atual e carrega configurações apropriadas.
     * 
     * @memberof EnvironmentManager
     * @return {Object} Configuração carregada
     * 
     * @example
     * EnvironmentManager.initialize();
     * 
     * @since 1.0.0
     */
    initialize: function() {
      try {
        // Detecta ambiente
        currentEnvironment = this._detectEnvironment();
        
        // Carrega configurações
        environmentConfig = this._loadEnvironmentConfig(currentEnvironment);
        
        Logger.log('[EnvironmentManager] Inicializado: ' + currentEnvironment);
        
        return {
          success: true,
          environment: currentEnvironment,
          config: environmentConfig
        };
        
      } catch (error) {
        Logger.log('[EnvironmentManager] Erro na inicialização: ' + error.message);
        return {
          success: false,
          error: error.message
        };
      }
    },
    
    /**
     * Obtém ambiente atual
     * 
     * @memberof EnvironmentManager
     * @return {string} Ambiente atual (development, staging, production)
     * 
     * @example
     * var env = EnvironmentManager.getEnvironment();
     * console.log('Ambiente:', env);  // 'production'
     * 
     * @since 1.0.0
     */
    getEnvironment: function() {
      if (!currentEnvironment) {
        this.initialize();
      }
      return currentEnvironment;
    },
    
    /**
     * Define ambiente manualmente
     * 
     * @memberof EnvironmentManager
     * @param {string} env - Ambiente (development, staging, production)
     * @throws {Error} Se ambiente inválido
     * 
     * @example
     * EnvironmentManager.setEnvironment('production');
     * 
     * @since 1.0.0
     */
    setEnvironment: function(env) {
      if (!Environment[env.toUpperCase()]) {
        throw new Error('Ambiente inválido: ' + env);
      }
      
      currentEnvironment = env;
      properties.setProperty('ENVIRONMENT', env);
      
      // Recarrega configurações
      environmentConfig = this._loadEnvironmentConfig(env);
      
      Logger.log('[EnvironmentManager] Ambiente alterado para: ' + env);
    },
    
    /**
     * Verifica se está em produção
     * 
     * @memberof EnvironmentManager
     * @return {boolean} true se produção
     * 
     * @example
     * if (EnvironmentManager.isProduction()) {
     *   // Código específico de produção
     * }
     * 
     * @since 1.0.0
     */
    isProduction: function() {
      return this.getEnvironment() === Environment.PRODUCTION;
    },
    
    /**
     * Verifica se está em desenvolvimento
     * 
     * @memberof EnvironmentManager
     * @return {boolean} true se desenvolvimento
     * 
     * @since 1.0.0
     */
    isDevelopment: function() {
      return this.getEnvironment() === Environment.DEVELOPMENT;
    },
    
    /**
     * Verifica se está em staging
     * 
     * @memberof EnvironmentManager
     * @return {boolean} true se staging
     * 
     * @since 1.0.0
     */
    isStaging: function() {
      return this.getEnvironment() === Environment.STAGING;
    },
    
    /**
     * Obtém variável de ambiente
     * 
     * @memberof EnvironmentManager
     * @param {string} key - Chave da variável
     * @param {*} [defaultValue] - Valor padrão se não encontrado
     * @return {string|null} Valor da variável
     * 
     * @example
     * var apiKey = EnvironmentManager.get('GEMINI_API_KEY');
     * var timeout = EnvironmentManager.get('TIMEOUT', 5000);
     * 
     * @since 1.0.0
     */
    get: function(key, defaultValue) {
      // Tenta obter de properties
      var value = properties.getProperty(key);
      
      if (value !== null) {
        return value;
      }
      
      // Tenta obter de environmentConfig
      if (environmentConfig && environmentConfig[key] !== undefined) {
        return environmentConfig[key];
      }
      
      // Retorna valor padrão
      return defaultValue !== undefined ? defaultValue : null;
    },
    
    /**
     * Define variável de ambiente
     * 
     * @memberof EnvironmentManager
     * @param {string} key - Chave da variável
     * @param {string} value - Valor da variável
     * 
     * @example
     * EnvironmentManager.set('GEMINI_API_KEY', 'abc123');
     * 
     * @since 1.0.0
     */
    set: function(key, value) {
      properties.setProperty(key, String(value));
      Logger.log('[EnvironmentManager] Variável definida: ' + key);
    },
    
    /**
     * Remove variável de ambiente
     * 
     * @memberof EnvironmentManager
     * @param {string} key - Chave da variável
     * 
     * @since 1.0.0
     */
    remove: function(key) {
      properties.deleteProperty(key);
      Logger.log('[EnvironmentManager] Variável removida: ' + key);
    },
    
    /**
     * Lista todas as variáveis de ambiente
     * 
     * @memberof EnvironmentManager
     * @return {Object} Objeto com todas as variáveis
     * 
     * @example
     * var vars = EnvironmentManager.listAll();
     * console.log('Variáveis:', Object.keys(vars));
     * 
     * @since 1.0.0
     */
    listAll: function() {
      return properties.getProperties();
    },
    
    /**
     * Obtém configuração do ambiente atual
     * 
     * @memberof EnvironmentManager
     * @return {Object} Configuração completa
     * 
     * @since 1.0.0
     */
    getConfiguration: function() {
      if (!environmentConfig) {
        this.initialize();
      }
      return environmentConfig;
    },
    
    /**
     * Valida configuração do ambiente
     * 
     * Verifica se todas as variáveis obrigatórias estão definidas.
     * 
     * @memberof EnvironmentManager
     * @return {Object} Resultado da validação
     * @return {boolean} return.valid - Se configuração válida
     * @return {Array<string>} return.missing - Variáveis faltando
     * @return {Array<string>} return.warnings - Avisos
     * 
     * @example
     * var validation = EnvironmentManager.validate();
     * if (!validation.valid) {
     *   console.log('Faltando:', validation.missing);
     * }
     * 
     * @since 1.0.0
     */
    validate: function() {
      var result = {
        valid: true,
        missing: [],
        warnings: []
      };
      
      // Variáveis obrigatórias
      var required = [
        'SPREADSHEET_ID',
        'ENVIRONMENT'
      ];
      
      // Variáveis recomendadas
      var recommended = [
        'BACKUP_FOLDER_ID',
        'LOGGING_ENABLED'
      ];
      
      // Verifica obrigatórias
      required.forEach(function(key) {
        if (!this.get(key)) {
          result.valid = false;
          result.missing.push(key);
        }
      }.bind(this));
      
      // Verifica recomendadas
      recommended.forEach(function(key) {
        if (!this.get(key)) {
          result.warnings.push(key + ' não definido (recomendado)');
        }
      }.bind(this));
      
      return result;
    },
    
    /**
     * Detecta ambiente atual
     * 
     * @private
     * @memberof EnvironmentManager
     * @return {string} Ambiente detectado
     */
    _detectEnvironment: function() {
      // Tenta obter de properties
      var env = properties.getProperty('ENVIRONMENT');
      
      if (env) {
        return env;
      }
      
      // Tenta obter de BOOTSTRAP_CONFIG
      if (typeof BOOTSTRAP_CONFIG !== 'undefined' && BOOTSTRAP_CONFIG.ENVIRONMENT) {
        return BOOTSTRAP_CONFIG.ENVIRONMENT;
      }
      
      // Tenta obter de CORE_CONFIG
      if (typeof CORE_CONFIG !== 'undefined' && CORE_CONFIG.system && CORE_CONFIG.system.ENVIRONMENT) {
        return CORE_CONFIG.system.ENVIRONMENT;
      }
      
      // Padrão: production
      return Environment.PRODUCTION;
    },
    
    /**
     * Carrega configuração do ambiente
     * 
     * @private
     * @memberof EnvironmentManager
     * @param {string} env - Ambiente
     * @return {Object} Configuração
     */
    _loadEnvironmentConfig: function(env) {
      var config = {
        environment: env,
        debug: env !== Environment.PRODUCTION,
        logging: true,
        telemetry: env === Environment.PRODUCTION,
        cacheEnabled: true,
        cacheDuration: 300,
        maxRetries: 3,
        timeout: 30000
      };
      
      // Configurações específicas por ambiente
      switch (env) {
        case Environment.DEVELOPMENT:
          config.debug = true;
          config.logging = true;
          config.telemetry = false;
          config.cacheDuration = 60;
          break;
          
        case Environment.STAGING:
          config.debug = true;
          config.logging = true;
          config.telemetry = true;
          config.cacheDuration = 180;
          break;
          
        case Environment.PRODUCTION:
          config.debug = false;
          config.logging = true;
          config.telemetry = true;
          config.cacheDuration = 300;
          break;
      }
      
      return config;
    },
    
    /**
     * Imprime informações do ambiente
     * 
     * @memberof EnvironmentManager
     * 
     * @since 1.0.0
     */
    printInfo: function() {
      Logger.log('='.repeat(60));
      Logger.log('ENVIRONMENT MANAGER - INFORMAÇÕES');
      Logger.log('='.repeat(60));
      Logger.log('Ambiente: ' + this.getEnvironment());
      Logger.log('Produção: ' + this.isProduction());
      Logger.log('Debug: ' + this.getConfiguration().debug);
      Logger.log('Logging: ' + this.getConfiguration().logging);
      Logger.log('Telemetry: ' + this.getConfiguration().telemetry);
      Logger.log('');
      
      var validation = this.validate();
      Logger.log('Validação:');
      Logger.log('  Válido: ' + validation.valid);
      
      if (validation.missing.length > 0) {
        Logger.log('  Faltando: ' + validation.missing.join(', '));
      }
      
      if (validation.warnings.length > 0) {
        Logger.log('  Avisos: ' + validation.warnings.length);
      }
      
      Logger.log('='.repeat(60));
    }
  };
})();

// ============================================================================
// CONFIGURATION LOADER - CARREGADOR DE CONFIGURAÇÕES
// ============================================================================

/**
 * @namespace ConfigLoader
 * @description Carregador de configurações de múltiplas fontes
 */
var ConfigLoader = (function() {
  
  return {
    /**
     * Carrega configuração de múltiplas fontes
     * 
     * Ordem de precedência:
     * 1. PropertiesService (mais alta)
     * 2. CORE_CONFIG
     * 3. BOOTSTRAP_CONFIG
     * 4. Valor padrão (mais baixa)
     * 
     * @memberof ConfigLoader
     * @param {string} key - Chave da configuração
     * @param {*} [defaultValue] - Valor padrão
     * @return {*} Valor da configuração
     * 
     * @example
     * var timeout = ConfigLoader.load('TIMEOUT', 5000);
     * 
     * @since 1.0.0
     */
    load: function(key, defaultValue) {
      // 1. PropertiesService
      var value = EnvironmentManager.get(key);
      if (value !== null) {
        return this._parseValue(value);
      }
      
      // 2. CORE_CONFIG
      if (typeof CORE_CONFIG !== 'undefined') {
        value = this._getFromObject(CORE_CONFIG, key);
        if (value !== undefined) {
          return value;
        }
      }
      
      // 3. BOOTSTRAP_CONFIG
      if (typeof BOOTSTRAP_CONFIG !== 'undefined') {
        value = this._getFromObject(BOOTSTRAP_CONFIG, key);
        if (value !== undefined) {
          return value;
        }
      }
      
      // 4. Valor padrão
      return defaultValue;
    },
    
    /**
     * Carrega múltiplas configurações
     * 
     * @memberof ConfigLoader
     * @param {Array<string>} keys - Array de chaves
     * @return {Object} Objeto com configurações
     * 
     * @example
     * var config = ConfigLoader.loadMultiple(['TIMEOUT', 'MAX_RETRIES']);
     * 
     * @since 1.0.0
     */
    loadMultiple: function(keys) {
      var result = {};
      
      keys.forEach(function(key) {
        result[key] = this.load(key);
      }.bind(this));
      
      return result;
    },
    
    /**
     * Carrega configuração com validação
     * 
     * @memberof ConfigLoader
     * @param {string} key - Chave
     * @param {Object} options - Opções
     * @param {*} [options.default] - Valor padrão
     * @param {boolean} [options.required] - Se obrigatório
     * @param {string} [options.type] - Tipo esperado
     * @return {*} Valor
     * @throws {Error} Se obrigatório e não encontrado
     * 
     * @since 1.0.0
     */
    loadWithValidation: function(key, options) {
      options = options || {};
      
      var value = this.load(key, options.default);
      
      // Verifica se obrigatório
      if (options.required && (value === null || value === undefined)) {
        throw new Error('Configuração obrigatória não encontrada: ' + key);
      }
      
      // Verifica tipo
      if (options.type && value !== null && value !== undefined) {
        var actualType = typeof value;
        if (actualType !== options.type) {
          throw new Error('Tipo incorreto para ' + key + '. Esperado: ' + options.type + ', Recebido: ' + actualType);
        }
      }
      
      return value;
    },
    
    /**
     * Obtém valor de objeto aninhado
     * 
     * @private
     * @param {Object} obj - Objeto
     * @param {string} key - Chave (pode ser aninhada com .)
     * @return {*} Valor
     */
    _getFromObject: function(obj, key) {
      // Suporta chaves aninhadas: 'system.VERSION'
      var keys = key.split('.');
      var value = obj;
      
      for (var i = 0; i < keys.length; i++) {
        if (value === null || value === undefined) {
          return undefined;
        }
        value = value[keys[i]];
      }
      
      return value;
    },
    
    /**
     * Converte string para tipo apropriado
     * 
     * @private
     * @param {string} value - Valor string
     * @return {*} Valor convertido
     */
    _parseValue: function(value) {
      if (typeof value !== 'string') {
        return value;
      }
      
      // Boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      
      // Number
      if (!isNaN(value) && value !== '') {
        return Number(value);
      }
      
      // JSON
      if ((value.startsWith('{') && value.endsWith('}')) ||
          (value.startsWith('[') && value.endsWith(']'))) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // Não é JSON válido, retorna string
        }
      }
      
      return value;
    }
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

/**
 * Obtém variável de ambiente (wrapper)
 * 
 * @param {string} key - Chave
 * @param {*} [defaultValue] - Valor padrão
 * @return {*} Valor
 * 
 * @example
 * var apiKey = getEnv('GEMINI_API_KEY');
 * 
 * @since 1.0.0
 */
function getEnv(key, defaultValue) {
  return EnvironmentManager.get(key, defaultValue);
}

/**
 * Define variável de ambiente (wrapper)
 * 
 * @param {string} key - Chave
 * @param {string} value - Valor
 * 
 * @example
 * setEnv('DEBUG_MODE', 'true');
 * 
 * @since 1.0.0
 */
function setEnv(key, value) {
  EnvironmentManager.set(key, value);
}

/**
 * Verifica se está em produção (wrapper)
 * 
 * @return {boolean}
 * 
 * @example
 * if (isProduction()) {
 *   // código de produção
 * }
 * 
 * @since 1.0.0
 */
function isProduction() {
  return EnvironmentManager.isProduction();
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa EnvironmentManager
 * 
 * @return {Object} Resultado dos testes
 * 
 * @since 1.0.0
 */
function testEnvironmentManager() {
  Logger.log('🧪 Testando EnvironmentManager...\n');
  
  try {
    // Teste 1: Inicializar
    Logger.log('Teste 1: Inicializar');
    var init = EnvironmentManager.initialize();
    Logger.log('Inicializado: ' + init.success);
    Logger.log('Ambiente: ' + init.environment);
    
    // Teste 2: Obter ambiente
    Logger.log('\nTeste 2: Obter ambiente');
    var env = EnvironmentManager.getEnvironment();
    Logger.log('Ambiente atual: ' + env);
    
    // Teste 3: Verificar produção
    Logger.log('\nTeste 3: Verificar produção');
    Logger.log('É produção: ' + EnvironmentManager.isProduction());
    
    // Teste 4: Get/Set
    Logger.log('\nTeste 4: Get/Set');
    EnvironmentManager.set('TEST_VAR', 'test_value');
    var value = EnvironmentManager.get('TEST_VAR');
    Logger.log('Valor definido e recuperado: ' + (value === 'test_value'));
    
    // Teste 5: Validar
    Logger.log('\nTeste 5: Validar configuração');
    var validation = EnvironmentManager.validate();
    Logger.log('Válido: ' + validation.valid);
    
    // Teste 6: ConfigLoader
    Logger.log('\nTeste 6: ConfigLoader');
    var config = ConfigLoader.load('ENVIRONMENT', 'default');
    Logger.log('Config carregado: ' + config);
    
    Logger.log('\n✅ Testes concluídos!');
    
    return {
      success: true,
      environment: env,
      validation: validation
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
