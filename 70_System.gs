/**
 * @file System.gs
 * @description Unified System Initialization and Lifecycle Management
 * @version 2.0.0
 * @author Sistema TE-DF-PP
 * 
 * This file replaces CONFIGURE_SYSTEM.gs, INICIALIZAR_SISTEMA.gs, and SETUP_SPREADSHEET.gs.
 * It provides a single, organic entry point for system initialization.
 */

var System = (function() {
  
  // Private state
  var initialized = false;
  var config = {
    criticalSheets: ['Usuarios', 'Config', 'Logs', 'JobQueue'],
    version: '2.0.0'
  };

  /**
   * Private: Checks if the environment is ready
   */
  function _checkEnvironment() {
    var props = PropertiesService.getScriptProperties();
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    
    if (!spreadsheetId) {
      // Try to auto-detect from active spreadsheet (if running in container-bound script)
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          spreadsheetId = ss.getId();
          props.setProperty('SPREADSHEET_ID', spreadsheetId);
          Logger.log('[System] Auto-detected and saved SPREADSHEET_ID: ' + spreadsheetId);
          return true;
        }
      } catch (e) {
        // Not container bound or no active sheet
      }
      
      Logger.log('[System] ⚠️ SPREADSHEET_ID not found. System requires setup.');
      return false;
    }
    return true;
  }

  /**
   * Private: Ensures critical sheets exist
   */
  function _ensureSheets() {
    try {
      // Use the existing CreateMissingSheets logic if available
      if (typeof createMissingProductionSheets === 'function') {
        Logger.log('[System] Verifying sheet structure...');
        var result = createMissingProductionSheets();
        Logger.log('[System] Sheet verification result: ' + JSON.stringify(result));
        return true;
      } else {
        Logger.log('[System] ⚠️ createMissingProductionSheets function not found.');
        return false;
      }
    } catch (e) {
      Logger.log('[System] ❌ Error ensuring sheets: ' + e.message);
      return false;
    }
  }

  return {
    /**
     * Main entry point to initialize the system.
     * Call this at the start of doGet/doPost or any entry point.
     */
    init: function() {
      if (initialized) return true;
      
      Logger.log('[System] Initializing v' + config.version + '...');
      
      // 1. Environment Check
      if (!_checkEnvironment()) {
        throw new Error('System not configured. SPREADSHEET_ID missing.');
      }
      
      // 2. Sheet Structure Check (Lazy/Self-Healing)
      // We don't throw here to allow read-only access if partial failure
      _ensureSheets();
      
      // 3. Service Initialization
      if (typeof ServiceManager !== 'undefined') {
        // Pre-warm critical services
        try {
          ServiceManager.getLoggerService();
          ServiceManager.getPropertiesManager();
        } catch (e) {
          Logger.log('[System] Service warmup warning: ' + e.message);
        }
      }
      
      initialized = true;
      Logger.log('[System] Initialization complete.');
      return true;
    },

    /**
     * Force a system setup/reset.
     * Useful for manual execution or admin dashboard.
     */
    setup: function() {
      Logger.log('[System] Starting manual setup...');
      var envOk = _checkEnvironment();
      var sheetsOk = _ensureSheets();
      
      return {
        success: envOk && sheetsOk,
        environment: envOk,
        sheets: sheetsOk
      };
    },

    /**
     * Get system health status
     */
    getStatus: function() {
      return {
        initialized: initialized,
        version: config.version,
        timestamp: new Date().toISOString()
      };
    }
  };
})();

/**
 * Global wrapper for backward compatibility or easy access
 */
function initSystem() {
  return System.init();
}

/**
 * Manual setup function for the IDE
 */
function setupSystem() {
  var result = System.setup();
  Logger.log('Setup Result: ' + JSON.stringify(result, null, 2));
  return result;
}
