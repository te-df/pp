/**
 * @file ServiceManager.gs
 * @description Service Manager - Singleton Pattern para gerenciar serviços
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * 
 * IMPORTANTE: Este arquivo implementa o Singleton Pattern para garantir
 * que apenas uma instância de cada serviço seja criada e reutilizada.
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// SERVICE MANAGER - SINGLETON PATTERN
// ============================================================================

/**
 * @class ServiceManager
 * @description Gerenciador centralizado de serviços com Singleton Pattern
 * Garante que cada serviço tenha apenas uma instância ativa
 * 
 * FASE 2 - MELHORIAS:
 * - Injeção de Dependência explícita
 * - Detecção de dependências circulares
 * - Registro de dependências por serviço
 */
var ServiceManager = (function() {
  
  // Armazena instâncias dos serviços (privado)
  var instances = {};
  
  // Armazena metadados dos serviços
  var metadata = {};
  
  // Contador de acessos para estatísticas
  var accessCount = {};
  
  // Registro de dependências de cada serviço
  var dependencies = {
    'DataService': ['LoggerService', 'ValidationService'],
    'AuthService': ['SessionManager', 'LoggerService', 'UserRepository'],
    'SessionManager': ['CacheService', 'LoggerService'],
    'ValidationService': ['LoggerService'],
    'AuditService': ['LoggerService', 'DataService'],
    'ExportService': ['DataService', 'LoggerService'],
    'SchemaService': ['LoggerService'],
    'VersionManager': ['PropertiesManager', 'LoggerService'],
    'LoggerService': [], // Sem dependências
    'PropertiesManager': [], // Sem dependências
    'CacheService': [], // Sem dependências
    'RetryService': ['LoggerService']
  };
  
  // Pilha de resolução para detectar dependências circulares
  var resolutionStack = [];
  
  /**
   * Verifica se há dependência circular
   * @private
   * @param {string} serviceName - Nome do serviço
   * @return {boolean} true se houver dependência circular
   */
  function hasCircularDependency(serviceName) {
    return resolutionStack.indexOf(serviceName) !== -1;
  }
  
  /**
   * Adiciona serviço à pilha de resolução
   * @private
   * @param {string} serviceName - Nome do serviço
   */
  function pushResolution(serviceName) {
    resolutionStack.push(serviceName);
  }
  
  /**
   * Remove serviço da pilha de resolução
   * @private
   * @param {string} serviceName - Nome do serviço
   */
  function popResolution(serviceName) {
    var index = resolutionStack.indexOf(serviceName);
    if (index !== -1) {
      resolutionStack.splice(index, 1);
    }
  }
  
  /**
   * Resolve dependências de um serviço
   * @private
   * @param {string} serviceName - Nome do serviço
   * @return {Object} Objeto com dependências resolvidas
   */
  function resolveDependencies(serviceName) {
    var deps = dependencies[serviceName] || [];
    var resolved = {};
    
    for (var i = 0; i < deps.length; i++) {
      var depName = deps[i];
      
      try {
        // Verifica dependência circular
        if (hasCircularDependency(depName)) {
          Logger.log('[ServiceManager] ⚠️  AVISO: Dependência circular detectada: ' + 
                     resolutionStack.join(' -> ') + ' -> ' + depName);
          resolved[depName] = null;
          continue;
        }
        
        // Resolve dependência
        pushResolution(depName);
        
        // Usa método específico do ServiceManager se existir
        var getterName = 'get' + depName;
        if (typeof ServiceManager[getterName] === 'function') {
          resolved[depName] = ServiceManager[getterName]();
        } else {
          Logger.log('[ServiceManager] AVISO: Getter não encontrado para ' + depName);
          resolved[depName] = null;
        }
        
        popResolution(depName);
      } catch (error) {
        Logger.log('[ServiceManager] Erro ao resolver dependência ' + depName + ': ' + error.message);
        resolved[depName] = null;
        popResolution(depName);
      }
    }
    
    return resolved;
  }
  
  /**
   * Valida se todas as dependências foram resolvidas
   * @private
   * @param {string} serviceName - Nome do serviço
   * @param {Object} resolved - Dependências resolvidas
   * @return {Object} {valid: boolean, missing: Array}
   */
  function validateDependencies(serviceName, resolved) {
    var deps = dependencies[serviceName] || [];
    var missing = [];
    
    for (var i = 0; i < deps.length; i++) {
      var depName = deps[i];
      if (!resolved[depName]) {
        missing.push(depName);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing: missing
    };
  }
  
  return {
    /**
     * Obtém instância de DataService (Singleton)
     * @param {string} sheetName - Nome da planilha
     * @return {DataService} Instância única do DataService
     */
    getDataService: function(sheetName) {
      try {
        // Verifica se DataService está disponível (com retry para ordem de carregamento)
        if (typeof DataService === 'undefined') {
          // Tenta aguardar um pouco para o arquivo carregar
          Utilities.sleep(100);
          if (typeof DataService === 'undefined') {
            Logger.log('[ServiceManager] ERRO CRÍTICO: DataService não está definido após retry.');
            Logger.log('[ServiceManager] Verifique se o arquivo 2_Data_Services_Part1.gs existe e está sendo carregado.');
            throw new Error('DataService não está definido. Verifique se o arquivo 2_Data_Services_Part1.gs foi carregado.');
          }
        }
        
        // Normaliza o nome da planilha
        var normalizedName = sheetName || 'Usuarios';
        var key = 'DataService_' + normalizedName;
        
        // Retorna instância existente ou cria nova
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de DataService para: ' + normalizedName);
          instances[key] = new DataService(normalizedName);
          
          // Registra metadados
          metadata[key] = {
            type: 'DataService',
            sheetName: normalizedName,
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        // Incrementa contador de acesso
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getDataService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de AuthService (Singleton)
     * @return {Object} Instância única do AuthService
     */
    getAuthService: function() {
      try {
        var key = 'AuthService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de AuthService');
          
          // Verifica se AuthService existe
          if (typeof AuthService !== 'undefined') {
            instances[key] = new AuthService();
          } else {
            throw new Error('AuthService não está definido');
          }
          
          metadata[key] = {
            type: 'AuthService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getAuthService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de LoggerService (Singleton)
     * @return {Object} Instância única do LoggerService
     */
    getLoggerService: function() {
      try {
        var key = 'LoggerService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de LoggerService');
          
          // Cria instância simples se LoggerService não existir
          if (typeof LoggerService !== 'undefined') {
            instances[key] = new LoggerService();
          } else {
            // Fallback para Logger nativo
            instances[key] = {
              log: function(message, level) {
                Logger.log('[' + (level || 'INFO') + '] ' + message);
              },
              info: function(message) { this.log(message, 'INFO'); },
              warn: function(message) { this.log(message, 'WARN'); },
              error: function(message) { this.log(message, 'ERROR'); },
              debug: function(message) { this.log(message, 'DEBUG'); }
            };
          }
          
          metadata[key] = {
            type: 'LoggerService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getLoggerService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de ValidationService (Singleton)
     * @return {Object} Instância única do ValidationService
     */
    getValidationService: function() {
      try {
        var key = 'ValidationService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de ValidationService');
          
          if (typeof ValidationService !== 'undefined') {
            instances[key] = new ValidationService();
          } else {
            // Fallback básico
            instances[key] = {
              validate: function(data, rules) {
                return { valid: true, errors: [], warnings: [] };
              }
            };
          }
          
          metadata[key] = {
            type: 'ValidationService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getValidationService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de ExportService (Singleton)
     * @return {Object} Instância única do ExportService
     */
    getExportService: function() {
      try {
        var key = 'ExportService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de ExportService');
          
          if (typeof ExportService !== 'undefined') {
            instances[key] = new ExportService();
          } else {
            Logger.log('[ServiceManager] AVISO: ExportService não está definido. Retornando stub.');
            // Retorna um stub básico para evitar quebra total
            instances[key] = {
              export: function() {
                throw new Error('ExportService não está disponível');
              }
            };
          }
          
          metadata[key] = {
            type: 'ExportService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getExportService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de SchemaService (Singleton)
     * @return {Object} Instância única do SchemaService
     */
    getSchemaService: function() {
      try {
        var key = 'SchemaService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de SchemaService');
          
          if (typeof SchemaService !== 'undefined') {
            instances[key] = new SchemaService();
          } else {
            throw new Error('SchemaService não está definido');
          }
          
          metadata[key] = {
            type: 'SchemaService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getSchemaService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de PropertiesManager (Singleton)
     * @return {Object} Instância única do PropertiesManager
     */
    getPropertiesManager: function() {
      try {
        var key = 'PropertiesManager';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de PropertiesManager');
          
          if (typeof PropertiesManager !== 'undefined') {
            instances[key] = new PropertiesManager();
          } else {
            throw new Error('PropertiesManager não está definido');
          }
          
          metadata[key] = {
            type: 'PropertiesManager',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getPropertiesManager] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de RetryService (Singleton)
     * @return {Object} Instância única do RetryService
     */
    getRetryService: function() {
      try {
        var key = 'RetryService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de RetryService');
          
          if (typeof RetryService !== 'undefined') {
            instances[key] = new RetryService();
          } else {
            throw new Error('RetryService não está definido');
          }
          
          metadata[key] = {
            type: 'RetryService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getRetryService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de CacheService (Singleton)
     * @return {Object} Instância única do CacheService
     */
    getCacheService: function() {
      try {
        var key = 'CacheService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de CacheService');
          
          // Tenta usar CacheServiceAdvanced se disponível
          if (typeof CacheServiceAdvanced !== 'undefined') {
            instances[key] = new CacheServiceAdvanced();
          } else {
            // Fallback para CacheService nativo do Google (wrapper simples)
            var nativeCache = CacheService.getScriptCache();
            instances[key] = {
              get: function(k) { return nativeCache.get(k); },
              put: function(k, v, t) { nativeCache.put(k, v, t || 600); },
              remove: function(k) { nativeCache.remove(k); }
            };
          }
          
          metadata[key] = {
            type: 'CacheService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getCacheService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de SessionManager (Singleton)
     * @return {Object} Instância única do SessionManager
     */
    getSessionManager: function() {
      try {
        var key = 'SessionManager';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de SessionManager');
          
          if (typeof SessionManager !== 'undefined') {
            instances[key] = new SessionManager();
            
            // Verifica se a instância foi criada corretamente
            if (!instances[key]) {
              throw new Error('Falha ao criar instância de SessionManager');
            }
            
            // Verifica se métodos essenciais existem
            if (typeof instances[key].createSession !== 'function') {
              Logger.log('[ServiceManager] AVISO: SessionManager não tem método createSession');
            }
            if (typeof instances[key].validateToken !== 'function' && 
                typeof instances[key].validateSession !== 'function') {
              Logger.log('[ServiceManager] AVISO: SessionManager não tem método validateToken/validateSession');
            }
          } else {
            throw new Error('SessionManager não está definido');
          }
          
          metadata[key] = {
            type: 'SessionManager',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getSessionManager] Erro: ' + error.message);
        Logger.log('[ServiceManager.getSessionManager] Stack: ' + error.stack);
        throw error;
      }
    },
    
    /**
     * Obtém instância de AuditService (Singleton)
     * @return {Object} Instância única do AuditService
     */
    getAuditService: function() {
      try {
        var key = 'AuditService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de AuditService');
          
          if (typeof AuditService !== 'undefined') {
            instances[key] = new AuditService();
          } else {
            throw new Error('AuditService não está definido');
          }
          
          metadata[key] = {
            type: 'AuditService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getAuditService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de DataMaskingService (Singleton)
     * @return {Object} Instância única do DataMaskingService
     */
    getDataMaskingService: function() {
      try {
        var key = 'DataMaskingService';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de DataMaskingService');
          
          if (typeof DataMaskingService !== 'undefined') {
            instances[key] = DataMaskingService;
          } else {
            throw new Error('DataMaskingService não está definido');
          }
          
          metadata[key] = {
            type: 'DataMaskingService',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getDataMaskingService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância de VersionManager (Singleton)
     * @return {Object} Instância única do VersionManager
     */
    getVersionManager: function() {
      try {
        var key = 'VersionManager';
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de VersionManager');
          
          if (typeof VersionManager !== 'undefined') {
            instances[key] = new VersionManager();
          } else {
            throw new Error('VersionManager não está definido');
          }
          
          metadata[key] = {
            type: 'VersionManager',
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getVersionManager] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém instância genérica de qualquer serviço
     * @param {string} serviceName - Nome do serviço
     * @param {Array} args - Argumentos para o construtor
     * @return {Object} Instância do serviço
     */
    getService: function(serviceName, args) {
      try {
        args = args || [];
        var key = serviceName + '_' + JSON.stringify(args);
        
        if (!instances[key]) {
          Logger.log('[ServiceManager] Criando nova instância de: ' + serviceName);
          
          // Verifica se o serviço existe no escopo global
          if (typeof this[serviceName] === 'undefined' && typeof global[serviceName] === 'undefined') {
            throw new Error('Serviço não encontrado: ' + serviceName);
          }
          
          // Cria instância dinamicamente
          var ServiceClass = this[serviceName] || global[serviceName];
          instances[key] = new ServiceClass.apply(null, args);
          
          metadata[key] = {
            type: serviceName,
            args: args,
            createdAt: new Date().toISOString(),
            accessCount: 0
          };
        }
        
        if (!accessCount[key]) {
          accessCount[key] = 0;
        }
        accessCount[key]++;
        metadata[key].accessCount = accessCount[key];
        metadata[key].lastAccessAt = new Date().toISOString();
        
        return instances[key];
      } catch (error) {
        Logger.log('[ServiceManager.getService] Erro: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Limpa instância específica de um serviço
     * @param {string} serviceName - Nome do serviço
     * @param {string} identifier - Identificador adicional (ex: sheetName)
     */
    clearService: function(serviceName, identifier) {
      try {
        var key = identifier ? serviceName + '_' + identifier : serviceName;
        
        if (instances[key]) {
          Logger.log('[ServiceManager] Limpando instância: ' + key);
          delete instances[key];
          delete metadata[key];
          delete accessCount[key];
          return true;
        }
        
        return false;
      } catch (error) {
        Logger.log('[ServiceManager.clearService] Erro: ' + error.message);
        return false;
      }
    },
    
    /**
     * Limpa todas as instâncias de serviços
     */
    clearAll: function() {
      try {
        Logger.log('[ServiceManager] Limpando todas as instâncias');
        var count = Object.keys(instances).length;
        
        instances = {};
        metadata = {};
        accessCount = {};
        
        Logger.log('[ServiceManager] ' + count + ' instâncias limpas');
        return { success: true, cleared: count };
      } catch (error) {
        Logger.log('[ServiceManager.clearAll] Erro: ' + error.message);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Obtém estatísticas de uso dos serviços
     * @return {Object} Estatísticas
     */
    getStats: function() {
      try {
        var stats = {
          totalServices: Object.keys(instances).length,
          services: [],
          totalAccesses: 0,
          mostUsed: null,
          leastUsed: null
        };
        
        // Coleta estatísticas de cada serviço
        for (var key in metadata) {
          var meta = metadata[key];
          stats.services.push({
            key: key,
            type: meta.type,
            createdAt: meta.createdAt,
            lastAccessAt: meta.lastAccessAt,
            accessCount: meta.accessCount
          });
          
          stats.totalAccesses += meta.accessCount;
        }
        
        // Ordena por uso
        stats.services.sort(function(a, b) {
          return b.accessCount - a.accessCount;
        });
        
        // Identifica mais e menos usado
        if (stats.services.length > 0) {
          stats.mostUsed = stats.services[0];
          stats.leastUsed = stats.services[stats.services.length - 1];
        }
        
        return stats;
      } catch (error) {
        Logger.log('[ServiceManager.getStats] Erro: ' + error.message);
        return { error: error.message };
      }
    },
    
    /**
     * Lista todos os serviços ativos
     * @return {Array} Lista de serviços
     */
    listServices: function() {
      try {
        var services = [];
        
        for (var key in instances) {
          services.push({
            key: key,
            type: metadata[key] ? metadata[key].type : 'Unknown',
            accessCount: accessCount[key] || 0
          });
        }
        
        return services;
      } catch (error) {
        Logger.log('[ServiceManager.listServices] Erro: ' + error.message);
        return [];
      }
    },
    
    /**
     * Verifica se um serviço está ativo
     * @param {string} serviceName - Nome do serviço
     * @param {string} identifier - Identificador adicional
     * @return {boolean}
     */
    hasService: function(serviceName, identifier) {
      var key = identifier ? serviceName + '_' + identifier : serviceName;
      return instances.hasOwnProperty(key);
    },
    
    /**
     * Obtém metadados de um serviço
     * @param {string} serviceName - Nome do serviço
     * @param {string} identifier - Identificador adicional
     * @return {Object|null}
     */
    getMetadata: function(serviceName, identifier) {
      var key = identifier ? serviceName + '_' + identifier : serviceName;
      return metadata[key] || null;
    },
    
    /**
     * Imprime relatório de uso dos serviços
     */
    printReport: function() {
      var stats = this.getStats();
      
      Logger.log('='.repeat(60));
      Logger.log('SERVICE MANAGER - RELATÓRIO DE USO');
      Logger.log('='.repeat(60));
      Logger.log('Total de serviços ativos: ' + stats.totalServices);
      Logger.log('Total de acessos: ' + stats.totalAccesses);
      Logger.log('');
      
      if (stats.mostUsed) {
        Logger.log('Serviço mais usado:');
        Logger.log('  • ' + stats.mostUsed.key + ' (' + stats.mostUsed.accessCount + ' acessos)');
      }
      
      Logger.log('');
      Logger.log('Todos os serviços:');
      
      for (var i = 0; i < stats.services.length; i++) {
        var service = stats.services[i];
        Logger.log('  ' + (i + 1) + '. ' + service.key);
        Logger.log('     Tipo: ' + service.type);
        Logger.log('     Acessos: ' + service.accessCount);
        Logger.log('     Criado em: ' + service.createdAt);
        Logger.log('     Último acesso: ' + service.lastAccessAt);
        Logger.log('');
      }
      
      Logger.log('='.repeat(60));
    },
    
    /**
     * Registra dependências de um serviço
     * @param {string} serviceName - Nome do serviço
     * @param {Array<string>} deps - Array de nomes de dependências
     */
    registerDependencies: function(serviceName, deps) {
      dependencies[serviceName] = deps || [];
      Logger.log('[ServiceManager] Dependências registradas para ' + serviceName + ': ' + deps.join(', '));
    },
    
    /**
     * Obtém dependências registradas de um serviço
     * @param {string} serviceName - Nome do serviço
     * @return {Array<string>} Array de dependências
     */
    getDependencies: function(serviceName) {
      return dependencies[serviceName] || [];
    },
    
    /**
     * Valida todas as dependências do sistema
     * @return {Object} Resultado da validação
     */
    validateAllDependencies: function() {
      Logger.log('='.repeat(60));
      Logger.log('VALIDAÇÃO DE DEPENDÊNCIAS');
      Logger.log('='.repeat(60));
      
      var results = {
        total: 0,
        valid: 0,
        invalid: 0,
        services: []
      };
      
      for (var serviceName in dependencies) {
        results.total++;
        
        var deps = dependencies[serviceName];
        var resolved = resolveDependencies(serviceName);
        var validation = validateDependencies(serviceName, resolved);
        
        var serviceResult = {
          name: serviceName,
          dependencies: deps,
          valid: validation.valid,
          missing: validation.missing
        };
        
        results.services.push(serviceResult);
        
        if (validation.valid) {
          results.valid++;
          Logger.log('✅ ' + serviceName + ': Todas as dependências OK');
        } else {
          results.invalid++;
          Logger.log('❌ ' + serviceName + ': Dependências faltando: ' + validation.missing.join(', '));
        }
      }
      
      Logger.log('');
      Logger.log('Resumo:');
      Logger.log('  Total: ' + results.total);
      Logger.log('  Válidos: ' + results.valid);
      Logger.log('  Inválidos: ' + results.invalid);
      Logger.log('='.repeat(60));
      
      return results;
    },
    
    /**
     * Detecta dependências circulares no sistema
     * @return {Object} Resultado da detecção
     */
    detectCircularDependencies: function() {
      Logger.log('='.repeat(60));
      Logger.log('DETECÇÃO DE DEPENDÊNCIAS CIRCULARES');
      Logger.log('='.repeat(60));
      
      var results = {
        hasCircular: false,
        circular: []
      };
      
      for (var serviceName in dependencies) {
        resolutionStack = []; // Reset
        
        try {
          pushResolution(serviceName);
          var deps = dependencies[serviceName] || [];
          
          for (var i = 0; i < deps.length; i++) {
            var depName = deps[i];
            
            if (hasCircularDependency(depName)) {
              results.hasCircular = true;
              var cycle = resolutionStack.concat([depName]);
              results.circular.push({
                service: serviceName,
                cycle: cycle
              });
              Logger.log('❌ Dependência circular detectada: ' + cycle.join(' -> '));
            } else {
              pushResolution(depName);
              // Verifica dependências do próximo nível
              var subDeps = dependencies[depName] || [];
              for (var j = 0; j < subDeps.length; j++) {
                if (hasCircularDependency(subDeps[j])) {
                  results.hasCircular = true;
                  var cycle2 = resolutionStack.concat([subDeps[j]]);
                  results.circular.push({
                    service: serviceName,
                    cycle: cycle2
                  });
                  Logger.log('❌ Dependência circular detectada: ' + cycle2.join(' -> '));
                }
              }
              popResolution(depName);
            }
          }
          
          popResolution(serviceName);
        } catch (error) {
          Logger.log('Erro ao verificar ' + serviceName + ': ' + error.message);
        }
      }
      
      if (!results.hasCircular) {
        Logger.log('✅ Nenhuma dependência circular detectada!');
      }
      
      Logger.log('='.repeat(60));
      
      return results;
    },
    
    /**
     * Imprime grafo de dependências
     */
    printDependencyGraph: function() {
      Logger.log('='.repeat(60));
      Logger.log('GRAFO DE DEPENDÊNCIAS');
      Logger.log('='.repeat(60));
      
      for (var serviceName in dependencies) {
        var deps = dependencies[serviceName];
        
        if (deps.length === 0) {
          Logger.log('📦 ' + serviceName + ' (sem dependências)');
        } else {
          Logger.log('📦 ' + serviceName);
          for (var i = 0; i < deps.length; i++) {
            var isLast = i === deps.length - 1;
            var prefix = isLast ? '  └─ ' : '  ├─ ';
            Logger.log(prefix + deps[i]);
          }
        }
        Logger.log('');
      }
      
      Logger.log('='.repeat(60));
    }
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS (WRAPPERS)
// ============================================================================

/**
 * Obtém DataService via ServiceManager (wrapper global)
 * @param {string} sheetName - Nome da planilha
 * @return {DataService}
 */
function getDataService(sheetName) {
  return ServiceManager.getDataService(sheetName);
}

/**
 * Obtém AuthService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getAuthService() {
  return ServiceManager.getAuthService();
}

/**
 * Obtém LoggerService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getLoggerService() {
  return ServiceManager.getLoggerService();
}

/**
 * Obtém ValidationService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getValidationService() {
  return ServiceManager.getValidationService();
}

/**
 * Obtém ExportService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getExportService() {
  return ServiceManager.getExportService();
}

/**
 * Obtém SchemaService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getSchemaService() {
  return ServiceManager.getSchemaService();
}

/**
 * Obtém PropertiesManager via ServiceManager (wrapper global)
 * @return {Object}
 */
function getPropertiesManager() {
  return ServiceManager.getPropertiesManager();
}

/**
 * Obtém RetryService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getRetryService() {
  return ServiceManager.getRetryService();
}

/**
 * Obtém CacheService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getCacheService() {
  return ServiceManager.getCacheService();
}

/**
 * Obtém SessionManager via ServiceManager (wrapper global)
 * @return {Object}
 */
function getSessionManager() {
  return ServiceManager.getSessionManager();
}

/**
 * Obtém AuditService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getAuditService() {
  return ServiceManager.getAuditService();
}

/**
 * Obtém DataMaskingService via ServiceManager (wrapper global)
 * @return {Object}
 */
function getDataMaskingService() {
  return ServiceManager.getDataMaskingService();
}

// ============================================================================
// FUNÇÕES DE TESTE E DIAGNÓSTICO
// ============================================================================

/**
 * Testa o ServiceManager
 */
function testServiceManager() {
  Logger.log('🧪 Testando ServiceManager...\n');
  
  // Teste 1: Criar múltiplas instâncias do mesmo serviço
  Logger.log('Teste 1: Singleton Pattern');
  var ds1 = ServiceManager.getDataService('Alunos');
  var ds2 = ServiceManager.getDataService('Alunos');
  Logger.log('ds1 === ds2: ' + (ds1 === ds2)); // Deve ser true
  
  // Teste 2: Criar instâncias de serviços diferentes
  Logger.log('\nTeste 2: Múltiplos serviços');
  var ds3 = ServiceManager.getDataService('Rotas');
  Logger.log('ds1 === ds3: ' + (ds1 === ds3)); // Deve ser false
  
  // Teste 3: Estatísticas
  Logger.log('\nTeste 3: Estatísticas');
  var stats = ServiceManager.getStats();
  Logger.log('Total de serviços: ' + stats.totalServices);
  Logger.log('Total de acessos: ' + stats.totalAccesses);
  
  // Teste 4: Listar serviços
  Logger.log('\nTeste 4: Listar serviços');
  var services = ServiceManager.listServices();
  services.forEach(function(s) {
    Logger.log('  • ' + s.key + ' (' + s.accessCount + ' acessos)');
  });
  
  // Teste 5: Limpar serviço específico
  Logger.log('\nTeste 5: Limpar serviço');
  var cleared = ServiceManager.clearService('DataService', 'Rotas');
  Logger.log('Serviço limpo: ' + cleared);
  
  // Teste 6: Relatório completo
  Logger.log('\nTeste 6: Relatório completo');
  ServiceManager.printReport();
  
  Logger.log('\n✅ Testes concluídos!');
}

/**
 * Exemplo de uso do ServiceManager
 */
function exemploUsoServiceManager() {
  Logger.log('📚 Exemplo de uso do ServiceManager\n');
  
  // Uso básico
  var alunoService = ServiceManager.getDataService('Alunos');
  var result = alunoService.read();
  Logger.log('Alunos encontrados: ' + (result.data ? result.data.length : 0));
  
  // Reutilização (mesma instância)
  var alunoService2 = ServiceManager.getDataService('Alunos');
  Logger.log('Mesma instância: ' + (alunoService === alunoService2));
  
  // Diferentes planilhas (instâncias diferentes)
  var rotaService = ServiceManager.getDataService('Rotas');
  Logger.log('Instâncias diferentes: ' + (alunoService !== rotaService));
  
  // Estatísticas
  var stats = ServiceManager.getStats();
  Logger.log('\nEstatísticas:');
  Logger.log('  Total de serviços: ' + stats.totalServices);
  Logger.log('  Total de acessos: ' + stats.totalAccesses);
}
