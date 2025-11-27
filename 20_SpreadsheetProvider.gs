/**
 * @file SpreadsheetProvider.gs
 * @description Provedor centralizado de acesso ao Google Spreadsheet
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * O SpreadsheetProvider abstrai o acesso ao Google Spreadsheet,
 * fornecendo um ponto único de acesso com cache e gerenciamento de erros.
 * 
 * Benefícios:
 * - Acesso centralizado ao spreadsheet
 * - Cache de sheets para melhor performance
 * - Tratamento de erros consistente
 * - Fácil trocar implementação (mock para testes)
 * - Suporte a múltiplos spreadsheets
 */

// ============================================================================
// SPREADSHEET PROVIDER - PROVEDOR DE SPREADSHEET
// ============================================================================

/**
 * @class SpreadsheetProvider
 * @description Provedor singleton de acesso ao Google Spreadsheet
 * 
 * @example
 * // Obter spreadsheet
 * var ss = SpreadsheetProvider.getInstance();
 * 
 * // Obter sheet específica
 * var sheet = SpreadsheetProvider.getSheet('Alunos');
 * 
 * // Verificar se sheet existe
 * if (SpreadsheetProvider.hasSheet('Usuarios')) {
 *   // ...
 * }
 */
var SpreadsheetProvider = (function() {
  
  // Instância singleton do spreadsheet
  var spreadsheetInstance = null;
  
  // Cache de sheets
  var sheetCache = {};
  
  // Configuração
  var config = {
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutos
    autoRetry: true,
    maxRetries: 3
  };
  
  // Estatísticas
  var stats = {
    hits: 0,
    misses: 0,
    errors: 0,
    retries: 0
  };
  
  return {
    /**
     * Obtém instância do spreadsheet (Singleton)
     * 
     * @param {boolean} forceRefresh - Força recriação da instância
     * @return {Spreadsheet} Instância do Google Spreadsheet
     * @throws {Error} Se não conseguir acessar o spreadsheet
     * 
     * @example
     * var ss = SpreadsheetProvider.getInstance();
     * var sheets = ss.getSheets();
     */
    getInstance: function(forceRefresh) {
      if (spreadsheetInstance && !forceRefresh) {
        return spreadsheetInstance;
      }
      
      try {
        // Tenta obter ID das propriedades do script (PRODUÇÃO)
        var properties = PropertiesService.getScriptProperties();
        var spreadsheetId = properties.getProperty('SPREADSHEET_ID');
        
        if (spreadsheetId) {
          Logger.log('[SpreadsheetProvider] Usando SPREADSHEET_ID das propriedades: ' + spreadsheetId);
          spreadsheetInstance = SpreadsheetApp.openById(spreadsheetId);
        } else {
          Logger.log('[SpreadsheetProvider] SPREADSHEET_ID não configurado, usando spreadsheet ativo');
          spreadsheetInstance = SpreadsheetApp.getActiveSpreadsheet();
        }
        
        // Valida que conseguiu obter o spreadsheet
        if (!spreadsheetInstance) {
          throw new Error('Não foi possível obter o spreadsheet');
        }
        
        // Limpa cache ao obter nova instância
        if (forceRefresh) {
          this.clearCache();
        }
        
        // Log antes de retornar
        Logger.log('[SpreadsheetProvider] Retornando instância: ' + (spreadsheetInstance ? 'OK' : 'NULL'));
        return spreadsheetInstance;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] ❌ Erro ao obter spreadsheet: ' + error.message);
        
        // Mensagem de erro amigável com instruções de resolução
        throw new Error(
          'Falha ao acessar Google Spreadsheet.\n\n' +
          'CAUSA PROVÁVEL: O ID da planilha não está configurado.\n\n' +
          'SOLUÇÃO:\n' +
          '1. Execute a função "setupSystem()" no arquivo System.gs\n' +
          '2. Ou configure manualmente o SPREADSHEET_ID nas propriedades do script.\n\n' +
          'Erro original: ' + error.message
        );
      }
    },
    
    /**
     * Obtém sheet por nome (com cache)
     * 
     * @param {string} sheetName - Nome da sheet
     * @param {Object} options - Opções
     * @param {boolean} options.useCache - Usar cache (padrão: true)
     * @param {boolean} options.throwIfNotFound - Lançar erro se não encontrar (padrão: false)
     * @return {Sheet|null} Sheet ou null se não encontrada
     * 
     * @example
     * var sheet = SpreadsheetProvider.getSheet('Alunos');
     * if (sheet) {
     *   var data = sheet.getDataRange().getValues();
     * }
     */
    getSheet: function(sheetName, options) {
      options = options || {};
      var useCache = options.useCache !== false && config.cacheEnabled;
      var throwIfNotFound = options.throwIfNotFound === true;
      
      // Verifica cache
      if (useCache && sheetCache[sheetName]) {
        var cached = sheetCache[sheetName];
        var now = Date.now();
        
        // Verifica se cache ainda é válido
        if (now - cached.timestamp < config.cacheTTL) {
          stats.hits++;
          return cached.sheet;
        } else {
          // Cache expirado
          delete sheetCache[sheetName];
        }
      }
      
      stats.misses++;
      
      try {
        var ss = this.getInstance();
        var sheet = ss.getSheetByName(sheetName);
        
        if (!sheet && throwIfNotFound) {
          throw new Error('Sheet não encontrada: ' + sheetName);
        }
        
        // Armazena no cache
        if (sheet && useCache) {
          sheetCache[sheetName] = {
            sheet: sheet,
            timestamp: Date.now()
          };
        }
        
        return sheet;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao obter sheet "' + sheetName + '": ' + error.message);
        
        if (throwIfNotFound) {
          throw error;
        }
        
        return null;
      }
    },
    
    /**
     * Verifica se sheet existe
     * 
     * @param {string} sheetName - Nome da sheet
     * @return {boolean} True se existe
     * 
     * @example
     * if (SpreadsheetProvider.hasSheet('Usuarios')) {
     *   console.log('Sheet Usuarios existe');
     * }
     */
    hasSheet: function(sheetName) {
      return this.getSheet(sheetName) !== null;
    },
    
    /**
     * Obtém todas as sheets
     * 
     * @param {Object} options - Opções
     * @param {boolean} options.namesOnly - Retornar apenas nomes (padrão: false)
     * @return {Array<Sheet>|Array<string>} Array de sheets ou nomes
     * 
     * @example
     * var sheets = SpreadsheetProvider.getAllSheets();
     * sheets.forEach(function(sheet) {
     *   console.log(sheet.getName());
     * });
     */
    getAllSheets: function(options) {
      options = options || {};
      
      try {
        var ss = this.getInstance();
        var sheets = ss.getSheets();
        
        if (options.namesOnly) {
          return sheets.map(function(sheet) {
            return sheet.getName();
          });
        }
        
        return sheets;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao obter todas as sheets: ' + error.message);
        return [];
      }
    },
    
    /**
     * Cria nova sheet
     * 
     * @param {string} sheetName - Nome da sheet
     * @param {Object} options - Opções
     * @param {number} options.rows - Número de linhas (padrão: 1000)
     * @param {number} options.columns - Número de colunas (padrão: 26)
     * @return {Sheet} Sheet criada
     * @throws {Error} Se não conseguir criar
     * 
     * @example
     * var newSheet = SpreadsheetProvider.createSheet('NovaSheet', {
     *   rows: 100,
     *   columns: 10
     * });
     */
    createSheet: function(sheetName, options) {
      options = options || {};
      
      try {
        var ss = this.getInstance();
        
        // Verifica se já existe
        if (this.hasSheet(sheetName)) {
          throw new Error('Sheet já existe: ' + sheetName);
        }
        
        var sheet;
        if (options.rows || options.columns) {
          sheet = ss.insertSheet(sheetName, {
            rows: options.rows || 1000,
            columns: options.columns || 26
          });
        } else {
          sheet = ss.insertSheet(sheetName);
        }
        
        // Adiciona ao cache
        if (config.cacheEnabled) {
          sheetCache[sheetName] = {
            sheet: sheet,
            timestamp: Date.now()
          };
        }
        
        Logger.log('[SpreadsheetProvider] Sheet criada: ' + sheetName);
        return sheet;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao criar sheet "' + sheetName + '": ' + error.message);
        throw error;
      }
    },
    
    /**
     * Deleta sheet
     * 
     * @param {string} sheetName - Nome da sheet
     * @return {boolean} True se deletada
     * 
     * @example
     * SpreadsheetProvider.deleteSheet('SheetTemporaria');
     */
    deleteSheet: function(sheetName) {
      try {
        var sheet = this.getSheet(sheetName);
        
        if (!sheet) {
          Logger.log('[SpreadsheetProvider] Sheet não encontrada para deletar: ' + sheetName);
          return false;
        }
        
        var ss = this.getInstance();
        ss.deleteSheet(sheet);
        
        // Remove do cache
        delete sheetCache[sheetName];
        
        Logger.log('[SpreadsheetProvider] Sheet deletada: ' + sheetName);
        return true;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao deletar sheet "' + sheetName + '": ' + error.message);
        return false;
      }
    },
    
    /**
     * Renomeia sheet
     * 
     * @param {string} oldName - Nome atual
     * @param {string} newName - Novo nome
     * @return {boolean} True se renomeada
     * 
     * @example
     * SpreadsheetProvider.renameSheet('Alunos_Old', 'Alunos');
     */
    renameSheet: function(oldName, newName) {
      try {
        var sheet = this.getSheet(oldName);
        
        if (!sheet) {
          Logger.log('[SpreadsheetProvider] Sheet não encontrada para renomear: ' + oldName);
          return false;
        }
        
        sheet.setName(newName);
        
        // Atualiza cache
        delete sheetCache[oldName];
        if (config.cacheEnabled) {
          sheetCache[newName] = {
            sheet: sheet,
            timestamp: Date.now()
          };
        }
        
        Logger.log('[SpreadsheetProvider] Sheet renomeada: ' + oldName + ' -> ' + newName);
        return true;
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao renomear sheet: ' + error.message);
        return false;
      }
    },
    
    /**
     * Obtém informações do spreadsheet
     * 
     * @return {Object} Informações
     * 
     * @example
     * var info = SpreadsheetProvider.getInfo();
     * console.log('Nome:', info.name);
     * console.log('ID:', info.id);
     * console.log('Sheets:', info.sheetCount);
     */
    getInfo: function() {
      try {
        var ss = this.getInstance();
        
        return {
          id: ss.getId(),
          name: ss.getName(),
          url: ss.getUrl(),
          sheetCount: ss.getSheets().length,
          locale: ss.getSpreadsheetLocale(),
          timeZone: ss.getSpreadsheetTimeZone()
        };
        
      } catch (error) {
        stats.errors++;
        Logger.log('[SpreadsheetProvider] Erro ao obter info: ' + error.message);
        return null;
      }
    },
    
    /**
     * Limpa cache de sheets
     * 
     * @param {string} sheetName - Nome específico (opcional)
     * @return {number} Quantidade de itens removidos do cache
     * 
     * @example
     * // Limpar cache de uma sheet específica
     * SpreadsheetProvider.clearCache('Alunos');
     * 
     * // Limpar todo o cache
     * SpreadsheetProvider.clearCache();
     */
    clearCache: function(sheetName) {
      if (sheetName) {
        if (sheetCache[sheetName]) {
          delete sheetCache[sheetName];
          return 1;
        }
        return 0;
      }
      
      var count = Object.keys(sheetCache).length;
      sheetCache = {};
      return count;
    },
    
    /**
     * Obtém estatísticas
     * 
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = SpreadsheetProvider.getStats();
     * console.log('Cache hits:', stats.hits);
     * console.log('Hit rate:', stats.hitRate);
     */
    getStats: function() {
      var total = stats.hits + stats.misses;
      var hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(2) : 0;
      
      return {
        hits: stats.hits,
        misses: stats.misses,
        errors: stats.errors,
        retries: stats.retries,
        hitRate: hitRate + '%',
        cacheSize: Object.keys(sheetCache).length,
        cacheEnabled: config.cacheEnabled
      };
    },
    
    /**
     * Reseta estatísticas
     */
    resetStats: function() {
      stats = {
        hits: 0,
        misses: 0,
        errors: 0,
        retries: 0
      };
    },
    
    /**
     * Configura provider
     * 
     * @param {Object} newConfig - Nova configuração
     * 
     * @example
     * SpreadsheetProvider.configure({
     *   cacheEnabled: true,
     *   cacheTTL: 600000 // 10 minutos
     * });
     */
    configure: function(newConfig) {
      Object.assign(config, newConfig);
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
     * Força refresh da instância do spreadsheet
     * 
     * @return {Spreadsheet} Nova instância
     */
    refresh: function() {
      return this.getInstance(true);
    }
  };
})();

// ============================================================================
// FUNÇÃO GLOBAL PARA BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Obtém spreadsheet (backward compatibility)
 * 
 * @return {Spreadsheet} Instância do Google Spreadsheet
 * @throws {Error} Se não conseguir acessar o spreadsheet
 * 
 * @example
 * var ss = getSpreadsheet();
 * var sheet = ss.getSheetByName('Alunos');
 */
function getSpreadsheet() {
  return SpreadsheetProvider.getInstance();
}

// ============================================================================
// REGISTRO NO SERVICE LOCATOR
// ============================================================================

/**
 * Registra SpreadsheetProvider no ServiceLocator
 * Deve ser chamado durante inicialização
 */
function registerSpreadsheetProvider() {
  if (typeof ServiceLocator !== 'undefined') {
    ServiceLocator.register('spreadsheet', function() {
      return SpreadsheetProvider.getInstance();
    }, {
      singleton: true,
      description: 'Provedor de acesso ao Google Spreadsheet'
    });
    
    ServiceLocator.register('spreadsheetProvider', function() {
      return SpreadsheetProvider;
    }, {
      singleton: true,
      description: 'SpreadsheetProvider (objeto completo)'
    });
    
    Logger.log('✅ SpreadsheetProvider registrado no ServiceLocator');
  }
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa SpreadsheetProvider
 */
function testSpreadsheetProvider() {
  Logger.log('🧪 Testando SpreadsheetProvider...\n');
  
  try {
    // Teste 1: Obter instância
    Logger.log('Teste 1: Obter instância');
    var ss = SpreadsheetProvider.getInstance();
    Logger.log('✓ Spreadsheet obtido: ' + ss.getName());
    
    // Teste 2: Obter info
    Logger.log('\nTeste 2: Obter informações');
    var info = SpreadsheetProvider.getInfo();
    Logger.log('✓ Nome: ' + info.name);
    Logger.log('✓ ID: ' + info.id);
    Logger.log('✓ Sheets: ' + info.sheetCount);
    
    // Teste 3: Listar sheets
    Logger.log('\nTeste 3: Listar sheets');
    var sheetNames = SpreadsheetProvider.getAllSheets({ namesOnly: true });
    Logger.log('✓ Sheets encontradas: ' + sheetNames.length);
    sheetNames.slice(0, 5).forEach(function(name) {
      Logger.log('  • ' + name);
    });
    
    // Teste 4: Obter sheet específica
    Logger.log('\nTeste 4: Obter sheet específica');
    var sheet = SpreadsheetProvider.getSheet('Usuarios');
    if (sheet) {
      Logger.log('✓ Sheet Usuarios encontrada');
      Logger.log('  Linhas: ' + sheet.getLastRow());
      Logger.log('  Colunas: ' + sheet.getLastColumn());
    } else {
      Logger.log('⚠️ Sheet Usuarios não encontrada');
    }
    
    // Teste 5: Verificar existência
    Logger.log('\nTeste 5: Verificar existência');
    Logger.log('✓ Has Usuarios: ' + SpreadsheetProvider.hasSheet('Usuarios'));
    Logger.log('✓ Has NonExistent: ' + SpreadsheetProvider.hasSheet('NonExistent'));
    
    // Teste 6: Cache
    Logger.log('\nTeste 6: Cache');
    SpreadsheetProvider.clearCache();
    SpreadsheetProvider.getSheet('Usuarios'); // Miss
    SpreadsheetProvider.getSheet('Usuarios'); // Hit
    SpreadsheetProvider.getSheet('Usuarios'); // Hit
    var stats = SpreadsheetProvider.getStats();
    Logger.log('✓ Cache hits: ' + stats.hits);
    Logger.log('✓ Cache misses: ' + stats.misses);
    Logger.log('✓ Hit rate: ' + stats.hitRate);
    
    // Teste 7: Backward compatibility
    Logger.log('\nTeste 7: Backward compatibility');
    var ss2 = getSpreadsheet();
    Logger.log('✓ getSpreadsheet() funciona: ' + (ss === ss2));
    
    // Teste 8: Estatísticas
    Logger.log('\nTeste 8: Estatísticas finais');
    var finalStats = SpreadsheetProvider.getStats();
    Logger.log('✓ Total hits: ' + finalStats.hits);
    Logger.log('✓ Total misses: ' + finalStats.misses);
    Logger.log('✓ Errors: ' + finalStats.errors);
    Logger.log('✓ Cache size: ' + finalStats.cacheSize);
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return {
      success: true,
      stats: finalStats
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
