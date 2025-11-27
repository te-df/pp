/**
 * Data Access Layer
 * 
 * Camada de acesso a dados - responsável por todas as operações CRUD
 * com Google Sheets. Extração de funcionalidades do model.gs.
 * 
 * @author Sistema Escolar
 * @version 1.0.0
 * @since 2025-11
 */

/**
 * Serviço de acesso a dados
 * Implementa padrão Repository para operações com planilhas
 */
const DataAccessLayer = (function() {
  'use strict';
  
  // ========================================
  // CONSTANTES PRIVADAS
  // ========================================
  
  const CACHE_PREFIX = 'dal_';
  const DEFAULT_CACHE_TIME = 300; // 5 minutos
  
  // ========================================
  // FUNÇÕES PRIVADAS
  // ========================================
  
  /**
   * Obtém a planilha ativa ou por ID
   * @private
   * @param {string} spreadsheetId - ID da planilha (opcional)
   * @returns {Spreadsheet} Objeto da planilha
   */
  function getSpreadsheet_(spreadsheetId) {
    if (spreadsheetId) {
      return SpreadsheetApp.openById(spreadsheetId);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  
  /**
   * Obtém uma aba específica
   * @private
   * @param {string} sheetName - Nome da aba
   * @param {string} spreadsheetId - ID da planilha (opcional)
   * @returns {Sheet|null} Objeto da aba ou null
   */
  function getSheet_(sheetName, spreadsheetId) {
    try {
      const ss = getSpreadsheet_(spreadsheetId);
      return ss.getSheetByName(sheetName);
    } catch (error) {
      Logger.log('Erro ao obter aba: ' + error.message);
      return null;
    }
  }
  
  /**
   * Valida se uma aba existe
   * @private
   * @param {Sheet} sheet - Objeto da aba
   * @param {string} sheetName - Nome da aba
   * @throws {Error} Se a aba não existir
   */
  function validateSheet_(sheet, sheetName) {
    if (!sheet) {
      throw new Error('Aba não encontrada: ' + sheetName);
    }
  }
  
  /**
   * Gera chave de cache
   * @private
   * @param {string} operation - Nome da operação
   * @param {Array} params - Parâmetros da operação
   * @returns {string} Chave de cache
   */
  function getCacheKey_(operation, params) {
    return CACHE_PREFIX + operation + '_' + JSON.stringify(params);
  }
  
  // ========================================
  // API PÚBLICA
  // ========================================
  
  return {
    
    /**
     * Lê todos os dados de uma aba
     * 
     * @param {string} sheetName - Nome da aba
     * @param {Object} options - Opções de leitura
     * @param {boolean} options.includeHeaders - Incluir cabeçalhos (padrão: false)
     * @param {boolean} options.useCache - Usar cache (padrão: true)
     * @param {string} options.spreadsheetId - ID da planilha (opcional)
     * @returns {Array<Array>} Dados da aba
     * 
     * @example
     * const data = DataAccessLayer.readAll('Usuarios', { includeHeaders: true });
     */
    readAll: function(sheetName, options = {}) {
      const opts = {
        includeHeaders: false,
        useCache: true,
        spreadsheetId: null,
        ...options
      };
      
      // Verificar cache
      if (opts.useCache) {
        const cacheKey = getCacheKey_('readAll', [sheetName]);
        const cached = CacheService.getScriptCache().get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      const sheet = getSheet_(sheetName, opts.spreadsheetId);
      validateSheet_(sheet, sheetName);
      
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      if (lastRow === 0 || lastCol === 0) {
        return [];
      }
      
      const startRow = opts.includeHeaders ? 1 : 2;
      const numRows = opts.includeHeaders ? lastRow : lastRow - 1;
      
      if (numRows <= 0) {
        return [];
      }
      
      const data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();
      
      // Salvar no cache
      if (opts.useCache) {
        const cacheKey = getCacheKey_('readAll', [sheetName]);
        CacheService.getScriptCache().put(cacheKey, JSON.stringify(data), DEFAULT_CACHE_TIME);
      }
      
      return data;
    },
    
    /**
     * Lê uma linha específica
     * 
     * @param {string} sheetName - Nome da aba
     * @param {number} rowIndex - Índice da linha (1-based)
     * @param {Object} options - Opções de leitura
     * @returns {Array} Dados da linha
     * 
     * @example
     * const row = DataAccessLayer.readRow('Usuarios', 5);
     */
    readRow: function(sheetName, rowIndex, options = {}) {
      const opts = {
        spreadsheetId: null,
        ...options
      };
      
      const sheet = getSheet_(sheetName, opts.spreadsheetId);
      validateSheet_(sheet, sheetName);
      
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        return [];
      }
      
      return sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
    },
    
    /**
     * Adiciona uma nova linha
     * 
     * @param {string} sheetName - Nome da aba
     * @param {Array} data - Dados a adicionar
     * @param {Object} options - Opções de escrita
     * @returns {number} Índice da linha adicionada
     * 
     * @example
     * const rowIndex = DataAccessLayer.appendRow('Usuarios', ['João', 'joao@email.com']);
     */
    appendRow: function(sheetName, data, options = {}) {
      const opts = {
        spreadsheetId: null,
        clearCache: true,
        ...options
      };
      
      const sheet = getSheet_(sheetName, opts.spreadsheetId);
      validateSheet_(sheet, sheetName);
      
      sheet.appendRow(data);
      const newRowIndex = sheet.getLastRow();
      
      // Limpar cache
      if (opts.clearCache) {
        const cacheKey = getCacheKey_('readAll', [sheetName]);
        CacheService.getScriptCache().remove(cacheKey);
      }
      
      return newRowIndex;
    },
    
    /**
     * Atualiza uma linha existente
     * 
     * @param {string} sheetName - Nome da aba
     * @param {number} rowIndex - Índice da linha (1-based)
     * @param {Array} data - Novos dados
     * @param {Object} options - Opções de atualização
     * @returns {boolean} Sucesso da operação
     * 
     * @example
     * DataAccessLayer.updateRow('Usuarios', 5, ['João Silva', 'joao@email.com']);
     */
    updateRow: function(sheetName, rowIndex, data, options = {}) {
      const opts = {
        spreadsheetId: null,
        clearCache: true,
        ...options
      };
      
      const sheet = getSheet_(sheetName, opts.spreadsheetId);
      validateSheet_(sheet, sheetName);
      
      sheet.getRange(rowIndex, 1, 1, data.length).setValues([data]);
      
      // Limpar cache
      if (opts.clearCache) {
        const cacheKey = getCacheKey_('readAll', [sheetName]);
        CacheService.getScriptCache().remove(cacheKey);
      }
      
      return true;
    },
    
    /**
     * Remove uma linha
     * 
     * @param {string} sheetName - Nome da aba
     * @param {number} rowIndex - Índice da linha (1-based)
     * @param {Object} options - Opções de remoção
     * @returns {boolean} Sucesso da operação
     * 
     * @example
     * DataAccessLayer.deleteRow('Usuarios', 5);
     */
    deleteRow: function(sheetName, rowIndex, options = {}) {
      const opts = {
        spreadsheetId: null,
        clearCache: true,
        ...options
      };
      
      const sheet = getSheet_(sheetName, opts.spreadsheetId);
      validateSheet_(sheet, sheetName);
      
      sheet.deleteRow(rowIndex);
      
      // Limpar cache
      if (opts.clearCache) {
        const cacheKey = getCacheKey_('readAll', [sheetName]);
        CacheService.getScriptCache().remove(cacheKey);
      }
      
      return true;
    },
    
    /**
     * Busca linhas por critério
     * 
     * @param {string} sheetName - Nome da aba
     * @param {Function} predicate - Função de filtro
     * @param {Object} options - Opções de busca
     * @returns {Array<Object>} Linhas encontradas com índice
     * 
     * @example
     * const users = DataAccessLayer.findRows('Usuarios', row => row[2] === 'ativo');
     */
    findRows: function(sheetName, predicate, options = {}) {
      const data = this.readAll(sheetName, options);
      const results = [];
      
      data.forEach((row, index) => {
        if (predicate(row)) {
          results.push({
            rowIndex: index + 2, // +2 porque começa em 1 e pula header
            data: row
          });
        }
      });
      
      return results;
    },
    
    /**
     * Limpa o cache de uma aba específica
     * 
     * @param {string} sheetName - Nome da aba
     */
    clearCache: function(sheetName) {
      const cacheKey = getCacheKey_('readAll', [sheetName]);
      CacheService.getScriptCache().remove(cacheKey);
    },
    
    /**
     * Limpa todo o cache do DAL
     */
    clearAllCache: function() {
      // Implementar limpeza completa se necessário
      Logger.log('Cache do DataAccessLayer limpo');
    }
    
  };
  
})();
