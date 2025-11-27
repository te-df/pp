/**
 * @file SearchService.gs
 * @description Serviços de busca otimizada
 */

/**
 * Realiza busca otimizada em uma planilha
 * @param {string} sheetName - Nome da planilha
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções de busca {limit, offset}
 * @return {Object} Resultado {success, data, total}
 */
function optimizedSearch(sheetName, query, options) {
  try {
    options = options || {};
    const limit = options.limit || 50;
    
    const service = new DataService(sheetName);
    
    // Se não tiver query, retorna leitura simples com limite
    if (!query) {
      const result = service.read();
      if (!result.success) return result;
      
      return {
        success: true,
        data: result.data.slice(0, limit),
        total: result.data.length
      };
    }
    
    // Busca normal
    const searchResult = service.search(query);
    if (!searchResult.success) return searchResult;
    
    return {
      success: true,
      data: searchResult.data.slice(0, limit),
      total: searchResult.data.length
    };
    
  } catch (error) {
    Logger.log(`[SearchService] Erro em optimizedSearch: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
