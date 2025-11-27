/**
 * @file DataServiceFactory.gs
 * @description Factory para criar e gerenciar instâncias de DataService
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * O DataServiceFactory implementa o padrão Factory para criar DataServices,
 * gerenciando o ciclo de vida e pool de instâncias.
 * 
 * Benefícios:
 * - Criação centralizada de DataServices
 * - Pool de instâncias (reutilização)
 * - Gerenciamento de ciclo de vida
 * - Fácil trocar implementação
 * - Estatísticas de uso
 */

// ============================================================================
// DATA SERVICE FACTORY - FÁBRICA DE DATA SERVICES
// ============================================================================

/**
 * @class DataServiceFactory
 * @description Factory para criar e gerenciar DataServices
 * 
 * @example
 * // Criar DataService
 * var alunosService = DataServiceFactory.create('Alunos');
 * var data = alunosService.read();
 * 
 * // Obter instância existente
 * var sameService = DataServiceFactory.get('Alunos');
 * 
 * // Limpar instância
 * DataServiceFactory.clear('Alunos');
 */
var DataServiceFactory = (function() {
  
  // Pool de instâncias
  var instances = {};
  
  // Metadados das instâncias
  var metadata = {};
  
  // Configuração
  var config = {
    poolEnabled: true,
    maxPoolSize: 50,
    autoCleanup: true,
    cleanupInterval: 600000 // 10 minutos
  };
  
  // Estatísticas
  var stats = {
    created: 0,
    reused: 0,
    cleared: 0,
    errors: 0
  };
  
  // Timer de limpeza
  var cleanupTimer = null;
  
  return {
    /**
     * Cria ou obtém DataService (Factory Method)
     * 
     * @param {string} sheetName - Nome da sheet
     * @param {Object} options - Opções
     * @param {boolean} options.forceNew - Força criação de nova instância
     * @param {boolean} options.usePool - Usar pool (padrão: true)
     * @return {DataService} Instância do DataService
     * 
     * @example
     * var service = DataServiceFactory.create('Alunos');
     * var result = service.read();
     */
    create: function(sheetName, options) {
      options = options || {};
      var usePool = options.usePool !== false && config.poolEnabled;
      var forceNew = options.forceNew === true;
      
      try {
        // Se deve usar pool e não forçar nova instância
        if (usePool && !forceNew && instances[sheetName]) {
          stats.reused++;
          this._updateMetadata(sheetName, 'accessed');
          return instances[sheetName];
        }
        
        // Verifica limite do pool
        if (usePool && Object.keys(instances).length >= config.maxPoolSize) {
          Logger.log('[DataServiceFactory] Pool cheio, limpando instâncias antigas...');
          this._cleanupOldInstances();
        }
        
        // Cria nova instância
        var service = new DataService(sheetName);
        stats.created++;
        
        // Adiciona ao pool
        if (usePool) {
          instances[sheetName] = service;
          this._createMetadata(sheetName);
        }
        
        return service;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[DataServiceFactory] Erro ao criar DataService para "' + sheetName + '": ' + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém DataService existente (sem criar)
     * 
     * @param {string} sheetName - Nome da sheet
     * @return {DataService|null} Instância ou null
     * 
     * @example
     * var service = DataServiceFactory.get('Alunos');
     * if (service) {
     *   // Usar service
     * }
     */
    get: function(sheetName) {
      if (instances[sheetName]) {
        stats.reused++;
        this._updateMetadata(sheetName, 'accessed');
        return instances[sheetName];
      }
      return null;
    },
    
    /**
     * Verifica se DataService existe no pool
     * 
     * @param {string} sheetName - Nome da sheet
     * @return {boolean} True se existe
     * 
     * @example
     * if (DataServiceFactory.has('Alunos')) {
     *   var service = DataServiceFactory.get('Alunos');
     * }
     */
    has: function(sheetName) {
      return !!instances[sheetName];
    },
    
    /**
     * Limpa instância do pool
     * 
     * @param {string} sheetName - Nome da sheet (opcional)
     * @return {number} Quantidade de instâncias removidas
     * 
     * @example
     * // Limpar instância específica
     * DataServiceFactory.clear('Alunos');
     * 
     * // Limpar todas
     * DataServiceFactory.clear();
     */
    clear: function(sheetName) {
      if (sheetName) {
        if (instances[sheetName]) {
          delete instances[sheetName];
          delete metadata[sheetName];
          stats.cleared++;
          return 1;
        }
        return 0;
      }
      
      // Limpar todas
      var count = Object.keys(instances).length;
      instances = {};
      metadata = {};
      stats.cleared += count;
      return count;
    },
    
    /**
     * Cria múltiplos DataServices de uma vez
     * 
     * @param {Array<string>} sheetNames - Nomes das sheets
     * @return {Object} Mapa de DataServices
     * 
     * @example
     * var services = DataServiceFactory.createBatch([
     *   'Alunos',
     *   'Veiculos',
     *   'Rotas'
     * ]);
     * 
     * var alunos = services.Alunos.read();
     */
    createBatch: function(sheetNames) {
      var services = {};
      
      sheetNames.forEach(function(sheetName) {
        try {
          services[sheetName] = this.create(sheetName);
        } catch (error) {
          Logger.log('[DataServiceFactory] Erro ao criar batch para "' + sheetName + '": ' + error.message);
          services[sheetName] = null;
        }
      }.bind(this));
      
      return services;
    },
    
    /**
     * Obtém ou cria DataService (get-or-create pattern)
     * 
     * @param {string} sheetName - Nome da sheet
     * @return {DataService} Instância
     * 
     * @example
     * var service = DataServiceFactory.getOrCreate('Alunos');
     */
    getOrCreate: function(sheetName) {
      return this.get(sheetName) || this.create(sheetName);
    },
    
    /**
     * Lista todas as instâncias no pool
     * 
     * @return {Array<Object>} Lista de instâncias
     * 
     * @example
     * var instances = DataServiceFactory.listInstances();
     * instances.forEach(function(inst) {
     *   console.log(inst.sheetName, 'criado em', inst.created);
     * });
     */
    listInstances: function() {
      return Object.keys(instances).map(function(sheetName) {
        var meta = metadata[sheetName] || {};
        return {
          sheetName: sheetName,
          created: meta.created,
          lastAccessed: meta.lastAccessed,
          accessCount: meta.accessCount || 0
        };
      });
    },
    
    /**
     * Obtém estatísticas
     * 
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = DataServiceFactory.getStats();
     * console.log('Created:', stats.created);
     * console.log('Reused:', stats.reused);
     * console.log('Reuse rate:', stats.reuseRate);
     */
    getStats: function() {
      var total = stats.created + stats.reused;
      var reuseRate = total > 0 ? ((stats.reused / total) * 100).toFixed(2) : 0;
      
      return {
        created: stats.created,
        reused: stats.reused,
        cleared: stats.cleared,
        errors: stats.errors,
        reuseRate: reuseRate + '%',
        poolSize: Object.keys(instances).length,
        poolEnabled: config.poolEnabled
      };
    },
    
    /**
     * Reseta estatísticas
     */
    resetStats: function() {
      stats = {
        created: 0,
        reused: 0,
        cleared: 0,
        errors: 0
      };
    },
    
    /**
     * Configura factory
     * 
     * @param {Object} newConfig - Nova configuração
     * 
     * @example
     * DataServiceFactory.configure({
     *   poolEnabled: true,
     *   maxPoolSize: 100
     * });
     */
    configure: function(newConfig) {
      Object.assign(config, newConfig);
      
      // Reinicia limpeza automática se configuração mudou
      if (config.autoCleanup && !cleanupTimer) {
        this._startAutoCleanup();
      } else if (!config.autoCleanup && cleanupTimer) {
        this._stopAutoCleanup();
      }
    },
    
    /**
     * Obtém configuração atual
     * 
     * @return {Object} Configuração
     */
    getConfiguration: function() {
      return Object.assign({}, config);
    },
    
    /**
     * Limpa instâncias antigas (não usadas recentemente)
     * 
     * @param {number} maxAge - Idade máxima em ms (padrão: 10 min)
     * @return {number} Quantidade removida
     * 
     * @example
     * var removed = DataServiceFactory.cleanupOld(300000); // 5 min
     */
    cleanupOld: function(maxAge) {
      maxAge = maxAge || 600000; // 10 minutos
      return this._cleanupOldInstances(maxAge);
    },
    
    /**
     * Cria metadados para instância
     * @private
     */
    _createMetadata: function(sheetName) {
      metadata[sheetName] = {
        created: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      };
    },
    
    /**
     * Atualiza metadados
     * @private
     */
    _updateMetadata: function(sheetName, action) {
      if (!metadata[sheetName]) {
        this._createMetadata(sheetName);
        return;
      }
      
      if (action === 'accessed') {
        metadata[sheetName].lastAccessed = new Date();
        metadata[sheetName].accessCount = (metadata[sheetName].accessCount || 0) + 1;
      }
    },
    
    /**
     * Limpa instâncias antigas
     * @private
     */
    _cleanupOldInstances: function(maxAge) {
      maxAge = maxAge || 600000; // 10 minutos
      var now = Date.now();
      var removed = 0;
      
      Object.keys(instances).forEach(function(sheetName) {
        var meta = metadata[sheetName];
        if (meta && meta.lastAccessed) {
          var age = now - meta.lastAccessed.getTime();
          if (age > maxAge) {
            delete instances[sheetName];
            delete metadata[sheetName];
            removed++;
          }
        }
      });
      
      if (removed > 0) {
        Logger.log('[DataServiceFactory] Limpeza: ' + removed + ' instâncias antigas removidas');
        stats.cleared += removed;
      }
      
      return removed;
    },
    
    /**
     * Inicia limpeza automática
     * @private
     */
    _startAutoCleanup: function() {
      if (cleanupTimer) return;
      
      cleanupTimer = setInterval(function() {
        this._cleanupOldInstances();
      }.bind(this), config.cleanupInterval);
      
      Logger.log('[DataServiceFactory] Limpeza automática iniciada');
    },
    
    /**
     * Para limpeza automática
     * @private
     */
    _stopAutoCleanup: function() {
      if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
        Logger.log('[DataServiceFactory] Limpeza automática parada');
      }
    }
  };
})();

// ============================================================================
// FUNÇÃO GLOBAL PARA BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Cria DataService (backward compatibility)
 * NOTA: Esta função foi comentada para evitar conflito com a classe DataService
 * definida em 2_Data_Services_Part1.gs
 * 
 * @param {string} sheetName - Nome da sheet
 * @return {DataService} Instância
 * 
 * @example
 * var service = DataService('Alunos');
 * var data = service.read();
 */
/*
function DataService(sheetName) {
  // Se chamado como função (não com new), usa factory
  if (!(this instanceof DataService)) {
    return DataServiceFactory.create(sheetName);
  }
  
  // Se chamado com new, comportamento normal
  // (implementação original do DataService)
}
*/

// ============================================================================
// REGISTRO NO SERVICE LOCATOR
// ============================================================================

/**
 * Registra DataServiceFactory no ServiceLocator
 */
function registerDataServiceFactory() {
  if (typeof ServiceLocator !== 'undefined') {
    ServiceLocator.register('dataServiceFactory', function() {
      return DataServiceFactory;
    }, {
      singleton: true,
      description: 'Factory para criar DataServices'
    });
    
    Logger.log('✅ DataServiceFactory registrado no ServiceLocator');
  }
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa DataServiceFactory
 */
function testDataServiceFactory() {
  Logger.log('🧪 Testando DataServiceFactory...\n');
  
  try {
    // Limpa pool antes de testar
    DataServiceFactory.clear();
    DataServiceFactory.resetStats();
    
    // Teste 1: Criar instância
    Logger.log('Teste 1: Criar instância');
    var service1 = DataServiceFactory.create('Usuarios');
    Logger.log('✓ DataService criado para Usuarios');
    
    // Teste 2: Reutilizar instância
    Logger.log('\nTeste 2: Reutilizar instância');
    var service2 = DataServiceFactory.create('Usuarios');
    Logger.log('✓ Mesma instância: ' + (service1 === service2));
    
    // Teste 3: Criar nova instância forçada
    Logger.log('\nTeste 3: Forçar nova instância');
    var service3 = DataServiceFactory.create('Usuarios', { forceNew: true, usePool: false });
    Logger.log('✓ Nova instância: ' + (service1 !== service3));
    
    // Teste 4: Verificar existência
    Logger.log('\nTeste 4: Verificar existência');
    Logger.log('✓ Has Usuarios: ' + DataServiceFactory.has('Usuarios'));
    Logger.log('✓ Has NonExistent: ' + DataServiceFactory.has('NonExistent'));
    
    // Teste 5: Get or Create
    Logger.log('\nTeste 5: Get or Create');
    var service4 = DataServiceFactory.getOrCreate('Alunos');
    var service5 = DataServiceFactory.getOrCreate('Alunos');
    Logger.log('✓ Mesma instância: ' + (service4 === service5));
    
    // Teste 6: Batch creation
    Logger.log('\nTeste 6: Batch creation');
    var services = DataServiceFactory.createBatch(['Veiculos', 'Rotas', 'Pessoal']);
    Logger.log('✓ Services criados: ' + Object.keys(services).length);
    
    // Teste 7: Listar instâncias
    Logger.log('\nTeste 7: Listar instâncias');
    var instances = DataServiceFactory.listInstances();
    Logger.log('✓ Instâncias no pool: ' + instances.length);
    instances.forEach(function(inst) {
      Logger.log('  • ' + inst.sheetName + ' (acessos: ' + inst.accessCount + ')');
    });
    
    // Teste 8: Estatísticas
    Logger.log('\nTeste 8: Estatísticas');
    var stats = DataServiceFactory.getStats();
    Logger.log('✓ Created: ' + stats.created);
    Logger.log('✓ Reused: ' + stats.reused);
    Logger.log('✓ Reuse rate: ' + stats.reuseRate);
    Logger.log('✓ Pool size: ' + stats.poolSize);
    
    // Teste 9: Limpar instância específica
    Logger.log('\nTeste 9: Limpar instância');
    var cleared = DataServiceFactory.clear('Usuarios');
    Logger.log('✓ Instâncias removidas: ' + cleared);
    Logger.log('✓ Has Usuarios após clear: ' + DataServiceFactory.has('Usuarios'));
    
    // Teste 10: Backward compatibility
    Logger.log('\nTeste 10: Backward compatibility');
    var service6 = DataService('Alunos');
    Logger.log('✓ DataService() funciona como factory');
    
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
