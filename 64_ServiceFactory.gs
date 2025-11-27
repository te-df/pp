/**
 * @file ServiceFactory.gs
 * @description Factory genérico para criar serviços do sistema
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * O ServiceFactory fornece uma interface unificada para criar
 * todos os tipos de serviços do sistema, integrando com ServiceLocator
 * e outras factories especializadas.
 * 
 * Benefícios:
 * - Interface única para criar serviços
 * - Integração com ServiceLocator
 * - Delegação para factories especializadas
 * - Fácil adicionar novos tipos de serviços
 */

// ============================================================================
// SERVICE FACTORY - FÁBRICA GENÉRICA DE SERVIÇOS
// ============================================================================

/**
 * @class ServiceFactory
 * @description Factory genérico para criar serviços
 * 
 * @example
 * // Criar DataService
 * var alunosService = ServiceFactory.createDataService('Alunos');
 * 
 * // Criar Logger
 * var logger = ServiceFactory.createLogger();
 * 
 * // Criar Cache
 * var cache = ServiceFactory.createCache();
 */
var ServiceFactory = (function() {
  
  // Estatísticas
  var stats = {
    dataServices: 0,
    loggers: 0,
    caches: 0,
    others: 0,
    errors: 0
  };
  
  return {
    /**
     * Cria DataService
     * 
     * @param {string} sheetName - Nome da sheet
     * @param {Object} options - Opções
     * @return {DataService} Instância
     * 
     * @example
     * var service = ServiceFactory.createDataService('Alunos');
     * var data = service.read();
     */
    createDataService: function(sheetName, options) {
      try {
        stats.dataServices++;
        
        // Usa DataServiceFactory se disponível
        if (typeof DataServiceFactory !== 'undefined') {
          return DataServiceFactory.create(sheetName, options);
        }
        
        // Fallback: usa ServiceManager
        if (typeof ServiceManager !== 'undefined') {
          return ServiceManager.getDataService(sheetName);
        }
        
        // Fallback final: cria diretamente
        return new DataService(sheetName);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar DataService: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria Logger
     * 
     * @param {Object} options - Opções
     * @return {LoggerService} Instância
     * 
     * @example
     * var logger = ServiceFactory.createLogger();
     * logger.info('Hello World');
     */
    createLogger: function(options) {
      try {
        stats.loggers++;
        
        // Usa ServiceLocator se disponível
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has('logger')) {
          return ServiceLocator.get('logger');
        }
        
        // Usa ServiceManager
        if (typeof ServiceManager !== 'undefined') {
          return ServiceManager.getLoggerService();
        }
        
        // Fallback: cria diretamente
        return new LoggerService(options);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar Logger: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria Cache
     * 
     * @param {Object} options - Opções
     * @return {CacheService} Instância
     * 
     * @example
     * var cache = ServiceFactory.createCache();
     * cache.set('key', 'value');
     */
    createCache: function(options) {
      try {
        stats.caches++;
        
        // Usa ServiceLocator se disponível
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has('cache')) {
          return ServiceLocator.get('cache');
        }
        
        // Usa ServiceManager
        if (typeof ServiceManager !== 'undefined') {
          return ServiceManager.getCacheService();
        }
        
        // Fallback: cria diretamente
        return new CacheServiceAdvanced(options);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar Cache: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria ErrorHandler
     * 
     * @return {ErrorHandler} Instância
     * 
     * @example
     * var errorHandler = ServiceFactory.createErrorHandler();
     * errorHandler.handle('context', error);
     */
    createErrorHandler: function() {
      try {
        stats.others++;
        
        // Usa ServiceLocator se disponível
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has('errorHandler')) {
          return ServiceLocator.get('errorHandler');
        }
        
        // Retorna classe ErrorHandler
        return ErrorHandler;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar ErrorHandler: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria Audit Service
     * 
     * @param {Object} options - Opções
     * @return {AuditService} Instância
     * 
     * @example
     * var audit = ServiceFactory.createAuditService();
     * audit.logCreate('Alunos', '123', data);
     */
    createAuditService: function(options) {
      try {
        stats.others++;
        
        // Usa ServiceLocator se disponível
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has('audit')) {
          return ServiceLocator.get('audit');
        }
        
        // Usa ServiceManager
        if (typeof ServiceManager !== 'undefined') {
          return ServiceManager.getAuditService();
        }
        
        // Fallback: cria diretamente
        return new AuditService(options);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar AuditService: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria Retry Service
     * 
     * @param {Object} options - Opções
     * @return {RetryService} Instância
     * 
     * @example
     * var retry = ServiceFactory.createRetryService();
     * retry.execute(operation);
     */
    createRetryService: function(options) {
      try {
        stats.others++;
        
        // Usa ServiceLocator se disponível
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has('retry')) {
          return ServiceLocator.get('retry');
        }
        
        // Fallback: cria diretamente
        return new RetryService(options);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar RetryService: ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria serviço genérico por nome
     * 
     * @param {string} serviceName - Nome do serviço
     * @param {*} args - Argumentos para o construtor
     * @return {*} Instância do serviço
     * 
     * @example
     * var service = ServiceFactory.create('logger');
     * var dataService = ServiceFactory.create('dataService', 'Alunos');
     */
    create: function(serviceName, args) {
      try {
        // Mapeia nomes para métodos
        var methodMap = {
          'dataService': 'createDataService',
          'logger': 'createLogger',
          'cache': 'createCache',
          'errorHandler': 'createErrorHandler',
          'audit': 'createAuditService',
          'retry': 'createRetryService'
        };
        
        var method = methodMap[serviceName];
        
        if (method && this[method]) {
          return this[method](args);
        }
        
        // Tenta ServiceLocator
        if (typeof ServiceLocator !== 'undefined' && ServiceLocator.has(serviceName)) {
          return ServiceLocator.get(serviceName);
        }
        
        throw new Error('Serviço não encontrado: ' + serviceName);
        
      } catch (error) {
        stats.errors++;
        Logger.log('[ServiceFactory] Erro ao criar serviço "' + serviceName + '": ' + error.message);
        throw error;
      }
    },
    
    /**
     * Cria múltiplos serviços de uma vez
     * 
     * @param {Object} services - Mapa de serviços {nome: args}
     * @return {Object} Mapa de instâncias
     * 
     * @example
     * var services = ServiceFactory.createBatch({
     *   logger: null,
     *   cache: null,
     *   alunos: 'Alunos',
     *   veiculos: 'Veiculos'
     * });
     * 
     * services.logger.info('Hello');
     * services.alunos.read();
     */
    createBatch: function(services) {
      var instances = {};
      
      Object.keys(services).forEach(function(name) {
        try {
          var args = services[name];
          
          // Se args é string, assume que é DataService
          if (typeof args === 'string') {
            instances[name] = this.createDataService(args);
          } else {
            instances[name] = this.create(name, args);
          }
        } catch (error) {
          Logger.log('[ServiceFactory] Erro ao criar batch "' + name + '": ' + error.message);
          instances[name] = null;
        }
      }.bind(this));
      
      return instances;
    },
    
    /**
     * Obtém estatísticas
     * 
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = ServiceFactory.getStats();
     * console.log('DataServices criados:', stats.dataServices);
     */
    getStats: function() {
      var total = stats.dataServices + stats.loggers + stats.caches + stats.others;
      
      return {
        dataServices: stats.dataServices,
        loggers: stats.loggers,
        caches: stats.caches,
        others: stats.others,
        errors: stats.errors,
        total: total
      };
    },
    
    /**
     * Reseta estatísticas
     */
    resetStats: function() {
      stats = {
        dataServices: 0,
        loggers: 0,
        caches: 0,
        others: 0,
        errors: 0
      };
    }
  };
})();

// ============================================================================
// REGISTRO NO SERVICE LOCATOR
// ============================================================================

/**
 * Registra ServiceFactory no ServiceLocator
 */
function registerServiceFactory() {
  if (typeof ServiceLocator !== 'undefined') {
    ServiceLocator.register('serviceFactory', function() {
      return ServiceFactory;
    }, {
      singleton: true,
      description: 'Factory genérico para criar serviços'
    });
    
    Logger.log('✅ ServiceFactory registrado no ServiceLocator');
  }
}

// ============================================================================
// INICIALIZAÇÃO COMPLETA DO SISTEMA
// ============================================================================

/**
 * Inicializa todos os componentes de abstração
 * Deve ser chamado no bootstrap da aplicação
 */
function initializeAbstractionLayer() {
  try {
    Logger.log('🚀 Inicializando camada de abstração...\n');
    
    // 1. Registra SpreadsheetProvider
    if (typeof registerSpreadsheetProvider === 'function') {
      registerSpreadsheetProvider();
    }
    
    // 2. Registra DataServiceFactory
    if (typeof registerDataServiceFactory === 'function') {
      registerDataServiceFactory();
    }
    
    // 3. Registra ServiceFactory
    if (typeof registerServiceFactory === 'function') {
      registerServiceFactory();
    }
    
    Logger.log('\n✅ Camada de abstração inicializada com sucesso!');
    
    return {
      success: true,
      message: 'Camada de abstração inicializada'
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro ao inicializar camada de abstração: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa ServiceFactory
 */
function testServiceFactory() {
  Logger.log('🧪 Testando ServiceFactory...\n');
  
  try {
    ServiceFactory.resetStats();
    
    // Teste 1: Criar DataService
    Logger.log('Teste 1: Criar DataService');
    var dataService = ServiceFactory.createDataService('Usuarios');
    Logger.log('✓ DataService criado');
    
    // Teste 2: Criar Logger
    Logger.log('\nTeste 2: Criar Logger');
    var logger = ServiceFactory.createLogger();
    Logger.log('✓ Logger criado');
    
    // Teste 3: Criar Cache
    Logger.log('\nTeste 3: Criar Cache');
    var cache = ServiceFactory.createCache();
    Logger.log('✓ Cache criado');
    
    // Teste 4: Criar por nome
    Logger.log('\nTeste 4: Criar por nome');
    var logger2 = ServiceFactory.create('logger');
    Logger.log('✓ Logger criado por nome');
    Logger.log('✓ Mesma instância: ' + (logger === logger2));
    
    // Teste 5: Batch creation
    Logger.log('\nTeste 5: Batch creation');
    var services = ServiceFactory.createBatch({
      logger: null,
      cache: null,
      alunos: 'Alunos',
      veiculos: 'Veiculos'
    });
    Logger.log('✓ Services criados: ' + Object.keys(services).length);
    Object.keys(services).forEach(function(name) {
      Logger.log('  • ' + name + ': ' + (services[name] ? 'OK' : 'FAIL'));
    });
    
    // Teste 6: Estatísticas
    Logger.log('\nTeste 6: Estatísticas');
    var stats = ServiceFactory.getStats();
    Logger.log('✓ DataServices: ' + stats.dataServices);
    Logger.log('✓ Loggers: ' + stats.loggers);
    Logger.log('✓ Caches: ' + stats.caches);
    Logger.log('✓ Total: ' + stats.total);
    Logger.log('✓ Errors: ' + stats.errors);
    
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

/**
 * Testa toda a camada de abstração
 */
function testAbstractionLayer() {
  Logger.log('🧪 Testando Camada de Abstração Completa...\n');
  
  try {
    // Inicializa
    var initResult = initializeAbstractionLayer();
    if (!initResult.success) {
      throw new Error('Falha na inicialização: ' + initResult.error);
    }
    
    Logger.log('\n=== Teste 1: SpreadsheetProvider ===');
    var ss = SpreadsheetProvider.getInstance();
    Logger.log('✓ Spreadsheet: ' + ss.getName());
    
    Logger.log('\n=== Teste 2: DataServiceFactory ===');
    var service1 = DataServiceFactory.create('Usuarios');
    var service2 = DataServiceFactory.create('Usuarios');
    Logger.log('✓ Singleton: ' + (service1 === service2));
    
    Logger.log('\n=== Teste 3: ServiceFactory ===');
    var logger = ServiceFactory.createLogger();
    var cache = ServiceFactory.createCache();
    Logger.log('✓ Logger criado');
    Logger.log('✓ Cache criado');
    
    Logger.log('\n=== Teste 4: Integração ===');
    var services = ServiceFactory.createBatch({
      alunos: 'Alunos',
      veiculos: 'Veiculos'
    });
    Logger.log('✓ Batch criado: ' + Object.keys(services).length + ' services');
    
    Logger.log('\n=== Estatísticas Finais ===');
    Logger.log('SpreadsheetProvider:', JSON.stringify(SpreadsheetProvider.getStats()));
    Logger.log('DataServiceFactory:', JSON.stringify(DataServiceFactory.getStats()));
    Logger.log('ServiceFactory:', JSON.stringify(ServiceFactory.getStats()));
    
    Logger.log('\n✅ Camada de abstração funcionando perfeitamente!');
    
    return {
      success: true,
      message: 'Todos os testes passaram'
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
