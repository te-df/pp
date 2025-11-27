/**
 * @file GetSpreadsheetHelper.gs
 * @description Helper centralizado para obter o Spreadsheet usando variáveis de ambiente
 * @version 1.0.0
 * 
 * IMPORTANTE: Use sempre getSpreadsheetFromEnv() ao invés de SpreadsheetApp.openById()
 */

/**
 * Obtém o Spreadsheet a partir das variáveis de ambiente
 * 
 * Esta função centraliza o acesso ao spreadsheet, buscando o ID de múltiplas fontes:
 * 1. PropertiesService.getScriptProperties() - SPREADSHEET_ID
 * 2. PropertiesService.getScriptProperties() - MAIN_SPREADSHEET_ID
 * 3. SpreadsheetApp.getActiveSpreadsheet() - Fallback
 * 
 * @return {Spreadsheet} Instância do Google Spreadsheet
 * @throws {Error} Se não conseguir acessar o spreadsheet
 * 
 * @example
 * // Ao invés de:
 * // var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
 * 
 * // Use:
 * var ss = getSpreadsheetFromEnv();
 * var sheet = ss.getSheetByName('Usuarios');
 */
function getSpreadsheetFromEnv() {
  try {
    var props = PropertiesService.getScriptProperties();
    
    // Tenta SPREADSHEET_ID
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    
    // Tenta MAIN_SPREADSHEET_ID como fallback
    if (!spreadsheetId) {
      spreadsheetId = props.getProperty('MAIN_SPREADSHEET_ID');
    }
    
    // Se encontrou ID, tenta abrir
    if (spreadsheetId) {
      Logger.log('[GetSpreadsheetHelper] Usando SPREADSHEET_ID: ' + spreadsheetId);
      var ss = SpreadsheetApp.openById(spreadsheetId);
      
      if (ss) {
        return ss;
      }
    }
    
    // Fallback: tenta spreadsheet ativo
    Logger.log('[GetSpreadsheetHelper] Tentando spreadsheet ativo como fallback');
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    
    if (activeSs) {
      // Salva o ID para uso futuro
      var activeId = activeSs.getId();
      props.setProperty('SPREADSHEET_ID', activeId);
      Logger.log('[GetSpreadsheetHelper] Spreadsheet ativo salvo: ' + activeId);
      return activeSs;
    }
    
    // Se chegou aqui, não conseguiu obter o spreadsheet
    throw new Error('Não foi possível obter o spreadsheet');
    
  } catch (error) {
    Logger.log('[GetSpreadsheetHelper] ❌ Erro: ' + error.message);
    
    throw new Error(
      'Falha ao acessar Google Spreadsheet.\n\n' +
      'CAUSA: ' + error.message + '\n\n' +
      'SOLUÇÃO:\n' +
      '1. Execute: EXECUTAR_CONFIGURACAO_COMPLETA()\n' +
      '2. Ou configure manualmente:\n' +
      '   PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", "SEU_ID_AQUI")\n' +
      '3. Verifique se você tem permissão para acessar a planilha'
    );
  }
}

/**
 * Obtém o ID do Spreadsheet das variáveis de ambiente
 * 
 * @return {string|null} ID do spreadsheet ou null se não configurado
 * 
 * @example
 * var id = getSpreadsheetIdFromEnv();
 * if (id) {
 *   console.log('Spreadsheet ID:', id);
 * }
 */
function getSpreadsheetIdFromEnv() {
  try {
    var props = PropertiesService.getScriptProperties();
    
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (spreadsheetId) {
      return spreadsheetId;
    }
    
    spreadsheetId = props.getProperty('MAIN_SPREADSHEET_ID');
    if (spreadsheetId) {
      return spreadsheetId;
    }
    
    // Tenta obter do spreadsheet ativo
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      return activeSs.getId();
    }
    
    return null;
    
  } catch (error) {
    Logger.log('[GetSpreadsheetHelper] Erro ao obter ID: ' + error.message);
    return null;
  }
}

/**
 * Configura o SPREADSHEET_ID nas variáveis de ambiente
 * 
 * @param {string} spreadsheetId - ID do spreadsheet
 * @return {boolean} Sucesso
 * 
 * @example
 * setSpreadsheetIdInEnv('1gTCPPY1BkcsSFi5qxbbVllb7YfG_zKpfeUIpX-3qqAc');
 */
function setSpreadsheetIdInEnv(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      throw new Error('spreadsheetId é obrigatório');
    }
    
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
    props.setProperty('MAIN_SPREADSHEET_ID', spreadsheetId);
    
    Logger.log('[GetSpreadsheetHelper] ✅ SPREADSHEET_ID configurado: ' + spreadsheetId);
    
    // Testa o acesso
    var ss = SpreadsheetApp.openById(spreadsheetId);
    Logger.log('[GetSpreadsheetHelper] ✅ Acesso verificado: ' + ss.getName());
    
    return true;
    
  } catch (error) {
    Logger.log('[GetSpreadsheetHelper] ❌ Erro ao configurar: ' + error.message);
    return false;
  }
}

/**
 * Verifica se o SPREADSHEET_ID está configurado
 * 
 * @return {Object} Status da configuração
 * 
 * @example
 * var status = checkSpreadsheetEnvConfig();
 * if (!status.configured) {
 *   console.log('Configure o SPREADSHEET_ID!');
 * }
 */
function checkSpreadsheetEnvConfig() {
  var result = {
    configured: false,
    accessible: false,
    spreadsheetId: null,
    spreadsheetName: null,
    error: null
  };
  
  try {
    var spreadsheetId = getSpreadsheetIdFromEnv();
    
    if (!spreadsheetId) {
      result.error = 'SPREADSHEET_ID não configurado';
      return result;
    }
    
    result.configured = true;
    result.spreadsheetId = spreadsheetId;
    
    // Testa acesso
    var ss = SpreadsheetApp.openById(spreadsheetId);
    result.accessible = true;
    result.spreadsheetName = ss.getName();
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * Testa o helper de spreadsheet
 */
function testGetSpreadsheetHelper() {
  Logger.log('🧪 Testando GetSpreadsheetHelper...\n');
  
  try {
    // Teste 1: Verificar configuração
    Logger.log('Teste 1: Verificar configuração');
    var status = checkSpreadsheetEnvConfig();
    Logger.log('  Configurado: ' + status.configured);
    Logger.log('  Acessível: ' + status.accessible);
    if (status.spreadsheetId) {
      Logger.log('  ID: ' + status.spreadsheetId);
    }
    if (status.spreadsheetName) {
      Logger.log('  Nome: ' + status.spreadsheetName);
    }
    if (status.error) {
      Logger.log('  Erro: ' + status.error);
    }
    
    // Teste 2: Obter spreadsheet
    Logger.log('\nTeste 2: Obter spreadsheet');
    var ss = getSpreadsheetFromEnv();
    Logger.log('  ✅ Spreadsheet obtido: ' + ss.getName());
    Logger.log('  ID: ' + ss.getId());
    Logger.log('  Sheets: ' + ss.getSheets().length);
    
    // Teste 3: Obter ID
    Logger.log('\nTeste 3: Obter ID');
    var id = getSpreadsheetIdFromEnv();
    Logger.log('  ID: ' + id);
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return {
      success: true,
      status: status
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
