/**
 * @file EventBus.gs
 * @description Event Bus Pattern - Comunicação desacoplada via eventos
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * O Event Bus permite comunicação entre módulos sem dependências diretas.
 * Módulos emitem eventos e outros módulos escutam esses eventos.
 * 
 * Benefícios:
 * - Desacoplamento total entre módulos
 * - Fácil adicionar/remover funcionalidades
 * - Comunicação assíncrona
 * - Facilita testes
 */

// ============================================================================
// EVENT BUS - PADRÃO DE BARRAMENTO DE EVENTOS
// ============================================================================

/**
 * @class EventBus
 * @description Barramento de eventos para comunicação desacoplada
 * 
 * @example
 * // Registrar listener
 * EventBus.on('user:login', function(user) {
 *   console.log('User logged in:', user.name);
 * });
 * 
 * // Emitir evento
 * EventBus.emit('user:login', { name: 'João', email: 'joao@example.com' });
 */
var EventBus = (function() {
  
  // Armazena listeners por evento
  var listeners = {};
  
  // Armazena listeners únicos (once)
  var onceListeners = {};
  
  // Histórico de eventos (para debug)
  var eventHistory = [];
  var maxHistorySize = 100;
  
  // Estatísticas
  var stats = {
    emitted: 0,
    listened: 0,
    errors: 0
  };
  
  return {
    /**
     * Registra listener para um evento
     * 
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     * @param {Object} options - Opções
     * @param {number} options.priority - Prioridade (maior = primeiro)
     * @return {Function} Função para remover o listener
     * 
     * @example
     * var unsubscribe = EventBus.on('user:login', function(user) {
     *   console.log('User:', user.name);
     * });
     * 
     * // Remover listener
     * unsubscribe();
     */
    on: function(event, callback, options) {
      options = options || {};
      
      if (!event || typeof event !== 'string') {
        throw new Error('Event name must be a non-empty string');
      }
      
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      if (!listeners[event]) {
        listeners[event] = [];
      }
      
      var listener = {
        callback: callback,
        priority: options.priority || 0,
        registered: new Date()
      };
      
      listeners[event].push(listener);
      
      // Ordena por prioridade (maior primeiro)
      listeners[event].sort(function(a, b) {
        return b.priority - a.priority;
      });
      
      // Retorna função para remover listener
      return function() {
        EventBus.off(event, callback);
      };
    },
    
    /**
     * Registra listener que executa apenas uma vez
     * 
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     * @return {Function} Função para remover o listener
     * 
     * @example
     * EventBus.once('app:ready', function() {
     *   console.log('App is ready!');
     * });
     */
    once: function(event, callback) {
      if (!onceListeners[event]) {
        onceListeners[event] = [];
      }
      
      onceListeners[event].push(callback);
      
      // Retorna função para remover listener
      return function() {
        var index = onceListeners[event].indexOf(callback);
        if (index > -1) {
          onceListeners[event].splice(index, 1);
        }
      };
    },
    
    /**
     * Emite um evento
     * 
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     * @param {Object} options - Opções
     * @param {boolean} options.async - Se true, executa assincronamente
     * @return {number} Quantidade de listeners executados
     * 
     * @example
     * EventBus.emit('user:login', {
     *   id: '123',
     *   name: 'João',
     *   email: 'joao@example.com'
     * });
     */
    emit: function(event, data, options) {
      options = options || {};
      var executedCount = 0;
      
      // Registra no histórico
      this._addToHistory(event, data);
      
      stats.emitted++;
      
      try {
        // Executa listeners normais
        if (listeners[event]) {
          listeners[event].forEach(function(listener) {
            try {
              if (options.async) {
                // Executa assincronamente
                setTimeout(function() {
                  listener.callback(data);
                }, 0);
              } else {
                // Executa sincronamente
                listener.callback(data);
              }
              executedCount++;
              stats.listened++;
            } catch (error) {
              stats.errors++;
              Logger.log('❌ Error in event listener for "' + event + '": ' + error.message);
            }
          });
        }
        
        // Executa listeners "once"
        if (onceListeners[event]) {
          var onceCallbacks = onceListeners[event].slice();
          delete onceListeners[event];
          
          onceCallbacks.forEach(function(callback) {
            try {
              callback(data);
              executedCount++;
              stats.listened++;
            } catch (error) {
              stats.errors++;
              Logger.log('❌ Error in once listener for "' + event + '": ' + error.message);
            }
          });
        }
        
        return executedCount;
        
      } catch (error) {
        stats.errors++;
        Logger.log('❌ Error emitting event "' + event + '": ' + error.message);
        return 0;
      }
    },
    
    /**
     * Remove listener de um evento
     * 
     * @param {string} event - Nome do evento
     * @param {Function} callback - Callback a remover (opcional)
     * @return {number} Quantidade de listeners removidos
     * 
     * @example
     * // Remove listener específico
     * EventBus.off('user:login', myCallback);
     * 
     * // Remove todos os listeners do evento
     * EventBus.off('user:login');
     */
    off: function(event, callback) {
      var removed = 0;
      
      if (!callback) {
        // Remove todos os listeners do evento
        if (listeners[event]) {
          removed = listeners[event].length;
          delete listeners[event];
        }
        if (onceListeners[event]) {
          removed += onceListeners[event].length;
          delete onceListeners[event];
        }
      } else {
        // Remove listener específico
        if (listeners[event]) {
          var initialLength = listeners[event].length;
          listeners[event] = listeners[event].filter(function(listener) {
            return listener.callback !== callback;
          });
          removed = initialLength - listeners[event].length;
        }
        
        if (onceListeners[event]) {
          var index = onceListeners[event].indexOf(callback);
          if (index > -1) {
            onceListeners[event].splice(index, 1);
            removed++;
          }
        }
      }
      
      return removed;
    },
    
    /**
     * Remove todos os listeners
     * 
     * @return {number} Quantidade de listeners removidos
     * 
     * @example
     * EventBus.clear();
     */
    clear: function() {
      var count = 0;
      
      Object.keys(listeners).forEach(function(event) {
        count += listeners[event].length;
      });
      
      Object.keys(onceListeners).forEach(function(event) {
        count += onceListeners[event].length;
      });
      
      listeners = {};
      onceListeners = {};
      
      return count;
    },
    
    /**
     * Lista todos os eventos registrados
     * 
     * @return {Array<Object>} Lista de eventos
     * 
     * @example
     * var events = EventBus.listEvents();
     * events.forEach(function(e) {
     *   console.log(e.name, 'listeners:', e.listenerCount);
     * });
     */
    listEvents: function() {
      var events = [];
      
      // Eventos normais
      Object.keys(listeners).forEach(function(event) {
        events.push({
          name: event,
          listenerCount: listeners[event].length,
          onceCount: onceListeners[event] ? onceListeners[event].length : 0,
          type: 'persistent'
        });
      });
      
      // Eventos "once" que não estão em listeners
      Object.keys(onceListeners).forEach(function(event) {
        if (!listeners[event]) {
          events.push({
            name: event,
            listenerCount: 0,
            onceCount: onceListeners[event].length,
            type: 'once'
          });
        }
      });
      
      return events;
    },
    
    /**
     * Obtém histórico de eventos
     * 
     * @param {number} limit - Limite de eventos (padrão: 10)
     * @return {Array<Object>} Histórico
     * 
     * @example
     * var history = EventBus.getHistory(5);
     * history.forEach(function(h) {
     *   console.log(h.event, 'at', h.timestamp);
     * });
     */
    getHistory: function(limit) {
      limit = limit || 10;
      return eventHistory.slice(-limit);
    },
    
    /**
     * Limpa histórico de eventos
     * 
     * @return {number} Quantidade de eventos removidos
     */
    clearHistory: function() {
      var count = eventHistory.length;
      eventHistory = [];
      return count;
    },
    
    /**
     * Obtém estatísticas
     * 
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = EventBus.getStats();
     * console.log('Emitted:', stats.emitted);
     */
    getStats: function() {
      var totalListeners = 0;
      var totalOnce = 0;
      
      Object.keys(listeners).forEach(function(event) {
        totalListeners += listeners[event].length;
      });
      
      Object.keys(onceListeners).forEach(function(event) {
        totalOnce += onceListeners[event].length;
      });
      
      return {
        emitted: stats.emitted,
        listened: stats.listened,
        errors: stats.errors,
        totalListeners: totalListeners,
        totalOnce: totalOnce,
        uniqueEvents: Object.keys(listeners).length,
        historySize: eventHistory.length
      };
    },
    
    /**
     * Reseta estatísticas
     */
    resetStats: function() {
      stats = {
        emitted: 0,
        listened: 0,
        errors: 0
      };
    },
    
    /**
     * Adiciona evento ao histórico
     * @private
     */
    _addToHistory: function(event, data) {
      eventHistory.push({
        event: event,
        data: data,
        timestamp: new Date()
      });
      
      // Limita tamanho do histórico
      if (eventHistory.length > maxHistorySize) {
        eventHistory.shift();
      }
    }
  };
})();

// ============================================================================
// EVENTOS PADRÃO DO SISTEMA
// ============================================================================

/**
 * Eventos padrão do sistema
 */
var SYSTEM_EVENTS = {
  // Aplicação
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  
  // Usuário
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  
  // Dados
  DATA_CREATED: 'data:created',
  DATA_UPDATED: 'data:updated',
  DATA_DELETED: 'data:deleted',
  DATA_LOADED: 'data:loaded',
  
  // UI
  UI_READY: 'ui:ready',
  UI_ERROR: 'ui:error',
  MODAL_OPENED: 'modal:opened',
  MODAL_CLOSED: 'modal:closed',
  
  // Sistema
  CACHE_CLEARED: 'cache:cleared',
  CONFIG_CHANGED: 'config:changed',
  ERROR_OCCURRED: 'error:occurred'
};

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa EventBus
 */
function testEventBus() {
  Logger.log('🧪 Testando EventBus...\n');
  
  try {
    var results = [];
    
    // Teste 1: Registrar e emitir evento
    Logger.log('Teste 1: Registrar e emitir evento');
    EventBus.on('test:event', function(data) {
      results.push('Event received: ' + data.message);
    });
    EventBus.emit('test:event', { message: 'Hello World' });
    Logger.log('✓ ' + results[0]);
    
    // Teste 2: Múltiplos listeners
    Logger.log('\nTeste 2: Múltiplos listeners');
    var count = 0;
    EventBus.on('test:multi', function() { count++; });
    EventBus.on('test:multi', function() { count++; });
    EventBus.on('test:multi', function() { count++; });
    EventBus.emit('test:multi');
    Logger.log('✓ Listeners executados: ' + count);
    
    // Teste 3: Once listener
    Logger.log('\nTeste 3: Once listener');
    var onceCount = 0;
    EventBus.once('test:once', function() { onceCount++; });
    EventBus.emit('test:once');
    EventBus.emit('test:once');
    Logger.log('✓ Once executado: ' + onceCount + ' vez(es)');
    
    // Teste 4: Prioridade
    Logger.log('\nTeste 4: Prioridade');
    var order = [];
    EventBus.on('test:priority', function() { order.push('low'); }, { priority: 1 });
    EventBus.on('test:priority', function() { order.push('high'); }, { priority: 10 });
    EventBus.on('test:priority', function() { order.push('medium'); }, { priority: 5 });
    EventBus.emit('test:priority');
    Logger.log('✓ Ordem de execução: ' + order.join(' -> '));
    
    // Teste 5: Remover listener
    Logger.log('\nTeste 5: Remover listener');
    var removeCount = 0;
    var callback = function() { removeCount++; };
    EventBus.on('test:remove', callback);
    EventBus.emit('test:remove');
    EventBus.off('test:remove', callback);
    EventBus.emit('test:remove');
    Logger.log('✓ Executado: ' + removeCount + ' vez(es)');
    
    // Teste 6: Listar eventos
    Logger.log('\nTeste 6: Listar eventos');
    var events = EventBus.listEvents();
    Logger.log('✓ Eventos registrados: ' + events.length);
    events.forEach(function(e) {
      Logger.log('  • ' + e.name + ' (' + e.listenerCount + ' listeners)');
    });
    
    // Teste 7: Histórico
    Logger.log('\nTeste 7: Histórico');
    var history = EventBus.getHistory(5);
    Logger.log('✓ Eventos no histórico: ' + history.length);
    
    // Teste 8: Estatísticas
    Logger.log('\nTeste 8: Estatísticas');
    var stats = EventBus.getStats();
    Logger.log('✓ Emitted: ' + stats.emitted);
    Logger.log('✓ Listened: ' + stats.listened);
    Logger.log('✓ Errors: ' + stats.errors);
    
    // Teste 9: Unsubscribe function
    Logger.log('\nTeste 9: Unsubscribe function');
    var unsubCount = 0;
    var unsubscribe = EventBus.on('test:unsub', function() { unsubCount++; });
    EventBus.emit('test:unsub');
    unsubscribe();
    EventBus.emit('test:unsub');
    Logger.log('✓ Executado: ' + unsubCount + ' vez(es)');
    
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
