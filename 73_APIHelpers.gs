/**
 * APIHelpers.gs
 * Funções auxiliares de API que faltavam no sistema
 * Criado para resolver falhas nos testes
 */

/**
 * Health check do sistema
 * Verifica se o sistema está operacional
 * @returns {Object} { success: boolean, status: string, ... }
 */
function healthCheck() {
  try {
    const ss = getSpreadsheet();
    const timestamp = new Date().toISOString();
    
    // Verifica se as planilhas essenciais existem
    const essentialSheets = CONFIG.SHEET_NAMES || [];
    const existingSheets = ss.getSheets().map(s => s.getName());
    const missingSheets = essentialSheets.filter(name => !existingSheets.includes(name));
    
    const status = missingSheets.length === 0 ? 'healthy' : 'degraded';
    
    return {
      success: true,
      status: status,
      timestamp: timestamp,
      version: CONFIG.VERSION || '4.0',
      environment: CONFIG.ENVIRONMENT || 'development',
      sheets: {
        total: existingSheets.length,
        essential: essentialSheets.length,
        missing: missingSheets
      }
    };
  } catch (error) {
    Logger.log(`Erro em healthCheck: ${error.toString()}`);
    return {
      success: false,
      status: 'unhealthy',
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Obtém configuração do sistema
 * Retorna o objeto CONFIG com informações do sistema
 * @returns {Object} { success: boolean, config: Object }
 */
function getSystemConfig() {
  try {
    return {
      success: true,
      config: {
        appName: CONFIG.APP_NAME || 'SIG-TE',
        version: CONFIG.VERSION || '4.0',
        environment: CONFIG.ENVIRONMENT || 'development',
        sheetNames: CONFIG.SHEET_NAMES || [],
        features: CONFIG.FEATURES || {},
        limits: CONFIG.LIMITS || {},
        cache: CONFIG.CACHE || {},
        session: CONFIG.SESSION || {}
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log(`Erro em getSystemConfig: ${error.toString()}`);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}
