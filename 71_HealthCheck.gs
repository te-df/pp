/**
 * @file HealthCheck.gs
 * @description Sistema de health check e monitoramento de saúde do sistema
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 */

/**
 * Serviço de Health Check
 * Monitora a saúde geral do sistema
 */
var HealthCheckService = (function() {
  
  /**
   * Executa verificação completa de saúde do sistema
   * @returns {Object} Relatório de saúde
   */
  function checkSystemHealth() {
    var startTime = new Date().getTime();
    var report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      metrics: {},
      warnings: [],
      errors: []
    };
    
    try {
      // 1. Verificar acesso à planilha
      report.checks.spreadsheet = checkSpreadsheetAccess();
      
      // 2. Verificar serviços essenciais
      report.checks.services = checkEssentialServices();
      
      // 3. Verificar cache
      report.checks.cache = checkCacheService();
      
      // 4. Verificar propriedades
      report.checks.properties = checkPropertiesService();
      
      // 5. Verificar planilhas obrigatórias
      report.checks.sheets = checkRequiredSheets();
      
      // 6. Métricas de performance
      report.metrics = collectPerformanceMetrics();
      
      // 7. Verificar limites de quota
      report.checks.quotas = checkQuotaLimits();
      
      // Determinar status geral
      report.status = determineOverallStatus(report);
      
    } catch (error) {
      report.status = 'critical';
      report.errors.push({
        type: 'HEALTH_CHECK_FAILED',
        message: error.message,
        stack: error.stack
      });
    }
    
    report.metrics.checkDuration = new Date().getTime() - startTime;
    return report;
  }
  
  /**
   * Verifica acesso à planilha principal
   */
  function checkSpreadsheetAccess() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (!ss) {
        return { status: 'error', message: 'Planilha não encontrada' };
      }
      
      return {
        status: 'ok',
        id: ss.getId(),
        name: ss.getName(),
        url: ss.getUrl()
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Verifica serviços essenciais
   */
  function checkEssentialServices() {
    var services = {
      Logger: typeof LoggerService !== 'undefined',
      Cache: typeof CacheService !== 'undefined',
      Auth: typeof AuthService !== 'undefined',
      Data: typeof DataAccessLayer !== 'undefined',
      Validation: typeof ValidationService !== 'undefined'
    };
    
    var allOk = Object.values(services).every(function(v) { return v; });
    
    return {
      status: allOk ? 'ok' : 'warning',
      services: services,
      available: Object.keys(services).filter(function(k) { return services[k]; }).length,
      total: Object.keys(services).length
    };
  }
  
  /**
   * Verifica serviço de cache
   */
  function checkCacheService() {
    try {
      var cache = CacheService.getScriptCache();
      var testKey = 'health_check_test_' + new Date().getTime();
      var testValue = 'test';
      
      cache.put(testKey, testValue, 10);
      var retrieved = cache.get(testKey);
      cache.remove(testKey);
      
      return {
        status: retrieved === testValue ? 'ok' : 'warning',
        writable: retrieved === testValue,
        readable: retrieved !== null
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Verifica serviço de propriedades
   */
  function checkPropertiesService() {
    try {
      var props = PropertiesService.getScriptProperties();
      var testKey = 'health_check_test';
      
      props.setProperty(testKey, 'test');
      var retrieved = props.getProperty(testKey);
      props.deleteProperty(testKey);
      
      return {
        status: retrieved === 'test' ? 'ok' : 'warning',
        writable: true,
        readable: retrieved !== null
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Verifica planilhas obrigatórias
   */
  function checkRequiredSheets() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      var sheetNames = sheets.map(function(s) { return s.getName(); });
      
      var required = [
        'Alunos', 'Rotas', 'Veiculos', 'Pessoal', 
        'Usuarios', 'Logs', 'JobQueue'
      ];
      
      var missing = required.filter(function(name) {
        return sheetNames.indexOf(name) === -1;
      });
      
      return {
        status: missing.length === 0 ? 'ok' : 'warning',
        total: sheets.length,
        required: required.length,
        missing: missing,
        available: sheetNames
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  
  /**
   * Coleta métricas de performance
   */
  function collectPerformanceMetrics() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      
      var totalRows = 0;
      var totalCells = 0;
      
      sheets.forEach(function(sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        totalRows += lastRow;
        totalCells += lastRow * lastCol;
      });
      
      // Constantes locais para cálculo de tamanho
      var BYTES_PER_CELL = 100; // Estimativa conservadora
      var MEGABYTE = 1024 * 1024;
      
      return {
        totalSheets: sheets.length,
        totalRows: totalRows,
        totalCells: totalCells,
        estimatedSize: Math.round(totalCells * BYTES_PER_CELL / MEGABYTE * 100) / 100
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Verifica limites de quota
   */
  function checkQuotaLimits() {
    var metrics = collectPerformanceMetrics();
    var warnings = [];
    
    // Limite de aviso: 40 MB (Google Sheets tem limite de ~50 MB)
    var WARNING_THRESHOLD = 40;
    
    if (metrics.estimatedSize > WARNING_THRESHOLD) {
      warnings.push('Tamanho da planilha próximo do limite');
    }
    
    if (metrics.totalSheets > 50) {
      warnings.push('Número elevado de planilhas');
    }
    
    return {
      status: warnings.length === 0 ? 'ok' : 'warning',
      warnings: warnings,
      usage: {
        size: metrics.estimatedSize + ' MB',
        sheets: metrics.totalSheets
      }
    };
  }
  
  /**
   * Determina status geral do sistema
   */
  function determineOverallStatus(report) {
    var hasErrors = report.errors.length > 0;
    var hasCriticalFailures = Object.values(report.checks).some(function(check) {
      return check.status === 'error';
    });
    
    if (hasErrors || hasCriticalFailures) {
      return 'critical';
    }
    
    var hasWarnings = report.warnings.length > 0 || 
                      Object.values(report.checks).some(function(check) {
                        return check.status === 'warning';
                      });
    
    return hasWarnings ? 'degraded' : 'healthy';
  }
  
  /**
   * Endpoint HTTP para health check
   */
  function doHealthCheck() {
    var report = checkSystemHealth();
    
    return ContentService
      .createTextOutput(JSON.stringify(report, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return {
    checkSystemHealth: checkSystemHealth,
    doHealthCheck: doHealthCheck
  };
})();

/**
 * Função pública exposta para health check via Router
 * Nota: O endpoint HTTP principal (doGet) está em Bootstrap.gs
 * Esta função pode ser chamada via Router ou diretamente
 */
function executeHealthCheck() {
  return HealthCheckService.checkSystemHealth();
}
