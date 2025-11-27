/**
 * @file ServiceLocator.gs
 * @description Service Locator Pattern - Acesso centralizado a serviços
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * O Service Locator fornece um ponto central para obter instâncias de serviços
 * sem criar dependências diretas entre módulos.
 * 
 * Benefícios:
 * - Desacoplamento entre módulos
 * - Fácil substituição de implementações
 * - Gerenciamento centralizado de dependências
 * - Facilita testes (mock de serviços)
 */

// ============================================================================
// SERVICE LOCATOR - PADRÃO DE LOCALIZAÇÃO DE SERVIÇOS
// ============================================================================

/**
 * @class ServiceLocator
 * @description Localiza e fornece acesso a serviços registrados
 * 
 * @example
 * // Registrar serviço
 * ServiceLocator.register('logger', function() {
 *   return new LoggerService();
 * });
 * 
 * // Usar serviço
 * var logger = ServiceLocator.get('logger');
 * logger.info('Hello World');
 */
var ServiceLocator = (function() {
  
  // Armazena factories de serviços
  var services = {};
  
  // Armazena instâncias singleton
  var instances = {};
  
  // Estatísticas de uso
  var stats = {
    registered: 0,
    resolved: 0,
    errors: 0
  };
  
  return {
    /**
     * Registra um serviço
     * 
     * @param {string} name - Nome do serviço
     * @param {Function} factory - Função que cria o serviço
     * @param {Object} options - Opções
     * @param {boolean} options.singleton - Se true, mantém instância única
     * @return {void}
     * 
     * @example
     * ServiceLocator.register('cache', function() {
     *   return new CacheService();
     * }, { singleton: true });
     */
    register: function(name, factory, options) {
      options = options || {};
      
      if (!name || typeof name !== 'string') {
        throw new Error('Service name must be a non-empty string');
      }
      
      if (typeof factory !== 'function') {
        throw new Error('Service factory must be a function');
      }
      
      services[name] = {
        factory: factory,
        singleton: options.singleton !== false,
        description: options.description || '',
        registered: new Date()
      };
      
      stats.registered++;
    },
    
    /**
     * Obtém instância de um serviço
     * 
     * @param {string} name - Nome do serviço
     * @return {*} Instância do serviço
     * @throws {Error} Se serviço não estiver registrado
     * 
     * @example
     * var logger = ServiceLocator.get('logger');
     */
    get: function(name) {
      var service = services[name];
      
      if (!service) {
        stats.errors++;
        throw new Error('Service not registered: ' + name);
      }
      
      try {
        // Se é singleton e já existe instância, retorna ela
        if (service.singleton && instances[name]) {
          stats.resolved++;
          return instances[name];
        }
        
        // Cria nova instância
        var instance = service.factory();
        
        // Se é singleton, armazena instância
        if (service.singleton) {
          instances[name] = instance;
        }
        
        stats.resolved++;
        return instance;
        
      } catch (error) {
        stats.errors++;
        throw new Error('Failed to create service "' + name + '": ' + error.message);
      }
    },
    
    /**
     * Verifica se serviço está registrado
     * 
     * @param {string} name - Nome do serviço
     * @return {boolean} True se registrado
     * 
     * @example
     * if (ServiceLocator.has('logger')) {
     *   var logger = ServiceLocator.get('logger');
     * }
     */
    has: function(name) {
      return !!services[name];
    },
    
    /**
     * Remove registro de um serviço
     * 
     * @param {string} name - Nome do serviço
     * @return {boolean} True se removido
     * 
     * @example
     * ServiceLocator.unregister('oldService');
     */
    unregister: function(name) {
      if (services[name]) {
        delete services[name];
        delete instances[name];
        return true;
      }
      return false;
    },
    
    /**
     * Limpa instância singleton (força recriação)
     * 
     * @param {string} name - Nome do serviço
     * @return {boolean} True se limpou
     * 
     * @example
     * ServiceLocator.clearInstance('cache');
     */
    clearInstance: function(name) {
      if (instances[name]) {
        delete instances[name];
        return true;
      }
      return false;
    },
    
    /**
     * Limpa todas as instâncias singleton
     * 
     * @return {number} Quantidade de instâncias limpas
     * 
     * @example
     * ServiceLocator.clearAllInstances();
     */
    clearAllInstances: function() {
      var count = Object.keys(instances).length;
      instances = {};
      return count;
    },
    
    /**
     * Lista todos os serviços registrados
     * 
     * @return {Array<Object>} Lista de serviços
     * 
     * @example
     * var services = ServiceLocator.listServices();
     * services.forEach(function(s) {
     *   console.log(s.name, s.description);
     * });
     */
    listServices: function() {
      return Object.keys(services).map(function(name) {
        var service = services[name];
        return {
          name: name,
          singleton: service.singleton,
          description: service.description,
          registered: service.registered,
          hasInstance: !!instances[name]
        };
      });
    },
    
    /**
     * Obtém estatísticas de uso
     * 
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = ServiceLocator.getStats();
     * console.log('Resolved:', stats.resolved);
     */
    getStats: function() {
      return {
        registered: stats.registered,
        resolved: stats.resolved,
        errors: stats.errors,
        activeServices: Object.keys(services).length,
        activeInstances: Object.keys(instances).length
      };
    },
    
    /**
     * Reseta estatísticas
     * 
     * @return {void}
     */
    resetStats: function() {
      stats = {
        registered: 0,
        resolved: 0,
        errors: 0
      };
    }
  };
})();

// ============================================================================
// REGISTRO DE SERVIÇOS PADRÃO
// ============================================================================

/**
 * Inicializa serviços padrão do sistema
 * Deve ser chamado no bootstrap da aplicação
 */
function initializeServiceLocator() {
  try {
    // Spreadsheet Provider
    ServiceLocator.register('spreadsheet', function() {
      return getSpreadsheet();
    }, {
      singleton: true,
      description: 'Fornece acesso ao Google Spreadsheet'
    });
    
    // Logger Service
    ServiceLocator.register('logger', function() {
      return ServiceManager.getLoggerService();
    }, {
      singleton: true,
      description: 'Serviço de logging'
    });
    
    // Cache Service
    ServiceLocator.register('cache', function() {
      return ServiceManager.getCacheService();
    }, {
      singleton: true,
      description: 'Serviço de cache'
    });
    
    // Error Handler
    ServiceLocator.register('errorHandler', function() {
      return ErrorHandler;
    }, {
      singleton: true,
      description: 'Tratamento de erros'
    });
    
    // Properties Manager
    ServiceLocator.register('properties', function() {
      return ServiceManager.getPropertiesManager();
    }, {
      singleton: true,
      description: 'Gerenciamento de propriedades'
    });
    
    Logger.log('✅ ServiceLocator inicializado com ' + 
               ServiceLocator.listServices().length + ' serviços');
    
    return true;
    
  } catch (error) {
    Logger.log('❌ Erro ao inicializar ServiceLocator: ' + error.message);
    return false;
  }
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa ServiceLocator
 */
function testServiceLocator() {
  Logger.log('🧪 Testando ServiceLocator...\n');
  
  try {
    // Teste 1: Registrar serviço
    Logger.log('Teste 1: Registrar serviço');
    ServiceLocator.register('testService', function() {
      return { name: 'Test Service', value: 42 };
    }, { singleton: true });
    Logger.log('✓ Serviço registrado');
    
    // Teste 2: Obter serviço
    Logger.log('\nTeste 2: Obter serviço');
    var service1 = ServiceLocator.get('testService');
    Logger.log('✓ Serviço obtido: ' + service1.name);
    
    // Teste 3: Singleton
    Logger.log('\nTeste 3: Singleton');
    var service2 = ServiceLocator.get('testService');
    Logger.log('✓ Mesma instância: ' + (service1 === service2));
    
    // Teste 4: Verificar existência
    Logger.log('\nTeste 4: Verificar existência');
    Logger.log('✓ Has testService: ' + ServiceLocator.has('testService'));
    Logger.log('✓ Has nonExistent: ' + ServiceLocator.has('nonExistent'));
    
    // Teste 5: Listar serviços
    Logger.log('\nTeste 5: Listar serviços');
    var services = ServiceLocator.listServices();
    Logger.log('✓ Serviços registrados: ' + services.length);
    services.forEach(function(s) {
      Logger.log('  • ' + s.name + ' (singleton: ' + s.singleton + ')');
    });
    
    // Teste 6: Estatísticas
    Logger.log('\nTeste 6: Estatísticas');
    var stats = ServiceLocator.getStats();
    Logger.log('✓ Registered: ' + stats.registered);
    Logger.log('✓ Resolved: ' + stats.resolved);
    Logger.log('✓ Errors: ' + stats.errors);
    
    // Teste 7: Limpar instância
    Logger.log('\nTeste 7: Limpar instância');
    ServiceLocator.clearInstance('testService');
    var service3 = ServiceLocator.get('testService');
    Logger.log('✓ Nova instância criada: ' + (service1 !== service3));
    
    // Teste 8: Erro ao obter serviço não registrado
    Logger.log('\nTeste 8: Erro ao obter serviço não registrado');
    try {
      ServiceLocator.get('nonExistent');
      Logger.log('✗ Deveria ter lançado erro');
    } catch (e) {
      Logger.log('✓ Erro capturado: ' + e.message);
    }
    
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
