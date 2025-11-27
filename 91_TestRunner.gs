/**
 * @file TestRunner.gs
 * @description Sistema de testes automatizados
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo implementa um sistema completo de testes automatizados,
 * incluindo smoke tests, testes unitários e testes de integração.
 * 
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// TEST RUNNER - SISTEMA DE TESTES
// ============================================================================

/**
 * @namespace TestRunner
 * @description Sistema de execução de testes
 */
var TestRunner = (function() {
  
  /**
   * @typedef {Object} TestResult
   * @property {string} name - Nome do teste
   * @property {boolean} passed - Se passou
   * @property {string} [error] - Mensagem de erro
   * @property {number} duration - Duração em ms
   */
  
  /**
   * @typedef {Object} TestSuite
   * @property {string} name - Nome da suite
   * @property {Array<TestResult>} tests - Resultados dos testes
   * @property {number} total - Total de testes
   * @property {number} passed - Testes que passaram
   * @property {number} failed - Testes que falharam
   * @property {number} duration - Duração total em ms
   */
  
  var results = [];
  var currentSuite = null;
  
  return {
    /**
     * Inicia nova suite de testes
     * 
     * @memberof TestRunner
     * @param {string} name - Nome da suite
     * 
     * @example
     * TestRunner.suite('Config Tests');
     * TestRunner.test('Deve ter CORE_CONFIG', function() { ... });
     * TestRunner.endSuite();
     * 
     * @since 1.0.0
     */
    suite: function(name) {
      currentSuite = {
        name: name,
        tests: [],
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        startTime: new Date().getTime()
      };
      
      Logger.log('\n' + '='.repeat(60));
      Logger.log('📦 SUITE: ' + name);
      Logger.log('='.repeat(60));
    },
    
    /**
     * Executa um teste
     * 
     * @memberof TestRunner
     * @param {string} name - Nome do teste
     * @param {Function} testFn - Função de teste
     * 
     * @example
     * TestRunner.test('Deve somar corretamente', function() {
     *   var result = 2 + 2;
     *   TestRunner.assert(result === 4, 'Soma incorreta');
     * });
     * 
     * @since 1.0.0
     */
    test: function(name, testFn) {
      if (!currentSuite) {
        throw new Error('Nenhuma suite ativa. Use TestRunner.suite() primeiro.');
      }
      
      var startTime = new Date().getTime();
      var result = {
        name: name,
        passed: false,
        error: null,
        duration: 0
      };
      
      try {
        testFn();
        result.passed = true;
        currentSuite.passed++;
        Logger.log('  ✅ ' + name);
      } catch (error) {
        result.passed = false;
        result.error = error.message;
        currentSuite.failed++;
        Logger.log('  ❌ ' + name);
        Logger.log('     Erro: ' + error.message);
      }
      
      result.duration = new Date().getTime() - startTime;
      currentSuite.tests.push(result);
      currentSuite.total++;
    },
    
    /**
     * Finaliza suite atual
     * 
     * @memberof TestRunner
     * @return {TestSuite} Resultado da suite
     * 
     * @since 1.0.0
     */
    endSuite: function() {
      if (!currentSuite) {
        throw new Error('Nenhuma suite ativa.');
      }
      
      currentSuite.duration = new Date().getTime() - currentSuite.startTime;
      
      Logger.log('');
      Logger.log('📊 Resultado: ' + currentSuite.passed + '/' + currentSuite.total + ' testes passaram');
      Logger.log('⏱️  Duração: ' + currentSuite.duration + 'ms');
      
      results.push(currentSuite);
      var suite = currentSuite;
      currentSuite = null;
      
      return suite;
    },
    
    /**
     * Assertion básica
     * 
     * @memberof TestRunner
     * @param {boolean} condition - Condição a verificar
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se condição falsa
     * 
     * @example
     * TestRunner.assert(value === expected, 'Valores não são iguais');
     * 
     * @since 1.0.0
     */
    assert: function(condition, message) {
      if (!condition) {
        throw new Error(message || 'Assertion falhou');
      }
    },
    
    /**
     * Verifica igualdade
     * 
     * @memberof TestRunner
     * @param {*} actual - Valor atual
     * @param {*} expected - Valor esperado
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se valores diferentes
     * 
     * @since 1.0.0
     */
    assertEqual: function(actual, expected, message) {
      if (actual !== expected) {
        throw new Error(message || 'Esperado: ' + expected + ', Recebido: ' + actual);
      }
    },
    
    /**
     * Verifica se é verdadeiro
     * 
     * @memberof TestRunner
     * @param {*} value - Valor a verificar
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se falso
     * 
     * @since 1.0.0
     */
    assertTrue: function(value, message) {
      if (value !== true) {
        throw new Error(message || 'Esperado true, recebido: ' + value);
      }
    },
    
    /**
     * Verifica se é falso
     * 
     * @memberof TestRunner
     * @param {*} value - Valor a verificar
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se verdadeiro
     * 
     * @since 1.0.0
     */
    assertFalse: function(value, message) {
      if (value !== false) {
        throw new Error(message || 'Esperado false, recebido: ' + value);
      }
    },
    
    /**
     * Verifica se é null
     * 
     * @memberof TestRunner
     * @param {*} value - Valor a verificar
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se não null
     * 
     * @since 1.0.0
     */
    assertNull: function(value, message) {
      if (value !== null) {
        throw new Error(message || 'Esperado null, recebido: ' + value);
      }
    },
    
    /**
     * Verifica se não é null
     * 
     * @memberof TestRunner
     * @param {*} value - Valor a verificar
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se null
     * 
     * @since 1.0.0
     */
    assertNotNull: function(value, message) {
      if (value === null) {
        throw new Error(message || 'Valor não deveria ser null');
      }
    },
    
    /**
     * Verifica se lança erro
     * 
     * @memberof TestRunner
     * @param {Function} fn - Função que deve lançar erro
     * @param {string} [message] - Mensagem de erro
     * @throws {Error} Se não lançar erro
     * 
     * @since 1.0.0
     */
    assertThrows: function(fn, message) {
      var threw = false;
      try {
        fn();
      } catch (error) {
        threw = true;
      }
      
      if (!threw) {
        throw new Error(message || 'Função deveria ter lançado erro');
      }
    },
    
    /**
     * Obtém todos os resultados
     * 
     * @memberof TestRunner
     * @return {Array<TestSuite>} Resultados de todas as suites
     * 
     * @since 1.0.0
     */
    getResults: function() {
      return results;
    },
    
    /**
     * Limpa resultados
     * 
     * @memberof TestRunner
     * 
     * @since 1.0.0
     */
    clearResults: function() {
      results = [];
      currentSuite = null;
    },
    
    /**
     * Calcula resultados consolidados
     * 
     * @memberof TestRunner
     * @return {Object} Totais calculados
     * 
     * @since 1.1.0
     */
    calculateResults: function() {
      var totalPassed = 0;
      var totalFailed = 0;
      var totalTests = 0;
      var totalDuration = 0;
      
      results.forEach(function(suite) {
        totalPassed += suite.passed;
        totalFailed += suite.failed;
        totalTests += suite.total;
        totalDuration += suite.duration;
      });
      
      return {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        duration: totalDuration,
        suites: results.length,
        success: totalFailed === 0,
        successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) + '%' : '0.0%'
      };
    },

    /**
     * Imprime relatório final
     * 
     * @memberof TestRunner
     * 
     * @since 1.0.0
     */
    printReport: function() {
      Logger.log('\n\n' + '='.repeat(60));
      Logger.log('📊 RELATÓRIO FINAL DE TESTES');
      Logger.log('='.repeat(60));
      
      var totalTests = 0;
      var totalPassed = 0;
      var totalFailed = 0;
      var totalDuration = 0;
      
      results.forEach(function(suite) {
        totalTests += suite.total;
        totalPassed += suite.passed;
        totalFailed += suite.failed;
        totalDuration += suite.duration;
        
        var icon = suite.failed === 0 ? '✅' : '❌';
        Logger.log(icon + ' ' + suite.name + ': ' + suite.passed + '/' + suite.total);
      });
      
      Logger.log('');
      Logger.log('Total de Suites: ' + results.length);
      Logger.log('Total de Testes: ' + totalTests);
      Logger.log('Passaram: ' + totalPassed + ' (' + ((totalPassed/totalTests)*100).toFixed(1) + '%)');
      Logger.log('Falharam: ' + totalFailed);
      Logger.log('Duração Total: ' + totalDuration + 'ms');
      Logger.log('='.repeat(60));
    }
  };
})();

// ============================================================================
// SMOKE TESTS - TESTES RÁPIDOS DE VALIDAÇÃO
// ============================================================================

/**
 * Executa smoke tests do sistema
 * 
 * Smoke tests são testes rápidos que verificam se os componentes
 * principais do sistema estão funcionando.
 * 
 * @return {Object} Resultado dos testes
 * @return {boolean} return.success - Se todos passaram
 * @return {number} return.total - Total de testes
 * @return {number} return.passed - Testes que passaram
 * @return {number} return.failed - Testes que falharam
 * 
 * @example
 * var result = runSmokeTests();
 * if (!result.success) {
 *   console.log('Smoke tests falharam!');
 * }
 * 
 * @since 1.0.0
 */
function runSmokeTests() {
  Logger.log('🔥 EXECUTANDO SMOKE TESTS...\n');
  
  TestRunner.clearResults();
  
  // Suite 1: Configurações
  TestRunner.suite('Configurações');
  
  TestRunner.test('CORE_CONFIG deve estar definido', function() {
    TestRunner.assertNotNull(CORE_CONFIG, 'CORE_CONFIG não definido');
  });
  
  TestRunner.test('SHEET_NAMES deve estar definido', function() {
    TestRunner.assertNotNull(SHEET_NAMES, 'SHEET_NAMES não definido');
  });
  
  TestRunner.test('BOOTSTRAP_CONFIG deve estar definido', function() {
    TestRunner.assertNotNull(BOOTSTRAP_CONFIG, 'BOOTSTRAP_CONFIG não definido');
  });
  
  TestRunner.endSuite();
  
  // Suite 2: Serviços
  TestRunner.suite('Serviços');
  
  TestRunner.test('ServiceManager deve estar disponível', function() {
    TestRunner.assertNotNull(ServiceManager, 'ServiceManager não definido');
  });
  
  TestRunner.test('Router deve estar disponível', function() {
    TestRunner.assertNotNull(Router, 'Router não definido');
  });
  
  TestRunner.test('Utils deve estar disponível', function() {
    TestRunner.assertNotNull(StringUtils, 'StringUtils não definido');
    TestRunner.assertNotNull(ArrayUtils, 'ArrayUtils não definido');
  });
  
  TestRunner.endSuite();
  
  // Suite 3: Funções Principais
  TestRunner.suite('Funções Principais');
  
  TestRunner.test('doGet deve estar definido', function() {
    TestRunner.assertEqual(typeof doGet, 'function', 'doGet não é função');
  });
  
  TestRunner.test('doPost deve estar definido', function() {
    TestRunner.assertEqual(typeof doPost, 'function', 'doPost não é função');
  });
  
  TestRunner.test('include deve estar definido', function() {
    TestRunner.assertEqual(typeof include, 'function', 'include não é função');
  });
  
  TestRunner.endSuite();
  
  // Suite 4: Bootstrap
  TestRunner.suite('Bootstrap');
  
  TestRunner.test('checkBootstrapStatus deve funcionar', function() {
    var status = checkBootstrapStatus();
    TestRunner.assertNotNull(status, 'Status é null');
    TestRunner.assertTrue(status.initialized, 'Sistema não inicializado');
  });
  
  TestRunner.endSuite();
  
  // Suite 5: Router
  TestRunner.suite('Router');
  
  TestRunner.test('Router.listRoutes deve funcionar', function() {
    var routes = Router.listRoutes();
    TestRunner.assertTrue(Array.isArray(routes), 'Routes não é array');
    TestRunner.assertTrue(routes.length > 0, 'Nenhuma rota definida');
  });
  
  TestRunner.test('Router.route deve funcionar', function() {
    var result = Router.route({ parameter: {} });
    TestRunner.assertNotNull(result, 'Route retornou null');
  });
  
  TestRunner.endSuite();
  
  // Relatório final
  TestRunner.printReport();
  
  return TestRunner.calculateResults();
}

// ============================================================================
// TESTES UNITÁRIOS - COMPONENTES INDIVIDUAIS
// ============================================================================

/**
 * Testa utilitários de String
 * 
 * @return {TestSuite} Resultado da suite
 * 
 * @since 1.0.0
 */
function testStringUtils() {
  TestRunner.suite('StringUtils');
  
  TestRunner.test('capitalize deve funcionar', function() {
    var result = StringUtils.capitalize('hello');
    TestRunner.assertEqual(result, 'Hello');
  });
  
  TestRunner.test('slugify deve funcionar', function() {
    var result = StringUtils.slugify('Hello World 123');
    TestRunner.assertEqual(result, 'hello-world-123');
  });
  
  TestRunner.test('truncate deve funcionar', function() {
    var result = StringUtils.truncate('Lorem ipsum', 5);
    TestRunner.assertEqual(result, 'Lorem...');
  });
  
  TestRunner.test('isEmpty deve funcionar', function() {
    TestRunner.assertTrue(StringUtils.isEmpty(''));
    TestRunner.assertTrue(StringUtils.isEmpty('   '));
    TestRunner.assertFalse(StringUtils.isEmpty('text'));
  });
  
  return TestRunner.endSuite();
}

/**
 * Testa utilitários de Array
 * 
 * @return {TestSuite} Resultado da suite
 * 
 * @since 1.0.0
 */
function testArrayUtils() {
  TestRunner.suite('ArrayUtils');
  
  TestRunner.test('chunk deve funcionar', function() {
    var result = ArrayUtils.chunk([1,2,3,4,5], 2);
    TestRunner.assertEqual(result.length, 3);
    TestRunner.assertEqual(result[0].length, 2);
  });
  
  TestRunner.test('unique deve funcionar', function() {
    var result = ArrayUtils.unique([1,2,2,3,3,3]);
    TestRunner.assertEqual(result.length, 3);
  });
  
  TestRunner.test('isEmpty deve funcionar', function() {
    TestRunner.assertTrue(ArrayUtils.isEmpty([]));
    TestRunner.assertFalse(ArrayUtils.isEmpty([1]));
  });
  
  return TestRunner.endSuite();
}

/**
 * Testa validações
 * 
 * @return {TestSuite} Resultado da suite
 * 
 * @since 1.0.0
 */
function testValidationUtils() {
  TestRunner.suite('ValidationUtils');
  
  TestRunner.test('isValidEmail deve funcionar', function() {
    TestRunner.assertTrue(ValidationUtils.isValidEmail('test@example.com'));
    TestRunner.assertFalse(ValidationUtils.isValidEmail('invalid'));
  });
  
  TestRunner.test('isValidCPF deve funcionar', function() {
    // CPF válido: 111.444.777-35
    TestRunner.assertTrue(ValidationUtils.isValidCPF('11144477735'));
    TestRunner.assertFalse(ValidationUtils.isValidCPF('11111111111'));
  });
  
  TestRunner.test('isValidPhone deve funcionar', function() {
    TestRunner.assertTrue(ValidationUtils.isValidPhone('11987654321'));
    TestRunner.assertFalse(ValidationUtils.isValidPhone('123'));
  });
  
  return TestRunner.endSuite();
}

// ============================================================================
// TESTES DE INTEGRAÇÃO - COMPONENTES JUNTOS
// ============================================================================

/**
 * Testa integração Config + ServiceManager
 * 
 * @return {TestSuite} Resultado da suite
 * 
 * @since 1.0.0
 */
function testConfigIntegration() {
  TestRunner.suite('Integração: Config + ServiceManager');
  
  TestRunner.test('getConfig deve funcionar', function() {
    // Debug: Verifica se CORE_CONFIG existe
    TestRunner.assertNotNull(CORE_CONFIG, 'CORE_CONFIG não definido');
    TestRunner.assertNotNull(CORE_CONFIG.system, 'CORE_CONFIG.system não definido');
    TestRunner.assertNotNull(CORE_CONFIG.system.VERSION, 'CORE_CONFIG.system.VERSION não definido');
    
    // Testa getConfig
    var value = getConfig('system.VERSION');
    Logger.log('[Test] getConfig("system.VERSION") retornou: ' + value);
    TestRunner.assertNotNull(value, 'getConfig retornou null para system.VERSION');
    TestRunner.assertEqual(value, '1.1.0', 'Versão incorreta');
  });
  
  TestRunner.test('ServiceManager deve usar Config', function() {
    var ds = ServiceManager.getDataService('Alunos');
    TestRunner.assertNotNull(ds);
  });
  
  return TestRunner.endSuite();
}

/**
 * Testa integração Bootstrap + Router
 * 
 * @return {TestSuite} Resultado da suite
 * 
 * @since 1.0.0
 */
function testBootstrapRouterIntegration() {
  TestRunner.suite('Integração: Bootstrap + Router');
  
  TestRunner.test('doGet deve usar Router', function() {
    var result = doGet({ parameter: {} });
    TestRunner.assertNotNull(result);
  });
  
  TestRunner.test('Router deve servir páginas', function() {
    var result = Router.route({ parameter: { page: 'index' } });
    TestRunner.assertNotNull(result);
  });
  
  return TestRunner.endSuite();
}

// ============================================================================
// SUITE COMPLETA - TODOS OS TESTES
// ============================================================================

/**
 * Executa todos os testes do sistema
 * 
 * @return {Object} Resultado consolidado
 * 
 * @example
 * var result = runAllTests();
 * console.log('Sucesso:', result.success);
 * console.log('Total:', result.total);
 * 
 * @since 1.0.0
 */
function runAllTests() {
  Logger.log('🧪 EXECUTANDO TODOS OS TESTES...\n');
  
  TestRunner.clearResults();
  
  // Smoke tests
  runSmokeTests();
  
  // Testes unitários
  testStringUtils();
  testArrayUtils();
  testValidationUtils();
  
  // Testes de integração
  testConfigIntegration();
  testBootstrapRouterIntegration();
  
  // Relatório final
  TestRunner.printReport();
  
  return TestRunner.calculateResults();
}

/**
 * Executa teste inicial rápido
 * 
 * Função conveniente para validação rápida do sistema.
 * 
 * @return {boolean} true se sistema OK
 * 
 * @since 1.0.0
 */
function testInitialLoad() {
  try {
    // Verifica configurações
    if (typeof CORE_CONFIG === 'undefined') {
      Logger.log('❌ CORE_CONFIG não definido');
      return false;
    }
    
    // Verifica serviços
    if (typeof ServiceManager === 'undefined') {
      Logger.log('❌ ServiceManager não definido');
      return false;
    }
    
    // Verifica router
    if (typeof Router === 'undefined') {
      Logger.log('❌ Router não definido');
      return false;
    }
    
    Logger.log('✅ Sistema carregado corretamente');
    return true;
    
  } catch (error) {
    Logger.log('❌ Erro ao carregar sistema: ' + error.message);
    return false;
  }
}

/**
 * Executa APENAS testes de integração
 * 
 * Foco: Configuração, Rotas, Serviços de Dados e API
 * 
 * @return {Object} Resultado consolidado
 */
function runIntegrationTestsOnly() {
  Logger.log('🔌 EXECUTANDO TESTES DE INTEGRAÇÃO...\n');
  
  TestRunner.clearResults();
  
  // 1. Integrações Básicas (TestRunner.gs)
  testConfigIntegration();
  testBootstrapRouterIntegration();
  
  // 2. Integrações de Dados e API (ExtendedTestService)
  // Precisamos instanciar o ExtendedTestService se disponível
  if (typeof ExtendedTestService !== 'undefined') {
    var extendedService = new ExtendedTestService();
    
    // Executa testes de planilhas (Core Mínimo)
    extendedService.runAllSheetsIntegration();
    
    // Executa testes de API
    extendedService.runAPITests();
    
    // Mescla resultados do ExtendedTestService no TestRunner para relatório unificado
    // Nota: Isso é uma adaptação visual, já que são sistemas levemente diferentes
    var extendedReport = extendedService.generateReport();
    Logger.log('\n--- Resumo Extended Service ---');
    Logger.log('Passou: ' + extendedReport.summary.passed);
    Logger.log('Falhou: ' + extendedReport.summary.failed);
  } else {
    Logger.log('⚠️ ExtendedTestService não encontrado. Pulando testes avançados.');
  }
  
  // Relatório final do TestRunner
  TestRunner.printReport();
  
  return TestRunner.calculateResults();
}
