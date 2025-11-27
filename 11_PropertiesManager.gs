/**
 * @file PropertiesManager.gs
 * @description Gerenciador centralizado de propriedades persistentes
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Gerencia configurações persistentes usando PropertiesService:
 * - Configurações do sistema
 * - Última data de backup
 * - Versão do esquema
 * - Estatísticas de uso
 * - Configurações de usuário
 */

// ============================================================================
// CONFIGURAÇÃO DE PROPRIEDADES
// ============================================================================

/**
 * @const {Object} PROPERTY_KEYS
 * @description Chaves padronizadas de propriedades
 */
var PROPERTY_KEYS = {
  // Sistema
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  SCHEMA_VERSION: 'SCHEMA_VERSION',
  SYSTEM_INITIALIZED: 'SYSTEM_INITIALIZED',
  ENVIRONMENT: 'ENVIRONMENT',
  
  // Backup e Arquivamento
  LAST_BACKUP_DATE: 'LAST_BACKUP_DATE',
  LAST_ARCHIVE_DATE: 'LAST_ARCHIVE_DATE',
  LAST_CLEANUP_DATE: 'LAST_CLEANUP_DATE',
  LAST_ARCHIVE_STATS: 'LAST_ARCHIVE_STATS',
  LAST_CLEANUP_STATS: 'LAST_CLEANUP_STATS',
  
  // Histórico
  CLEANUP_HISTORY: 'CLEANUP_HISTORY',
  ARCHIVE_HISTORY: 'ARCHIVE_HISTORY',
  
  // Políticas
  CUSTOM_RETENTION_POLICIES: 'CUSTOM_RETENTION_POLICIES',
  
  // Configurações
  DEBUG_MODE: 'DEBUG_MODE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  
  // Schemas
  SCHEMA_PREFIX: 'schema_',
  
  // Autenticação
  LOCK_PREFIX: 'LOCK_',
  ATTEMPTS_PREFIX: 'ATTEMPTS_',
  TOKEN_PREFIX: 'TOKEN_',
  PASSWORD_PREFIX: 'pwd_'
};

/**
 * @const {Object} PROPERTY_DEFAULTS
 * @description Valores padrão de propriedades
 */
var PROPERTY_DEFAULTS = {
  SCHEMA_VERSION: '1.0.0',
  ENVIRONMENT: 'development',
  DEBUG_MODE: 'false',
  MAINTENANCE_MODE: 'false'
};

// ============================================================================
// PROPERTIES MANAGER - GERENCIADOR DE PROPRIEDADES
// ============================================================================

/**
 * @class PropertiesManager
 * @description Gerenciador centralizado de propriedades
 */
var PropertiesManager = (function() {
  
  /**
   * Construtor do PropertiesManager
   * 
   * @constructor
   * @param {Object} [options] - Opções
   * @param {boolean} [options.useCache] - Usar cache
   */
  function PropertiesManager(options) {
    options = options || {};
    
    this.useCache = options.useCache !== false;
    this.scriptProps = PropertiesService.getScriptProperties();
    this.userProps = PropertiesService.getUserProperties();
    
    // Cache local
    this.cache = {};
  }
  
  // ==========================================================================
  // MÉTODOS DE SCRIPT PROPERTIES
  // ==========================================================================
  
  /**
   * Obtém propriedade de script
   * 
   * @param {string} key - Chave
   * @param {*} [defaultValue] - Valor padrão
   * @return {*} Valor
   * 
   * @example
   * var spreadsheetId = props.get('SPREADSHEET_ID');
   */
  PropertiesManager.prototype.get = function(key, defaultValue) {
    try {
      // Tenta cache primeiro
      if (this.useCache && this.cache[key] !== undefined) {
        return this.cache[key];
      }
      
      // Busca das propriedades
      var value = this.scriptProps.getProperty(key);
      
      // Se não existe, usa padrão
      if (value === null) {
        value = defaultValue !== undefined ? defaultValue : PROPERTY_DEFAULTS[key];
      }
      
      // Salva no cache
      if (this.useCache) {
        this.cache[key] = value;
      }
      
      return value;
      
    } catch (error) {
      return defaultValue !== undefined ? defaultValue : PROPERTY_DEFAULTS[key];
    }
  };
  
  /**
   * Define propriedade de script
   * 
   * @param {string} key - Chave
   * @param {*} value - Valor
   * @return {boolean} Sucesso
   * 
   * @example
   * props.set('SPREADSHEET_ID', 'abc123');
   */
  PropertiesManager.prototype.set = function(key, value) {
    try {
      // Converte para string se necessário
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      // Salva nas propriedades
      this.scriptProps.setProperty(key, stringValue);
      
      // Atualiza cache
      if (this.useCache) {
        this.cache[key] = value;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Remove propriedade de script
   * 
   * @param {string} key - Chave
   * @return {boolean} Sucesso
   * 
   * @example
   * props.remove('OLD_CONFIG');
   */
  PropertiesManager.prototype.remove = function(key) {
    try {
      this.scriptProps.deleteProperty(key);
      
      // Remove do cache
      if (this.useCache) {
        delete this.cache[key];
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Obtém todas as propriedades
   * 
   * @return {Object} Propriedades
   * 
   * @example
   * var all = props.getAll();
   */
  PropertiesManager.prototype.getAll = function() {
    try {
      return this.scriptProps.getProperties();
    } catch (error) {
      return {};
    }
  };
  
  /**
   * Define múltiplas propriedades
   * 
   * @param {Object} properties - Propriedades
   * @return {boolean} Sucesso
   * 
   * @example
   * props.setMultiple({ KEY1: 'value1', KEY2: 'value2' });
   */
  PropertiesManager.prototype.setMultiple = function(properties) {
    try {
      this.scriptProps.setProperties(properties);
      
      // Atualiza cache
      if (this.useCache) {
        Object.assign(this.cache, properties);
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  // ==========================================================================
  // MÉTODOS DE USER PROPERTIES
  // ==========================================================================
  
  /**
   * Obtém propriedade de usuário
   * 
   * @param {string} key - Chave
   * @param {*} [defaultValue] - Valor padrão
   * @return {*} Valor
   * 
   * @example
   * var theme = props.getUserProp('theme', 'light');
   */
  PropertiesManager.prototype.getUserProp = function(key, defaultValue) {
    try {
      var value = this.userProps.getProperty(key);
      return value !== null ? value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };
  
  /**
   * Define propriedade de usuário
   * 
   * @param {string} key - Chave
   * @param {*} value - Valor
   * @return {boolean} Sucesso
   * 
   * @example
   * props.setUserProp('theme', 'dark');
   */
  PropertiesManager.prototype.setUserProp = function(key, value) {
    try {
      var stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      this.userProps.setProperty(key, stringValue);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Remove propriedade de usuário
   * 
   * @param {string} key - Chave
   * @return {boolean} Sucesso
   */
  PropertiesManager.prototype.removeUserProp = function(key) {
    try {
      this.userProps.deleteProperty(key);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // ==========================================================================
  // MÉTODOS ESPECIALIZADOS
  // ==========================================================================
  
  /**
   * Obtém objeto JSON
   * 
   * @param {string} key - Chave
   * @param {Object} [defaultValue] - Valor padrão
   * @return {Object} Objeto
   * 
   * @example
   * var stats = props.getJSON('LAST_CLEANUP_STATS', {});
   */
  PropertiesManager.prototype.getJSON = function(key, defaultValue) {
    try {
      var value = this.get(key);
      if (!value) return defaultValue || {};
      return JSON.parse(value);
    } catch (error) {
      return defaultValue || {};
    }
  };
  
  /**
   * Define objeto JSON
   * 
   * @param {string} key - Chave
   * @param {Object} value - Objeto
   * @return {boolean} Sucesso
   * 
   * @example
   * props.setJSON('STATS', { total: 100, errors: 5 });
   */
  PropertiesManager.prototype.setJSON = function(key, value) {
    try {
      return this.set(key, JSON.stringify(value));
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Obtém número
   * 
   * @param {string} key - Chave
   * @param {number} [defaultValue] - Valor padrão
   * @return {number} Número
   * 
   * @example
   * var version = props.getNumber('SCHEMA_VERSION', 1);
   */
  PropertiesManager.prototype.getNumber = function(key, defaultValue) {
    try {
      var value = this.get(key);
      if (value === null || value === undefined) return defaultValue || 0;
      return parseFloat(value);
    } catch (error) {
      return defaultValue || 0;
    }
  };
  
  /**
   * Obtém booleano
   * 
   * @param {string} key - Chave
   * @param {boolean} [defaultValue] - Valor padrão
   * @return {boolean} Booleano
   * 
   * @example
   * var debug = props.getBoolean('DEBUG_MODE', false);
   */
  PropertiesManager.prototype.getBoolean = function(key, defaultValue) {
    try {
      var value = this.get(key);
      if (value === null || value === undefined) return defaultValue || false;
      return value === 'true' || value === true;
    } catch (error) {
      return defaultValue || false;
    }
  };
  
  /**
   * Obtém data
   * 
   * @param {string} key - Chave
   * @param {Date} [defaultValue] - Valor padrão
   * @return {Date} Data
   * 
   * @example
   * var lastBackup = props.getDate('LAST_BACKUP_DATE');
   */
  PropertiesManager.prototype.getDate = function(key, defaultValue) {
    try {
      var value = this.get(key);
      if (!value) return defaultValue || null;
      return new Date(value);
    } catch (error) {
      return defaultValue || null;
    }
  };
  
  /**
   * Define data
   * 
   * @param {string} key - Chave
   * @param {Date} value - Data
   * @return {boolean} Sucesso
   * 
   * @example
   * props.setDate('LAST_BACKUP_DATE', new Date());
   */
  PropertiesManager.prototype.setDate = function(key, value) {
    try {
      return this.set(key, value.toISOString());
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Incrementa contador
   * 
   * @param {string} key - Chave
   * @param {number} [amount] - Quantidade (padrão: 1)
   * @return {number} Novo valor
   * 
   * @example
   * var count = props.increment('LOGIN_COUNT');
   */
  PropertiesManager.prototype.increment = function(key, amount) {
    try {
      amount = amount || 1;
      var current = this.getNumber(key, 0);
      var newValue = current + amount;
      this.set(key, newValue.toString());
      return newValue;
    } catch (error) {
      return 0;
    }
  };
  
  /**
   * Adiciona item a array
   * 
   * @param {string} key - Chave
   * @param {*} item - Item
   * @param {number} [maxLength] - Tamanho máximo
   * @return {boolean} Sucesso
   * 
   * @example
   * props.pushToArray('HISTORY', { date: new Date(), action: 'backup' }, 100);
   */
  PropertiesManager.prototype.pushToArray = function(key, item, maxLength) {
    try {
      var array = this.getJSON(key, []);
      
      if (!Array.isArray(array)) {
        array = [];
      }
      
      array.push(item);
      
      // Limita tamanho
      if (maxLength && array.length > maxLength) {
        array = array.slice(-maxLength);
      }
      
      return this.setJSON(key, array);
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Limpa cache local
   */
  PropertiesManager.prototype.clearCache = function() {
    this.cache = {};
  };
  
  /**
   * Limpa todas as propriedades (CUIDADO!)
   * 
   * @param {Object} [options] - Opções
   * @param {boolean} [options.keepSystem] - Manter propriedades do sistema
   * @return {boolean} Sucesso
   */
  PropertiesManager.prototype.clearAll = function(options) {
    try {
      options = options || {};
      
      if (options.keepSystem) {
        // Remove apenas propriedades não-sistema
        var all = this.getAll();
        var systemKeys = [
          PROPERTY_KEYS.SPREADSHEET_ID,
          PROPERTY_KEYS.SCHEMA_VERSION,
          PROPERTY_KEYS.ENVIRONMENT
        ];
        
        for (var key in all) {
          if (systemKeys.indexOf(key) === -1) {
            this.remove(key);
          }
        }
      } else {
        // Remove tudo
        this.scriptProps.deleteAllProperties();
      }
      
      this.clearCache();
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Exporta propriedades
   * 
   * @return {Object} Propriedades
   */
  PropertiesManager.prototype.export = function() {
    return this.getAll();
  };
  
  /**
   * Importa propriedades
   * 
   * @param {Object} properties - Propriedades
   * @return {boolean} Sucesso
   */
  PropertiesManager.prototype.import = function(properties) {
    return this.setMultiple(properties);
  };
  
  return PropertiesManager;
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

// Função getPropertiesManager() movida para ServiceManager.gs

/**
 * Obtém propriedade (wrapper)
 * 
 * @param {string} key - Chave
 * @param {*} [defaultValue] - Valor padrão
 * @return {*} Valor
 */
function getProp(key, defaultValue) {
  return getPropertiesManager().get(key, defaultValue);
}

/**
 * Define propriedade (wrapper)
 * 
 * @param {string} key - Chave
 * @param {*} value - Valor
 * @return {boolean} Sucesso
 */
function setProp(key, value) {
  return getPropertiesManager().set(key, value);
}

/**
 * Obtém JSON (wrapper)
 * 
 * @param {string} key - Chave
 * @param {Object} [defaultValue] - Valor padrão
 * @return {Object} Objeto
 */
function getJSONProp(key, defaultValue) {
  return getPropertiesManager().getJSON(key, defaultValue);
}

/**
 * Define JSON (wrapper)
 * 
 * @param {string} key - Chave
 * @param {Object} value - Objeto
 * @return {boolean} Sucesso
 */
function setJSONProp(key, value) {
  return getPropertiesManager().setJSON(key, value);
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa PropertiesManager
 * 
 * @return {Object} Resultado dos testes
 */
function testPropertiesManager() {
  Logger.log('🧪 Testando PropertiesManager...\n');
  
  try {
    var props = new PropertiesManager();
    
    // Teste 1: Set e Get básico
    Logger.log('Teste 1: Set e Get básico');
    props.set('TEST_KEY', 'test_value');
    var value = props.get('TEST_KEY');
    Logger.log('✓ Valor: ' + value);
    
    // Teste 2: JSON
    Logger.log('\nTeste 2: JSON');
    var obj = { name: 'Test', count: 42 };
    props.setJSON('TEST_JSON', obj);
    var retrieved = props.getJSON('TEST_JSON');
    Logger.log('✓ JSON: ' + JSON.stringify(retrieved));
    
    // Teste 3: Número
    Logger.log('\nTeste 3: Número');
    props.set('TEST_NUMBER', '123');
    var num = props.getNumber('TEST_NUMBER');
    Logger.log('✓ Número: ' + num + ' (tipo: ' + typeof num + ')');
    
    // Teste 4: Booleano
    Logger.log('\nTeste 4: Booleano');
    props.set('TEST_BOOL', 'true');
    var bool = props.getBoolean('TEST_BOOL');
    Logger.log('✓ Boolean: ' + bool + ' (tipo: ' + typeof bool + ')');
    
    // Teste 5: Data
    Logger.log('\nTeste 5: Data');
    var now = new Date();
    props.setDate('TEST_DATE', now);
    var date = props.getDate('TEST_DATE');
    Logger.log('✓ Data: ' + date.toISOString());
    
    // Teste 6: Incremento
    Logger.log('\nTeste 6: Incremento');
    props.set('TEST_COUNTER', '0');
    var count1 = props.increment('TEST_COUNTER');
    var count2 = props.increment('TEST_COUNTER');
    var count3 = props.increment('TEST_COUNTER', 5);
    Logger.log('✓ Contador: ' + count1 + ' -> ' + count2 + ' -> ' + count3);
    
    // Teste 7: Array
    Logger.log('\nTeste 7: Array');
    props.setJSON('TEST_ARRAY', []);
    props.pushToArray('TEST_ARRAY', 'item1');
    props.pushToArray('TEST_ARRAY', 'item2');
    props.pushToArray('TEST_ARRAY', 'item3');
    var array = props.getJSON('TEST_ARRAY');
    Logger.log('✓ Array: ' + JSON.stringify(array));
    
    // Teste 8: Wrappers
    Logger.log('\nTeste 8: Wrappers');
    setProp('TEST_WRAPPER', 'wrapper_value');
    Logger.log('✓ Wrapper: ' + getProp('TEST_WRAPPER'));
    
    // Limpeza
    Logger.log('\nLimpando testes...');
    props.remove('TEST_KEY');
    props.remove('TEST_JSON');
    props.remove('TEST_NUMBER');
    props.remove('TEST_BOOL');
    props.remove('TEST_DATE');
    props.remove('TEST_COUNTER');
    props.remove('TEST_ARRAY');
    props.remove('TEST_WRAPPER');
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return {
      success: true
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}


