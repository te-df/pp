/**
 * @file TestIntegration.gs
 * @description Suite completa de testes de integração Backend-Frontend
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 */

// ============================================================================
// SUITE DE TESTES DE INTEGRAÇÃO
// ============================================================================

/**
 * Executa todos os testes de integração
 * Execute esta função no Apps Script Editor para validar a integração
 */
function runFullIntegrationTest() {
  Logger.log('='.repeat(80));
  Logger.log('🧪 INICIANDO TESTES DE INTEGRAÇÃO COMPLETOS');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Teste 1: Configuração de Ambiente
  runTest(results, 'Configuração de Ambiente', testEnvironmentSetup);
  
  // Teste 2: Acesso ao Spreadsheet
  runTest(results, 'Acesso ao Spreadsheet', testSpreadsheetAccess);
  
  // Teste 3: Health Check
  runTest(results, 'Health Check', testHealthCheck);
  
  // Teste 4: CRUD - Create
  runTest(results, 'CRUD - Create', testCreate);
  
  // Teste 5: CRUD - Read
  runTest(results, 'CRUD - Read', testRead);
  
  // Teste 6: CRUD - Update
  runTest(results, 'CRUD - Update', testUpdate);
  
  // Teste 7: CRUD - Delete
  runTest(results, 'CRUD - Delete', testDelete);
  
  // Teste 8: API Response Helpers
  runTest(results, 'API Response Helpers', testAPIResponseHelpers);
  
  // Teste 9: Error Handling
  runTest(results, 'Error Handling', testErrorHandling);
  
  // Teste 10: Cache System
  runTest(results, 'Cache System', testCacheSystem);
  
  // Resumo
  Logger.log('');
  Logger.log('='.repeat(80));
  Logger.log('📊 RESUMO DOS TESTES');
  Logger.log('='.repeat(80));
  Logger.log(`Total de testes: ${results.total}`);
  Logger.log(`✅ Passou: ${results.passed}`);
  Logger.log(`❌ Falhou: ${results.failed}`);
  Logger.log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  Logger.log('');
  
  // Detalhes dos testes
  results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    Logger.log(`${icon} ${test.name}: ${test.message}`);
  });
  
  Logger.log('');
  Logger.log('='.repeat(80));
  
  return results;
}

/**
 * Executa um teste individual
 */
function runTest(results, name, testFunction) {
  results.total++;
  
  try {
    Logger.log(`🧪 Testando: ${name}...`);
    const result = testFunction();
    
    if (result.success) {
      results.passed++;
      results.tests.push({
        name: name,
        passed: true,
        message: result.message || 'Passou'
      });
      Logger.log(`   ✅ ${name}: PASSOU`);
    } else {
      results.failed++;
      results.tests.push({
        name: name,
        passed: false,
        message: result.message || 'Falhou'
      });
      Logger.log(`   ❌ ${name}: FALHOU - ${result.message}`);
    }
  } catch (error) {
    results.failed++;
    results.tests.push({
      name: name,
      passed: false,
      message: error.toString()
    });
    Logger.log(`   ❌ ${name}: ERRO - ${error.toString()}`);
  }
  
  Logger.log('');
}

// ============================================================================
// TESTES INDIVIDUAIS
// ============================================================================

/**
 * Teste 1: Configuração de Ambiente
 */
function testEnvironmentSetup() {
  const env = validateEnvironment();
  
  if (!env.hasSpreadsheetId) {
    return {
      success: false,
      message: 'SPREADSHEET_ID não configurado. Execute setupSpreadsheetId()'
    };
  }
  
  return {
    success: true,
    message: `Ambiente: ${env.mode}, ID: ${env.spreadsheetId}`
  };
}

/**
 * Teste 2: Acesso ao Spreadsheet
 */
function testSpreadsheetAccess() {
  try {
    const ss = getSpreadsheet();
    const name = ss.getName();
    const sheets = ss.getSheets().length;
    
    return {
      success: true,
      message: `Planilha "${name}" acessada (${sheets} abas)`
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 3: Health Check
 */
function testHealthCheck() {
  const health = healthCheck();
  
  if (!health.success) {
    return {
      success: false,
      message: 'Health check falhou'
    };
  }
  
  return {
    success: true,
    message: `Status: ${health.status}, Versão: ${health.version}`
  };
}

/**
 * Teste 4: CRUD - Create
 */
function testCreate() {
  try {
    // Cria registro de teste
    const testData = {
      Nome_Completo: 'Teste Integração',
      RA: 'TEST-' + Date.now(),
      Escola: 'Escola Teste',
      Status_Ativo: 'Ativo'
    };
    
    const result = createRecord({
      sheetName: 'Alunos',
      data: testData
    });
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Falha ao criar registro'
      };
    }
    
    // Salva ID para testes posteriores
    PropertiesService.getScriptProperties().setProperty('TEST_RECORD_ID', result.data.ID);
    
    return {
      success: true,
      message: `Registro criado: ${result.data.ID}`
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 5: CRUD - Read
 */
function testRead() {
  try {
    const result = readRecords({
      sheetName: 'Alunos'
    });
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Falha ao ler registros'
      };
    }
    
    const count = Array.isArray(result.data) ? result.data.length : 0;
    
    return {
      success: true,
      message: `${count} registros lidos`
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 6: CRUD - Update
 */
function testUpdate() {
  try {
    const testId = PropertiesService.getScriptProperties().getProperty('TEST_RECORD_ID');
    
    if (!testId) {
      return {
        success: false,
        message: 'ID de teste não encontrado. Execute testCreate primeiro'
      };
    }
    
    const result = updateRecord({
      sheetName: 'Alunos',
      id: testId,
      data: {
        Nome_Completo: 'Teste Integração ATUALIZADO'
      }
    });
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Falha ao atualizar registro'
      };
    }
    
    return {
      success: true,
      message: `Registro ${testId} atualizado`
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 7: CRUD - Delete
 */
function testDelete() {
  try {
    const testId = PropertiesService.getScriptProperties().getProperty('TEST_RECORD_ID');
    
    if (!testId) {
      return {
        success: false,
        message: 'ID de teste não encontrado'
      };
    }
    
    const result = deleteRecord({
      sheetName: 'Alunos',
      id: testId
    });
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Falha ao deletar registro'
      };
    }
    
    // Limpa propriedade
    PropertiesService.getScriptProperties().deleteProperty('TEST_RECORD_ID');
    
    return {
      success: true,
      message: `Registro ${testId} deletado`
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 8: API Response Helpers
 */
function testAPIResponseHelpers() {
  try {
    // Testa apiSuccess
    const success = apiSuccess({ test: 'data' }, 'Teste');
    if (!success.success || !success.data) {
      return {
        success: false,
        message: 'apiSuccess não retornou estrutura correta'
      };
    }
    
    // Testa apiError
    const error = apiError('Erro de teste', 'TEST_ERROR');
    if (error.success !== false || !error.error) {
      return {
        success: false,
        message: 'apiError não retornou estrutura correta'
      };
    }
    
    // Testa apiValidationError
    const validation = apiValidationError('Validação falhou', { field: 'erro' });
    if (validation.errorType !== 'VALIDATION') {
      return {
        success: false,
        message: 'apiValidationError não retornou tipo correto'
      };
    }
    
    return {
      success: true,
      message: 'Todos os helpers funcionando'
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 9: Error Handling
 */
function testErrorHandling() {
  try {
    // Testa ErrorHandler.handle
    const error = new Error('Erro de teste');
    const handled = ErrorHandler.handle('testContext', error);
    
    if (handled.success !== false || !handled.message || !handled.code) {
      return {
        success: false,
        message: 'ErrorHandler não retornou estrutura correta (esperado success=false, message, code)'
      };
    }
    
    // Testa ErrorHandler.validation
    const validationError = ErrorHandler.validation('Campo obrigatório');
    if (validationError.type !== ERROR_TYPES.VALIDATION) {
      return {
        success: false,
        message: 'ErrorHandler.validation não retornou tipo correto'
      };
    }
    
    return {
      success: true,
      message: 'Error handling funcionando'
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Teste 10: Cache System
 */
function testCacheSystem() {
  try {
    const cache = CacheService.getScriptCache();
    
    // Testa escrita
    cache.put('test_key', 'test_value', 60);
    
    // Testa leitura
    const value = cache.get('test_key');
    if (value !== 'test_value') {
      return {
        success: false,
        message: 'Cache não retornou valor correto'
      };
    }
    
    // Testa remoção
    cache.remove('test_key');
    const removed = cache.get('test_key');
    if (removed !== null) {
      return {
        success: false,
        message: 'Cache não removeu valor'
      };
    }
    
    return {
      success: true,
      message: 'Cache funcionando corretamente'
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ============================================================================
// TESTES ESPECÍFICOS DE INTEGRAÇÃO FRONTEND
// ============================================================================

/**
 * Testa se todas as funções expostas ao frontend existem
 */
function testFrontendExposedFunctions() {
  Logger.log('🧪 Testando funções expostas ao frontend...\n');
  
  const requiredFunctions = [
    'readRecords',
    'createRecord',
    'updateRecord',
    'deleteRecord',
    'healthCheck',
    'getSystemConfig',
    'include'
  ];
  
  const results = {
    total: requiredFunctions.length,
    found: 0,
    missing: []
  };
  
  requiredFunctions.forEach(funcName => {
    if (typeof this[funcName] === 'function') {
      results.found++;
      Logger.log(`✅ ${funcName}: Encontrada`);
    } else {
      results.missing.push(funcName);
      Logger.log(`❌ ${funcName}: NÃO ENCONTRADA`);
    }
  });
  
  Logger.log('');
  Logger.log(`Resultado: ${results.found}/${results.total} funções encontradas`);
  
  if (results.missing.length > 0) {
    Logger.log('⚠️  Funções faltando:', results.missing.join(', '));
  }
  
  return results;
}

/**
 * Testa resposta de todas as funções CRUD
 */
function testAllCRUDResponses() {
  Logger.log('🧪 Testando respostas CRUD...\n');
  
  const tests = [
    {
      name: 'readRecords',
      func: () => readRecords({ sheetName: 'Alunos' })
    },
    {
      name: 'healthCheck',
      func: () => healthCheck()
    },
    {
      name: 'getSystemConfig',
      func: () => getSystemConfig()
    }
  ];
  
  tests.forEach(test => {
    try {
      const result = test.func();
      
      if (result && typeof result === 'object') {
        Logger.log(`✅ ${test.name}:`);
        Logger.log(`   - success: ${result.success}`);
        Logger.log(`   - timestamp: ${result.timestamp ? 'Presente' : 'Ausente'}`);
        
        if (result.success) {
          Logger.log(`   - data: ${result.data ? 'Presente' : 'Ausente'}`);
        } else {
          Logger.log(`   - error: ${result.error || 'N/A'}`);
        }
      } else {
        Logger.log(`❌ ${test.name}: Resposta inválida`);
      }
    } catch (error) {
      Logger.log(`❌ ${test.name}: ${error.toString()}`);
    }
    
    Logger.log('');
  });
}

/**
 * Gera relatório de integração
 */
function generateIntegrationReport() {
  Logger.log('='.repeat(80));
  Logger.log('📋 RELATÓRIO DE INTEGRAÇÃO BACKEND-FRONTEND');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  // 1. Ambiente
  Logger.log('1️⃣  AMBIENTE');
  Logger.log('-'.repeat(80));
  const env = validateEnvironment();
  Logger.log(JSON.stringify(env, null, 2));
  Logger.log('');
  
  // 2. Planilhas
  Logger.log('2️⃣  PLANILHAS');
  Logger.log('-'.repeat(80));
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    Logger.log(`Total de abas: ${sheets.length}`);
    sheets.forEach(sheet => {
      const name = sheet.getName();
      const rows = sheet.getLastRow();
      Logger.log(`   - ${name}: ${rows} linhas`);
    });
  } catch (error) {
    Logger.log(`❌ Erro ao acessar planilhas: ${error.toString()}`);
  }
  Logger.log('');
  
  // 3. Funções Expostas
  Logger.log('3️⃣  FUNÇÕES EXPOSTAS AO FRONTEND');
  Logger.log('-'.repeat(80));
  testFrontendExposedFunctions();
  Logger.log('');
  
  // 4. Health Check
  Logger.log('4️⃣  HEALTH CHECK');
  Logger.log('-'.repeat(80));
  const health = healthCheck();
  Logger.log(JSON.stringify(health, null, 2));
  Logger.log('');
  
  // 5. Configuração do Sistema
  Logger.log('5️⃣  CONFIGURAÇÃO DO SISTEMA');
  Logger.log('-'.repeat(80));
  const config = getSystemConfig();
  Logger.log(JSON.stringify(config, null, 2));
  Logger.log('');
  
  Logger.log('='.repeat(80));
  Logger.log('✅ Relatório gerado com sucesso!');
  Logger.log('='.repeat(80));
}

// ============================================================================
// MENU DE TESTES
// ============================================================================

/**
 * Cria menu customizado no Google Sheets para executar testes
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🧪 Testes de Integração')
    .addItem('▶️  Executar Todos os Testes', 'runFullIntegrationTest')
    .addSeparator()
    .addItem('📋 Gerar Relatório', 'generateIntegrationReport')
    .addItem('🔍 Testar Funções Expostas', 'testFrontendExposedFunctions')
    .addItem('📊 Testar Respostas CRUD', 'testAllCRUDResponses')
    .addSeparator()
    .addItem('⚙️  Configurar Ambiente', 'setupSpreadsheetId')
    .addItem('🔧 Validar Ambiente', 'validateEnvironment')
    .addToUi();
}
