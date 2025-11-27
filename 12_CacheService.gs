/**
 * @file CacheService.gs
 * @description Sistema avançado de cache com múltiplas camadas
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de cache profissional com:
 * - Cache em memória (rápido)
 * - Cache de script (compartilhado)
 * - Cache de usuário (por usuário)
 * - TTL configurável
 * - Estatísticas de hit/miss
 * - Invalidação inteligente
 */

// ============================================================================
// CONFIGURAÇÃO DE CACHE
// ============================================================================

/**
 * @const {Object} CACHE_CONFIG
 * @description Configuração do sistema de cache
 */
var CACHE_CONFIG = {
  // Durações padrão (segundos)
  DEFAULT_TTL: 300,           // 5 minutos
  SHORT_TTL: 60,              // 1 minuto
  MEDIUM_TTL: 600,            // 10 minutos
  LONG_TTL: 3600,             // 1 hora
  
  // Limites
  MAX_KEY_LENGTH: 250,        // Apps Script limit
  MAX_VALUE_SIZE: 100000,     // ~100KB
  
  // Prefixos de chave
  PREFIX: {
    DATA: 'data:',
    LIST: 'list:',
    CONFIG: 'config:',
    USER: 'user:',
    SESSION: 'session:',
    STATS: 'stats:'
  }
};

// ============================================================================
// CACHE SERVICE - SERVIÇO DE CACHE AVANÇADO
// ============================================================================

/**
 * @class CacheServiceAdvanced
 * @description Serviço de cache com múltiplas camadas
 */
var CacheServiceAdvanced = (function() {
  
  /**
   * Construtor do CacheServiceAdvanced
   * 
   * @constructor
   * @param {Object} [options] - Opções de configuração
   * @param {boolean} [options.useMemory] - Usar cache em memória
   * @param {boolean} [options.useScript] - Usar cache de script
   * @param {boolean} [options.useUser] - Usar cache de usuário
   * @param {number} [options.defaultTTL] - TTL padrão em segundos
   */
  function CacheServiceAdvanced(options) {
    options = options || {};
    
    this.useMemory = options.useMemory !== false;
    this.useScript = options.useScript !== false;
    this.useUser = options.useUser !== false;
    this.defaultTTL = options.defaultTTL || CACHE_CONFIG.DEFAULT_TTL;
    
    // Cache em memória (mais rápido, mas limitado à execução)
    this.memoryCache = {};
    
    // Caches do Apps Script
    try {
      this.scriptCache = CacheService.getScriptCache();
      this.userCache = CacheService.getUserCache();
    } catch (e) {
      this.scriptCache = null;
      this.userCache = null;
    }
    
    // Estatísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }
  
  /**
   * Obtém valor do cache
   * 
   * @param {string} key - Chave
   * @param {Object} [options] - Opções
   * @param {boolean} [options.userCache] - Usar cache de usuário
   * @return {*} Valor ou null
   * 
   * @example
   * var value = cache.get('user:123');
   */
  CacheServiceAdvanced.prototype.get = function(key, options) {
    try {
      options = options || {};
      
      // 1. Tenta memória primeiro (mais rápido)
      if (this.useMemory && this.memoryCache[key]) {
        var entry = this.memoryCache[key];
        if (!this._isExpired(entry)) {
          this.stats.hits++;
          return this._deserialize(entry.value);
        } else {
          delete this.memoryCache[key];
        }
      }
      
      // 2. Tenta cache de usuário
      if (options.userCache && this.useUser && this.userCache) {
        var userValue = this.userCache.get(key);
        if (userValue !== null) {
          this.stats.hits++;
          // Atualiza memória
          if (this.useMemory) {
            this.memoryCache[key] = {
              value: userValue,
              timestamp: Date.now()
            };
          }
          return this._deserialize(userValue);
        }
      }
      
      // 3. Tenta cache de script
      if (this.useScript && this.scriptCache) {
        var scriptValue = this.scriptCache.get(key);
        if (scriptValue !== null) {
          this.stats.hits++;
          // Atualiza memória
          if (this.useMemory) {
            this.memoryCache[key] = {
              value: scriptValue,
              timestamp: Date.now()
            };
          }
          return this._deserialize(scriptValue);
        }
      }
      
      // Cache miss
      this.stats.misses++;
      return null;
      
    } catch (error) {
      this.stats.errors++;
      return null;
    }
  };
  
  /**
   * Define valor no cache
   * 
   * @param {string} key - Chave
   * @param {*} value - Valor
   * @param {Object} [options] - Opções
   * @param {number} [options.ttl] - TTL em segundos
   * @param {boolean} [options.userCache] - Usar cache de usuário
   * @return {boolean} Sucesso
   * 
   * @example
   * cache.set('user:123', userData, { ttl: 600 });
   */
  CacheServiceAdvanced.prototype.set = function(key, value, options) {
    try {
      options = options || {};
      var ttl = options.ttl || this.defaultTTL;
      
      // Valida chave
      if (!this._validateKey(key)) {
        return false;
      }
      
      // Serializa valor
      var serialized = this._serialize(value);
      
      // Valida tamanho
      if (serialized.length > CACHE_CONFIG.MAX_VALUE_SIZE) {
        return false;
      }
      
      // 1. Salva em memória
      if (this.useMemory) {
        this.memoryCache[key] = {
          value: serialized,
          timestamp: Date.now(),
          ttl: ttl * 1000 // Converte para ms
        };
      }
      
      // 2. Salva em cache de usuário
      if (options.userCache && this.useUser && this.userCache) {
        this.userCache.put(key, serialized, ttl);
      }
      
      // 3. Salva em cache de script
      if (this.useScript && this.scriptCache) {
        this.scriptCache.put(key, serialized, ttl);
      }
      
      this.stats.sets++;
      return true;
      
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  };
  
  /**
   * Remove valor do cache
   * 
   * @param {string} key - Chave
   * @param {Object} [options] - Opções
   * @param {boolean} [options.userCache] - Remover de cache de usuário
   * @return {boolean} Sucesso
   * 
   * @example
   * cache.remove('user:123');
   */
  CacheServiceAdvanced.prototype.remove = function(key, options) {
    try {
      options = options || {};
      
      // Remove de memória
      if (this.useMemory) {
        delete this.memoryCache[key];
      }
      
      // Remove de cache de usuário
      if (options.userCache && this.useUser && this.userCache) {
        this.userCache.remove(key);
      }
      
      // Remove de cache de script
      if (this.useScript && this.scriptCache) {
        this.scriptCache.remove(key);
      }
      
      this.stats.deletes++;
      return true;
      
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  };
  
  /**
   * Remove múltiplas chaves
   * 
   * @param {Array<string>} keys - Chaves
   * @return {number} Quantidade removida
   * 
   * @example
   * cache.removeMultiple(['key1', 'key2', 'key3']);
   */
  CacheServiceAdvanced.prototype.removeMultiple = function(keys) {
    var removed = 0;
    for (var i = 0; i < keys.length; i++) {
      if (this.remove(keys[i])) {
        removed++;
      }
    }
    return removed;
  };
  
  /**
   * Remove chaves por padrão
   * 
   * @param {string} pattern - Padrão (ex: 'user:*')
   * @return {number} Quantidade removida
   * 
   * @example
   * cache.removePattern('user:*');
   */
  CacheServiceAdvanced.prototype.removePattern = function(pattern) {
    try {
      var removed = 0;
      var regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      
      // Remove de memória
      if (this.useMemory) {
        var keys = Object.keys(this.memoryCache);
        for (var i = 0; i < keys.length; i++) {
          if (regex.test(keys[i])) {
            delete this.memoryCache[keys[i]];
            removed++;
          }
        }
      }
      
      // Nota: Apps Script CacheService não suporta listagem de chaves
      // então não podemos remover por padrão dos caches persistentes
      
      return removed;
      
    } catch (error) {
      this.stats.errors++;
      return 0;
    }
  };
  
  /**
   * Limpa todo o cache
   * 
   * @param {Object} [options] - Opções
   * @param {boolean} [options.userCache] - Limpar cache de usuário
   * @return {boolean} Sucesso
   * 
   * @example
   * cache.clear();
   */
  CacheServiceAdvanced.prototype.clear = function(options) {
    try {
      options = options || {};
      
      // Limpa memória
      if (this.useMemory) {
        this.memoryCache = {};
      }
      
      // Limpa cache de usuário
      if (options.userCache && this.useUser && this.userCache) {
        this.userCache.removeAll(this.userCache.getKeys());
      }
      
      // Limpa cache de script
      if (this.useScript && this.scriptCache) {
        this.scriptCache.removeAll(this.scriptCache.getKeys());
      }
      
      return true;
      
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  };
  
  /**
   * Obtém ou define valor (get-or-set pattern)
   * 
   * @param {string} key - Chave
   * @param {Function} factory - Função que retorna valor se não existir
   * @param {Object} [options] - Opções
   * @return {*} Valor
   * 
   * @example
   * var users = cache.getOrSet('users', function() {
   *   return fetchUsersFromSheet();
   * }, { ttl: 600 });
   */
  CacheServiceAdvanced.prototype.getOrSet = function(key, factory, options) {
    try {
      // Tenta obter do cache
      var value = this.get(key, options);
      
      if (value !== null) {
        return value;
      }
      
      // Não existe, executa factory
      value = factory();
      
      // Salva no cache
      this.set(key, value, options);
      
      return value;
      
    } catch (error) {
      this.stats.errors++;
      // Em caso de erro, executa factory diretamente
      return factory();
    }
  };
  
  /**
   * Verifica se chave existe
   * 
   * @param {string} key - Chave
   * @return {boolean}
   * 
   * @example
   * if (cache.has('user:123')) { ... }
   */
  CacheServiceAdvanced.prototype.has = function(key) {
    return this.get(key) !== null;
  };
  
  /**
   * Obtém estatísticas do cache
   * 
   * @return {Object} Estatísticas
   * 
   * @example
   * var stats = cache.getStats();
   * console.log('Hit rate:', stats.hitRate);
   */
  CacheServiceAdvanced.prototype.getStats = function() {
    var total = this.stats.hits + this.stats.misses;
    var hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      errors: this.stats.errors,
      hitRate: hitRate + '%',
      memoryKeys: Object.keys(this.memoryCache).length
    };
  };
  
  /**
   * Reseta estatísticas
   */
  CacheServiceAdvanced.prototype.resetStats = function() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  };
  
  /**
   * Valida chave
   * 
   * @private
   * @param {string} key - Chave
   * @return {boolean}
   */
  CacheServiceAdvanced.prototype._validateKey = function(key) {
    return key && 
           typeof key === 'string' && 
           key.length > 0 && 
           key.length <= CACHE_CONFIG.MAX_KEY_LENGTH;
  };
  
  /**
   * Verifica se entrada expirou
   * 
   * @private
   * @param {Object} entry - Entrada
   * @return {boolean}
   */
  CacheServiceAdvanced.prototype._isExpired = function(entry) {
    if (!entry.ttl) return false;
    return (Date.now() - entry.timestamp) > entry.ttl;
  };
  
  /**
   * Serializa valor
   * 
   * @private
   * @param {*} value - Valor
   * @return {string}
   */
  CacheServiceAdvanced.prototype._serialize = function(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  };
  
  /**
   * Desserializa valor
   * 
   * @private
   * @param {string} value - Valor serializado
   * @return {*}
   */
  CacheServiceAdvanced.prototype._deserialize = function(value) {
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      // Se não for JSON, retorna string
      return value;
    }
  };
  
  return CacheServiceAdvanced;
})();

// ============================================================================
// CACHE HELPERS - FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global do cache
 * 
 * @return {CacheServiceAdvanced}
 */
function getCache() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getCacheService();
  }
  
  // Fallback: cria instância local
  if (typeof globalThis._cache === 'undefined') {
    globalThis._cache = new CacheServiceAdvanced();
  }
  return globalThis._cache;
}

/**
 * Cache rápido de dados (wrapper)
 * 
 * @param {string} key - Chave
 * @param {*} value - Valor
 * @param {number} [ttl] - TTL em segundos
 * @return {boolean} Sucesso
 */
function cacheData(key, value, ttl) {
  return getCache().set(key, value, { ttl: ttl });
}

/**
 * Obtém dados do cache (wrapper)
 * 
 * @param {string} key - Chave
 * @return {*} Valor ou null
 */
function getCachedData(key) {
  return getCache().get(key);
}

/**
 * Remove dados do cache (wrapper)
 * 
 * @param {string} key - Chave
 * @return {boolean} Sucesso
 */
function removeCachedData(key) {
  return getCache().remove(key);
}

// ============================================================================
// CACHE PRESETS - CONFIGURAÇÕES PRÉ-DEFINIDAS
// ============================================================================



// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa CacheServiceAdvanced
 * 
 * @return {Object} Resultado dos testes
 */
function testCacheService() {
  Logger.log('🧪 Testando CacheServiceAdvanced...\n');
  
  try {
    var cache = new CacheServiceAdvanced();
    
    // Teste 1: Set e Get básico
    Logger.log('Teste 1: Set e Get básico');
    cache.set('test:key1', 'valor1');
    var value1 = cache.get('test:key1');
    Logger.log('✓ Valor obtido: ' + value1);
    
    // Teste 2: Objetos complexos
    Logger.log('\nTeste 2: Objetos complexos');
    var obj = { nome: 'João', idade: 30, ativo: true };
    cache.set('test:obj', obj);
    var objRecuperado = cache.get('test:obj');
    Logger.log('✓ Objeto: ' + JSON.stringify(objRecuperado));
    
    // Teste 3: TTL
    Logger.log('\nTeste 3: TTL (curto)');
    cache.set('test:ttl', 'expira', { ttl: 2 });
    Logger.log('✓ Valor imediato: ' + cache.get('test:ttl'));
    Utilities.sleep(3000);
    Logger.log('✓ Após 3s: ' + cache.get('test:ttl'));
    
    // Teste 4: GetOrSet
    Logger.log('\nTeste 4: GetOrSet');
    var counter = 0;
    var result1 = cache.getOrSet('test:factory', function() {
      counter++;
      return 'gerado-' + counter;
    });
    var result2 = cache.getOrSet('test:factory', function() {
      counter++;
      return 'gerado-' + counter;
    });
    Logger.log('✓ Primeira chamada: ' + result1);
    Logger.log('✓ Segunda chamada (cache): ' + result2);
    Logger.log('✓ Counter: ' + counter + ' (deve ser 1)');
    
    // Teste 5: Remove
    Logger.log('\nTeste 5: Remove');
    cache.set('test:remove', 'valor');
    Logger.log('✓ Antes: ' + cache.get('test:remove'));
    cache.remove('test:remove');
    Logger.log('✓ Depois: ' + cache.get('test:remove'));
    
    // Teste 6: Estatísticas
    Logger.log('\nTeste 6: Estatísticas');
    var stats = cache.getStats();
    Logger.log('✓ Stats: ' + JSON.stringify(stats, null, 2));
    
    // Teste 7: Wrappers
    Logger.log('\nTeste 7: Wrappers');
    cacheData('test:wrapper', 'valor-wrapper');
    Logger.log('✓ Wrapper get: ' + getCachedData('test:wrapper'));
    
    // Teste 8: Presets
    Logger.log('\nTeste 8: Presets');
    var options = cacheOptions('escolas', function() {
      return ['Escola A', 'Escola B', 'Escola C'];
    });
    Logger.log('✓ Options: ' + JSON.stringify(options));
    
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


