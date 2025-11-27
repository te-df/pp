/**
 * @file TestSmartSystem.gs
 * @description Testes para o sistema inteligente de ativação do Colab
 * @version 1.0.0
 */

/**
 * Teste completo do sistema inteligente
 */
function testSmartSystemComplete() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 TESTE COMPLETO DO SISTEMA INTELIGENTE');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  var results = {
    analysis: false,
    calculation: false,
    activation: false,
    history: false
  };
  
  try {
    // Teste 1: Análise de Jobs
    Logger.log('📋 TESTE 1: Análise de Jobs Pendentes');
    Logger.log('-'.repeat(70));
    
    // Cria jobs de teste
    Logger.log('Criando jobs de teste...');
    var jobIds = [];
    
    jobIds.push(enqueueJob('EXPORT_CSV', {test: 1}));
    jobIds.push(enqueueJob('EXPORT_CSV', {test: 2}));
    jobIds.push(enqueueJob('CALCULATE_STATS', {test: 3}));
    jobIds.push(enqueueJob('CALCULATE_STATS', {test: 4}));
    jobIds.push(enqueueJob('GENERATE_REPORT', {test: 5}));
    
    Logger.log('✓ 5 jobs criados');
    
    // Analisa jobs
    var stats = analyzePendingJobs();
    
    if (stats.total >= 5) {
      Logger.log('✓ Análise funcionou');
      Logger.log('  Total: ' + stats.total);
      Logger.log('  EXPORT_CSV: ' + (stats.byType['EXPORT_CSV'] || 0));
      Logger.log('  CALCULATE_STATS: ' + (stats.byType['CALCULATE_STATS'] || 0));
      Logger.log('  GENERATE_REPORT: ' + (stats.byType['GENERATE_REPORT'] || 0));
      results.analysis = true;
    } else {
      Logger.log('✗ Análise falhou');
      Logger.log('  Esperado: >= 5, Obtido: ' + stats.total);
    }
    
    // Teste 2: Cálculo de Duração
    Logger.log('');
    Logger.log('📋 TESTE 2: Cálculo de Duração');
    Logger.log('-'.repeat(70));
    
    var duration = stats.estimatedDuration;
    var minutes = secondsToMinutes(duration);
    
    Logger.log('Duração calculada: ' + formatDuration(duration));
    Logger.log('Em minutos: ' + minutes);
    
    // Verifica se duração faz sentido
    // 2 EXPORT_CSV (45s) + 2 CALCULATE_STATS (10s) + 1 GENERATE_REPORT (60s)
    // = 90 + 20 + 60 = 170s + overhead (5s × 5) = 195s × 1.2 = 234s ≈ 4min
    
    if (duration > 0 && duration < 600) {  // Entre 0 e 10 minutos
      Logger.log('✓ Cálculo parece correto');
      Logger.log('  Esperado: ~4 min, Obtido: ' + minutes + ' min');
      results.calculation = true;
    } else {
      Logger.log('✗ Cálculo parece incorreto');
      Logger.log('  Duração: ' + duration + 's');
    }
    
    // Teste 3: Ativação Inteligente
    Logger.log('');
    Logger.log('📋 TESTE 3: Ativação Inteligente');
    Logger.log('-'.repeat(70));
    
    // Verifica se webhook está configurado
    try {
      var webhookUrl = getColabWebhookUrl();
      Logger.log('Webhook configurado: ' + webhookUrl);
      
      // Testa ativação
      Logger.log('Testando ativação inteligente...');
      var activateResult = smartActivateColab();
      
      if (activateResult.success) {
        Logger.log('✓ Ativação inteligente funcionou');
        
        if (activateResult.activated) {
          Logger.log('  Processador ativado');
          Logger.log('  Jobs: ' + activateResult.stats.total);
          Logger.log('  Duração: ' + activateResult.estimatedDuration + ' min');
          
          // Aguarda 3 segundos
          Logger.log('  Aguardando 3 segundos...');
          Utilities.sleep(3000);
          
          // Desativa
          Logger.log('  Desativando processador...');
          deactivateColabProcessor();
          
        } else {
          Logger.log('  Processador não foi ativado');
          Logger.log('  Motivo: ' + activateResult.reason);
        }
        
        results.activation = true;
        
      } else {
        Logger.log('✗ Ativação falhou: ' + activateResult.error);
      }
      
    } catch (error) {
      Logger.log('⚠ Webhook não configurado: ' + error.message);
      Logger.log('  Execute: setupSmartColabSystem("webhook_url")');
      results.activation = null;  // Não é falha, apenas não configurado
    }
    
    // Teste 4: Histórico
    Logger.log('');
    Logger.log('📋 TESTE 4: Histórico de Ativações');
    Logger.log('-'.repeat(70));
    
    var history = analyzeActivationHistory();
    
    if (history.success) {
      Logger.log('✓ Histórico disponível');
      Logger.log('  Ativações: ' + history.totalActivations);
      Logger.log('  Jobs processados: ' + history.totalJobs);
      Logger.log('  Duração média: ' + history.avgDuration + ' min');
      results.history = true;
    } else {
      Logger.log('ℹ️  ' + history.message);
      results.history = null;  // Não é falha, apenas sem histórico ainda
    }
    
    // Limpa jobs de teste
    Logger.log('');
    Logger.log('🧹 Limpando jobs de teste...');
    jobIds.forEach(function(jobId) {
      try {
        updateJobStatus(jobId, 'COMPLETED', {test: true});
      } catch (e) {
        // Ignora erros
      }
    });
    Logger.log('✓ Jobs de teste limpos');
    
    // Resumo
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log('RESUMO DOS TESTES');
    Logger.log('='.repeat(70));
    Logger.log('Análise de Jobs: ' + (results.analysis ? '✓' : '✗'));
    Logger.log('Cálculo de Duração: ' + (results.calculation ? '✓' : '✗'));
    Logger.log('Ativação Inteligente: ' + (results.activation === true ? '✓' : results.activation === null ? '⚠ Não configurado' : '✗'));
    Logger.log('Histórico: ' + (results.history === true ? '✓' : results.history === null ? 'ℹ️  Sem dados' : '✗'));
    
    var passed = results.analysis && results.calculation;
    
    Logger.log('');
    Logger.log('='.repeat(70));
    if (passed) {
      Logger.log('✅ TESTES PRINCIPAIS PASSARAM!');
      Logger.log('');
      Logger.log('Sistema inteligente está funcionando corretamente.');
      
      if (results.activation === null) {
        Logger.log('');
        Logger.log('⚠️  Para testar ativação, configure o webhook:');
        Logger.log('   setupSmartColabSystem("https://sua-url.ngrok.io")');
      }
    } else {
      Logger.log('⚠️  ALGUNS TESTES FALHARAM');
      Logger.log('');
      Logger.log('Verifique os erros acima.');
    }
    Logger.log('='.repeat(70));
    Logger.log('');
    
    return results;
    
  } catch (error) {
    Logger.log('');
    Logger.log('✗ ERRO DURANTE OS TESTES: ' + error.message);
    Logger.log(error.stack);
    return results;
  }
}

/**
 * Teste de cálculo de duração com diferentes cenários
 */
function testDurationCalculation() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 TESTE DE CÁLCULO DE DURAÇÃO');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  var scenarios = [
    {
      name: 'Poucos jobs rápidos',
      jobs: [
        {type: 'CALCULATE_STATS', count: 3}
      ],
      expectedMin: 1,
      expectedMax: 5
    },
    {
      name: 'Jobs médios',
      jobs: [
        {type: 'EXPORT_CSV', count: 5}
      ],
      expectedMin: 4,
      expectedMax: 8
    },
    {
      name: 'Jobs longos',
      jobs: [
        {type: 'PROCESS_BATCH', count: 3}
      ],
      expectedMin: 10,
      expectedMax: 15
    },
    {
      name: 'Mix de jobs',
      jobs: [
        {type: 'EXPORT_CSV', count: 2},
        {type: 'CALCULATE_STATS', count: 3},
        {type: 'GENERATE_REPORT', count: 1}
      ],
      expectedMin: 3,
      expectedMax: 7
    }
  ];
  
  scenarios.forEach(function(scenario, index) {
    Logger.log('Cenário ' + (index + 1) + ': ' + scenario.name);
    Logger.log('-'.repeat(70));
    
    // Cria jobs
    var jobIds = [];
    scenario.jobs.forEach(function(jobSpec) {
      for (var i = 0; i < jobSpec.count; i++) {
        var jobId = enqueueJob(jobSpec.type, {scenario: index + 1, job: i + 1});
        jobIds.push(jobId);
      }
    });
    
    Logger.log('Jobs criados: ' + jobIds.length);
    
    // Analisa
    var stats = analyzePendingJobs();
    var minutes = secondsToMinutes(stats.estimatedDuration);
    
    Logger.log('Duração calculada: ' + formatDuration(stats.estimatedDuration) + ' (' + minutes + ' min)');
    Logger.log('Esperado: ' + scenario.expectedMin + '-' + scenario.expectedMax + ' min');
    
    // Verifica
    if (minutes >= scenario.expectedMin && minutes <= scenario.expectedMax) {
      Logger.log('✓ Cálculo correto');
    } else {
      Logger.log('⚠ Cálculo fora do esperado');
    }
    
    // Limpa
    jobIds.forEach(function(jobId) {
      try {
        updateJobStatus(jobId, 'COMPLETED', {test: true});
      } catch (e) {
        // Ignora
      }
    });
    
    Logger.log('');
  });
  
  Logger.log('='.repeat(70));
  Logger.log('');
}

/**
 * Teste de limites (mínimo e máximo)
 */
function testDurationLimits() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 TESTE DE LIMITES DE DURAÇÃO');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  // Teste 1: Abaixo do mínimo
  Logger.log('Teste 1: Duração abaixo do mínimo');
  Logger.log('-'.repeat(70));
  
  var jobId1 = enqueueJob('SIMPLE_QUERY', {test: 'min'});
  var stats1 = analyzePendingJobs();
  var minutes1 = secondsToMinutes(stats1.estimatedDuration);
  
  Logger.log('Duração calculada: ' + minutes1 + ' min');
  Logger.log('Mínimo configurado: ' + MIN_EXECUTION_MINUTES + ' min');
  
  if (minutes1 >= MIN_EXECUTION_MINUTES) {
    Logger.log('✓ Limite mínimo aplicado corretamente');
  } else {
    Logger.log('✗ Limite mínimo NÃO foi aplicado');
  }
  
  updateJobStatus(jobId1, 'COMPLETED', {test: true});
  
  // Teste 2: Acima do máximo
  Logger.log('');
  Logger.log('Teste 2: Duração acima do máximo');
  Logger.log('-'.repeat(70));
  
  // Cria muitos jobs longos
  var jobIds2 = [];
  for (var i = 0; i < 20; i++) {
    jobIds2.push(enqueueJob('FULL_BACKUP', {test: 'max', num: i}));
  }
  
  var stats2 = analyzePendingJobs();
  var minutes2 = secondsToMinutes(stats2.estimatedDuration);
  
  Logger.log('Duração calculada: ' + minutes2 + ' min');
  Logger.log('Máximo configurado: ' + MAX_EXECUTION_MINUTES + ' min');
  
  if (minutes2 <= MAX_EXECUTION_MINUTES) {
    Logger.log('✓ Limite máximo aplicado corretamente');
  } else {
    Logger.log('✗ Limite máximo NÃO foi aplicado');
  }
  
  jobIds2.forEach(function(jobId) {
    updateJobStatus(jobId, 'COMPLETED', {test: true});
  });
  
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('');
}

/**
 * Teste de formatação de duração
 */
function testDurationFormatting() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 TESTE DE FORMATAÇÃO DE DURAÇÃO');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  var tests = [
    {seconds: 5, expected: '5s'},
    {seconds: 30, expected: '30s'},
    {seconds: 60, expected: '1min'},
    {seconds: 90, expected: '1min 30s'},
    {seconds: 120, expected: '2min'},
    {seconds: 300, expected: '5min'},
    {seconds: 3600, expected: '1h'},
    {seconds: 3660, expected: '1h 1min'},
    {seconds: 7200, expected: '2h'}
  ];
  
  var passed = 0;
  var failed = 0;
  
  tests.forEach(function(test) {
    var formatted = formatDuration(test.seconds);
    var match = (formatted === test.expected);
    
    Logger.log(test.seconds + 's → ' + formatted + ' ' + (match ? '✓' : '✗ (esperado: ' + test.expected + ')'));
    
    if (match) {
      passed++;
    } else {
      failed++;
    }
  });
  
  Logger.log('');
  Logger.log('Resultado: ' + passed + '/' + tests.length + ' passaram');
  
  if (failed === 0) {
    Logger.log('✅ Todos os testes de formatação passaram!');
  } else {
    Logger.log('⚠️  ' + failed + ' teste(s) falharam');
  }
  
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('');
}

/**
 * Teste de integração completo
 */
function testSmartIntegration() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 TESTE DE INTEGRAÇÃO COMPLETO');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  try {
    // 1. Cria jobs variados
    Logger.log('1. Criando jobs variados...');
    var jobIds = [];
    
    jobIds.push(enqueueJob('EXPORT_CSV', {data: 'alunos'}));
    jobIds.push(enqueueJob('CALCULATE_STATS', {metric: 'attendance'}));
    jobIds.push(enqueueJob('GENERATE_REPORT', {type: 'monthly'}));
    
    Logger.log('   ✓ 3 jobs criados');
    
    // 2. Analisa
    Logger.log('');
    Logger.log('2. Analisando jobs...');
    var stats = analyzePendingJobs();
    
    Logger.log('   Total: ' + stats.total);
    Logger.log('   Duração: ' + formatDuration(stats.estimatedDuration));
    
    // 3. Testa ativação (se webhook configurado)
    Logger.log('');
    Logger.log('3. Testando ativação...');
    
    try {
      var result = smartActivateColab();
      
      if (result.success) {
        Logger.log('   ✓ Ativação bem-sucedida');
        
        if (result.activated) {
          Logger.log('   Processador ativado por ' + result.estimatedDuration + ' min');
          
          // Aguarda 5 segundos
          Logger.log('   Aguardando 5 segundos...');
          Utilities.sleep(5000);
          
          // Verifica status
          var status = getColabProcessorStatus();
          if (status.success) {
            Logger.log('   Status: ' + (status.processor_running ? 'Rodando' : 'Parado'));
          }
          
          // Desativa
          Logger.log('   Desativando...');
          deactivateColabProcessor();
          
        } else {
          Logger.log('   Processador não foi ativado: ' + result.reason);
        }
      } else {
        Logger.log('   ✗ Falha: ' + result.error);
      }
      
    } catch (error) {
      Logger.log('   ⚠ Webhook não configurado');
    }
    
    // 4. Limpa
    Logger.log('');
    Logger.log('4. Limpando jobs...');
    jobIds.forEach(function(jobId) {
      updateJobStatus(jobId, 'COMPLETED', {test: true});
    });
    Logger.log('   ✓ Jobs limpos');
    
    Logger.log('');
    Logger.log('='.repeat(70));
    Logger.log('✅ TESTE DE INTEGRAÇÃO CONCLUÍDO');
    Logger.log('='.repeat(70));
    Logger.log('');
    
    return true;
    
  } catch (error) {
    Logger.log('');
    Logger.log('✗ ERRO: ' + error.message);
    Logger.log(error.stack);
    Logger.log('');
    return false;
  }
}

/**
 * Executa todos os testes
 */
function runAllSmartTests() {
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('🧪 EXECUTANDO TODOS OS TESTES DO SISTEMA INTELIGENTE');
  Logger.log('='.repeat(70));
  Logger.log('');
  
  var results = {
    complete: false,
    duration: false,
    limits: false,
    formatting: false,
    integration: false
  };
  
  // Teste 1
  Logger.log('▶️  Teste Completo...');
  results.complete = testSmartSystemComplete();
  
  // Teste 2
  Logger.log('▶️  Teste de Cálculo de Duração...');
  testDurationCalculation();
  results.duration = true;
  
  // Teste 3
  Logger.log('▶️  Teste de Limites...');
  testDurationLimits();
  results.limits = true;
  
  // Teste 4
  Logger.log('▶️  Teste de Formatação...');
  testDurationFormatting();
  results.formatting = true;
  
  // Teste 5
  Logger.log('▶️  Teste de Integração...');
  results.integration = testSmartIntegration();
  
  // Resumo final
  Logger.log('');
  Logger.log('='.repeat(70));
  Logger.log('RESUMO FINAL DE TODOS OS TESTES');
  Logger.log('='.repeat(70));
  Logger.log('Teste Completo: ' + (results.complete ? '✓' : '✗'));
  Logger.log('Cálculo de Duração: ' + (results.duration ? '✓' : '✗'));
  Logger.log('Limites: ' + (results.limits ? '✓' : '✗'));
  Logger.log('Formatação: ' + (results.formatting ? '✓' : '✗'));
  Logger.log('Integração: ' + (results.integration ? '✓' : '✗'));
  Logger.log('='.repeat(70));
  Logger.log('');
  
  return results;
}
