/**
 * @file 99_DiagnosticoClasses.gs
 * @description Diagnóstico de disponibilidade de classes e serviços
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2025-11-26
 */

/**
 * Verifica se todas as classes essenciais estão disponíveis
 * Execute esta função para diagnosticar problemas de ordem de carregamento
 */
function diagnosticarDisponibilidadeClasses() {
  Logger.log('='.repeat(80));
  Logger.log('🔍 DIAGNÓSTICO DE DISPONIBILIDADE DE CLASSES');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  const classesToCheck = [
    // Classes de Dados
    'DataService',
    'Repository',
    'UserRepository',
    
    // Classes de Autenticação
    'AuthService',
    'SessionManager',
    'PasswordManager',
    
    // Classes de Validação
    'ValidationService',
    'InputValidator',
    'SchemaService',
    
    // Classes de Serviços
    'LoggerService',
    'PropertiesManager',
    'CacheService',
    'RetryService',
    'AuditService',
    'ExportService',
    'VersionManager',
    'EnvironmentManager',
    
    // Classes de Sistema
    'ErrorHandler',
    'ServiceManager',
    'System'
  ];
  
  const results = {
    total: classesToCheck.length,
    available: 0,
    unavailable: 0,
    classes: []
  };
  
  classesToCheck.forEach(className => {
    const isAvailable = typeof eval(className) !== 'undefined';
    const status = isAvailable ? '✅' : '❌';
    
    results.classes.push({
      name: className,
      available: isAvailable
    });
    
    if (isAvailable) {
      results.available++;
      Logger.log(`${status} ${className}: Disponível`);
    } else {
      results.unavailable++;
      Logger.log(`${status} ${className}: NÃO DISPONÍVEL`);
    }
  });
  
  Logger.log('');
  Logger.log('='.repeat(80));
  Logger.log('📊 RESUMO');
  Logger.log('='.repeat(80));
  Logger.log(`Total de classes: ${results.total}`);
  Logger.log(`✅ Disponíveis: ${results.available}`);
  Logger.log(`❌ Não disponíveis: ${results.unavailable}`);
  Logger.log(`Taxa de disponibilidade: ${((results.available / results.total) * 100).toFixed(1)}%`);
  Logger.log('');
  
  if (results.unavailable > 0) {
    Logger.log('⚠️  ATENÇÃO: Algumas classes não estão disponíveis!');
    Logger.log('Isso pode indicar:');
    Logger.log('  1. Erro de sintaxe no arquivo da classe');
    Logger.log('  2. Problema de ordem de carregamento');
    Logger.log('  3. Arquivo não foi salvo/implantado');
    Logger.log('');
  }
  
  Logger.log('='.repeat(80));
  
  return results;
}

/**
 * Testa a instanciação de todas as classes
 */
function testarInstanciacaoClasses() {
  Logger.log('='.repeat(80));
  Logger.log('🧪 TESTE DE INSTANCIAÇÃO DE CLASSES');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  const tests = [
    {
      name: 'DataService',
      test: () => new DataService('Usuarios')
    },
    {
      name: 'AuthService',
      test: () => new AuthService()
    },
    {
      name: 'SessionManager',
      test: () => new SessionManager()
    },
    {
      name: 'LoggerService',
      test: () => new LoggerService()
    },
    {
      name: 'PropertiesManager',
      test: () => new PropertiesManager()
    },
    {
      name: 'ValidationService',
      test: () => new ValidationService()
    }
  ];
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  tests.forEach(test => {
    try {
      const instance = test.test();
      
      if (instance) {
        results.passed++;
        results.tests.push({
          name: test.name,
          success: true,
          message: 'Instanciado com sucesso'
        });
        Logger.log(`✅ ${test.name}: Instanciado com sucesso`);
      } else {
        results.failed++;
        results.tests.push({
          name: test.name,
          success: false,
          message: 'Retornou null/undefined'
        });
        Logger.log(`❌ ${test.name}: Retornou null/undefined`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: test.name,
        success: false,
        message: error.toString()
      });
      Logger.log(`❌ ${test.name}: ${error.toString()}`);
    }
  });
  
  Logger.log('');
  Logger.log('='.repeat(80));
  Logger.log('📊 RESUMO');
  Logger.log('='.repeat(80));
  Logger.log(`Total de testes: ${results.total}`);
  Logger.log(`✅ Passou: ${results.passed}`);
  Logger.log(`❌ Falhou: ${results.failed}`);
  Logger.log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  Logger.log('');
  Logger.log('='.repeat(80));
  
  return results;
}

/**
 * Testa o ServiceManager
 */
function testarServiceManager() {
  Logger.log('='.repeat(80));
  Logger.log('🧪 TESTE DO SERVICE MANAGER');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  const tests = [
    {
      name: 'getDataService',
      test: () => ServiceManager.getDataService('Usuarios')
    },
    {
      name: 'getAuthService',
      test: () => ServiceManager.getAuthService()
    },
    {
      name: 'getLoggerService',
      test: () => ServiceManager.getLoggerService()
    },
    {
      name: 'getSessionManager',
      test: () => ServiceManager.getSessionManager()
    },
    {
      name: 'getValidationService',
      test: () => ServiceManager.getValidationService()
    },
    {
      name: 'getPropertiesManager',
      test: () => ServiceManager.getPropertiesManager()
    }
  ];
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  tests.forEach(test => {
    try {
      const instance = test.test();
      
      if (instance) {
        results.passed++;
        results.tests.push({
          name: test.name,
          success: true,
          message: 'Retornou instância válida'
        });
        Logger.log(`✅ ${test.name}: Retornou instância válida`);
      } else {
        results.failed++;
        results.tests.push({
          name: test.name,
          success: false,
          message: 'Retornou null/undefined'
        });
        Logger.log(`❌ ${test.name}: Retornou null/undefined`);
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: test.name,
        success: false,
        message: error.toString()
      });
      Logger.log(`❌ ${test.name}: ${error.toString()}`);
    }
  });
  
  Logger.log('');
  Logger.log('='.repeat(80));
  Logger.log('📊 RESUMO');
  Logger.log('='.repeat(80));
  Logger.log(`Total de testes: ${results.total}`);
  Logger.log(`✅ Passou: ${results.passed}`);
  Logger.log(`❌ Falhou: ${results.failed}`);
  Logger.log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  Logger.log('');
  
  // Mostra estatísticas do ServiceManager
  Logger.log('📊 ESTATÍSTICAS DO SERVICE MANAGER');
  Logger.log('-'.repeat(80));
  const stats = ServiceManager.getStats();
  Logger.log(`Total de serviços ativos: ${stats.totalServices}`);
  Logger.log(`Total de acessos: ${stats.totalAccesses}`);
  
  if (stats.mostUsed) {
    Logger.log(`Serviço mais usado: ${stats.mostUsed.key} (${stats.mostUsed.accessCount} acessos)`);
  }
  
  Logger.log('');
  Logger.log('='.repeat(80));
  
  return results;
}

/**
 * Executa todos os diagnósticos
 */
function executarDiagnosticoCompleto() {
  Logger.log('\n\n');
  Logger.log('█'.repeat(80));
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█' + ' '.repeat(20) + 'DIAGNÓSTICO COMPLETO DO SISTEMA' + ' '.repeat(27) + '█');
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█'.repeat(80));
  Logger.log('\n\n');
  
  // 1. Diagnóstico de disponibilidade
  const disponibilidade = diagnosticarDisponibilidadeClasses();
  Logger.log('\n\n');
  
  // 2. Teste de instanciação
  const instanciacao = testarInstanciacaoClasses();
  Logger.log('\n\n');
  
  // 3. Teste do ServiceManager
  const serviceManager = testarServiceManager();
  Logger.log('\n\n');
  
  // Resumo final
  Logger.log('█'.repeat(80));
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█' + ' '.repeat(28) + 'RESUMO FINAL' + ' '.repeat(38) + '█');
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█'.repeat(80));
  Logger.log('');
  Logger.log(`1. Disponibilidade de Classes: ${disponibilidade.available}/${disponibilidade.total} (${((disponibilidade.available / disponibilidade.total) * 100).toFixed(1)}%)`);
  Logger.log(`2. Instanciação de Classes: ${instanciacao.passed}/${instanciacao.total} (${((instanciacao.passed / instanciacao.total) * 100).toFixed(1)}%)`);
  Logger.log(`3. ServiceManager: ${serviceManager.passed}/${serviceManager.total} (${((serviceManager.passed / serviceManager.total) * 100).toFixed(1)}%)`);
  Logger.log('');
  
  const totalTests = disponibilidade.total + instanciacao.total + serviceManager.total;
  const totalPassed = disponibilidade.available + instanciacao.passed + serviceManager.passed;
  const overallSuccess = ((totalPassed / totalTests) * 100).toFixed(1);
  
  Logger.log(`Taxa de sucesso geral: ${overallSuccess}%`);
  Logger.log('');
  
  if (overallSuccess >= 90) {
    Logger.log('✅ SISTEMA SAUDÁVEL - Todas as classes e serviços estão funcionando corretamente!');
  } else if (overallSuccess >= 70) {
    Logger.log('⚠️  ATENÇÃO - Alguns problemas detectados. Revise os logs acima.');
  } else {
    Logger.log('❌ CRÍTICO - Múltiplos problemas detectados. Ação imediata necessária!');
  }
  
  Logger.log('');
  Logger.log('█'.repeat(80));
  Logger.log('\n\n');
  
  return {
    disponibilidade,
    instanciacao,
    serviceManager,
    overallSuccess: parseFloat(overallSuccess)
  };
}
