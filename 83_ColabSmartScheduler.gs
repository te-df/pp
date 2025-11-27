/**
 * @file ColabSmartScheduler.gs
 * @description Sistema inteligente de agendamento do Colab baseado em duração prevista
 * @version 1.0.0
 * 
 * Calcula automaticamente quanto tempo o Colab deve ficar ativo baseado em:
 * - Quantidade de jobs pendentes
 * - Tipo de job (complexidade)
 * - Histórico de processamento
 * - Estimativa de duração
 */

// ============================================================================
// CONFIGURAÇÃO DE DURAÇÕES POR TIPO DE JOB
// ============================================================================

/**
 * Duração média estimada por tipo de job (em segundos)
 * Ajuste estes valores baseado no seu histórico real
 */
var JOB_DURATION_ESTIMATES = {
  // Jobs rápidos (< 30 segundos)
  'CALCULATE_STATS': 10,
  'VALIDATE_DATA': 15,
  'SIMPLE_QUERY': 5,
  
  // Jobs médios (30s - 2min)
  'EXPORT_CSV': 45,
  'GENERATE_REPORT': 60,
  'UPDATE_DASHBOARD': 30,
  
  // Jobs longos (2min - 5min)
  'PROCESS_BATCH': 180,
  'COMPLEX_ANALYSIS': 240,
  'DATA_MIGRATION': 300,
  
  // Jobs muito longos (> 5min)
  'FULL_BACKUP': 600,
  'BULK_IMPORT': 480,
  'AI_PROCESSING': 420,
  
  // Default para jobs desconhecidos
  'DEFAULT': 60
};

/**
 * Overhead adicional por job (tempo de setup, cleanup, etc)
 */
var JOB_OVERHEAD_SECONDS = 5;

/**
 * Buffer de segurança (20% adicional)
 */
var SAFETY_BUFFER_MULTIPLIER = 1.2;

/**
 * Tempo mínimo de execução (em minutos)
 */
var MIN_EXECUTION_MINUTES = 5;

/**
 * Tempo máximo de execução (em minutos)
 */
var MAX_EXECUTION_MINUTES = 60;

// ============================================================================
// ANÁLISE DE JOBS PENDENTES
// ============================================================================

/**
 * Analisa jobs pendentes e retorna estatísticas
 * @returns {Object} Estatísticas dos jobs
 */
function analyzePendingJobs() {
  try {
    var ss = SpreadsheetProvider.getInstance();
    var sheet = ss.getSheetByName('JobQueue');
    
    if (!sheet) {
      return {
        total: 0,
        byType: {},
        estimatedDuration: 0
      };
    }
    
    var data = sheet.getDataRange().getValues();
    var stats = {
      total: 0,
      byType: {},
      estimatedDuration: 0,
      jobs: []
    };
    
    // Analisa cada job (pula cabeçalho)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = row[2]; // Coluna Status
      
      if (status === 'PENDING') {
        var jobType = row[1]; // Coluna Tipo
        var payload = {};
        
        try {
          payload = JSON.parse(row[3] || '{}');
        } catch (e) {
          payload = {};
        }
        
        stats.total++;
        
        // Conta por tipo
        if (!stats.byType[jobType]) {
          stats.byType[jobType] = 0;
        }
        stats.byType[jobType]++;
        
        // Adiciona job à lista
        stats.jobs.push({
          id: row[0],
          type: jobType,
          payload: payload,
          created: row[4]
        });
      }
    }
    
    // Calcula duração estimada total
    stats.estimatedDuration = calculateTotalDuration(stats);
    
    return stats;
    
  } catch (error) {
    Logger.log('Erro ao analisar jobs pendentes: ' + error.message);
    return {
      total: 0,
      byType: {},
      estimatedDuration: 0,
      error: error.message
    };
  }
}

/**
 * Calcula duração total estimada baseado nos jobs
 * @param {Object} stats - Estatísticas dos jobs
 * @returns {number} Duração em segundos
 */
function calculateTotalDuration(stats) {
  var totalSeconds = 0;
  
  // Soma duração de cada tipo de job
  for (var jobType in stats.byType) {
    var count = stats.byType[jobType];
    var durationPerJob = JOB_DURATION_ESTIMATES[jobType] || JOB_DURATION_ESTIMATES.DEFAULT;
    
    // Duração = (tempo do job + overhead) * quantidade
    totalSeconds += (durationPerJob + JOB_OVERHEAD_SECONDS) * count;
  }
  
  // Aplica buffer de segurança
  totalSeconds = Math.ceil(totalSeconds * SAFETY_BUFFER_MULTIPLIER);
  
  return totalSeconds;
}

/**
 * Converte segundos para minutos (arredondado para cima)
 * @param {number} seconds - Segundos
 * @returns {number} Minutos
 */
function secondsToMinutes(seconds) {
  return Math.ceil(seconds / 60);
}

/**
 * Formata duração para exibição
 * @param {number} seconds - Segundos
 * @returns {string} Duração formatada
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return seconds + 's';
  } else if (seconds < 3600) {
    var minutes = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return minutes + 'min' + (secs > 0 ? ' ' + secs + 's' : '');
  } else {
    var hours = Math.floor(seconds / 3600);
    var mins = Math.floor((seconds % 3600) / 60);
    return hours + 'h' + (mins > 0 ? ' ' + mins + 'min' : '');
  }
}

// ============================================================================
// ATIVAÇÃO INTELIGENTE
// ============================================================================

/**
 * Ativa o Colab com duração calculada automaticamente
 * @param {Object} options - Opções adicionais
 * @returns {Object} Resultado da ativação
 */
function smartActivateColab(options) {
  options = options || {};
  
  try {
    Logger.log('');
    Logger.log('='.repeat(60));
    Logger.log('🧠 ATIVAÇÃO INTELIGENTE DO COLAB');
    Logger.log('='.repeat(60));
    Logger.log('');
    
    // Analisa jobs pendentes
    Logger.log('📊 Analisando jobs pendentes...');
    var stats = analyzePendingJobs();
    
    if (stats.total === 0) {
      Logger.log('✓ Nenhum job pendente. Colab não será ativado.');
      return {
        success: true,
        activated: false,
        reason: 'No pending jobs'
      };
    }
    
    Logger.log('');
    Logger.log('📋 Jobs Pendentes:');
    Logger.log('  Total: ' + stats.total);
    Logger.log('');
    Logger.log('  Por tipo:');
    for (var jobType in stats.byType) {
      var count = stats.byType[jobType];
      var duration = JOB_DURATION_ESTIMATES[jobType] || JOB_DURATION_ESTIMATES.DEFAULT;
      Logger.log('    • ' + jobType + ': ' + count + ' (' + formatDuration(duration) + ' cada)');
    }
    
    // Calcula duração
    var estimatedSeconds = stats.estimatedDuration;
    var estimatedMinutes = secondsToMinutes(estimatedSeconds);
    
    // Aplica limites
    var executionMinutes = Math.max(MIN_EXECUTION_MINUTES, 
                                    Math.min(MAX_EXECUTION_MINUTES, estimatedMinutes));
    
    Logger.log('');
    Logger.log('⏱️  Duração Estimada:');
    Logger.log('  Calculada: ' + formatDuration(estimatedSeconds) + ' (' + estimatedMinutes + ' min)');
    Logger.log('  Com limites: ' + executionMinutes + ' min');
    Logger.log('  Buffer: ' + Math.round((SAFETY_BUFFER_MULTIPLIER - 1) * 100) + '%');
    
    // Verifica se processador já está rodando
    Logger.log('');
    Logger.log('🔍 Verificando status do processador...');
    var status = getColabProcessorStatus();
    
    if (status.success && status.processor_running) {
      Logger.log('✓ Processador já está rodando.');
      Logger.log('  Tempo restante será ajustado automaticamente.');
      
      return {
        success: true,
        activated: false,
        reason: 'Processor already running',
        stats: stats,
        estimatedDuration: executionMinutes
      };
    }
    
    // Ativa processador com duração calculada
    Logger.log('');
    Logger.log('🚀 Ativando processador...');
    Logger.log('  Intervalo: 5s');
    Logger.log('  Auto-stop: ' + executionMinutes + ' min');
    Logger.log('  Jobs: ' + stats.total);
    
    var activateResult = activateColabProcessor({
      interval: options.interval || 5,
      auto_stop_minutes: executionMinutes,
      max_iterations: options.max_iterations || null
    });
    
    if (activateResult.success) {
      Logger.log('');
      Logger.log('✅ PROCESSADOR ATIVADO COM SUCESSO!');
      Logger.log('');
      Logger.log('📊 Resumo:');
      Logger.log('  Jobs pendentes: ' + stats.total);
      Logger.log('  Duração estimada: ' + formatDuration(estimatedSeconds));
      Logger.log('  Tempo configurado: ' + executionMinutes + ' min');
      Logger.log('  Desligamento automático: ' + new Date(Date.now() + executionMinutes * 60000).toLocaleTimeString());
      
      // Registra ativação inteligente
      logSmartActivation(stats, executionMinutes);
      
      // Envia notificação
      notifySmartActivation(stats, executionMinutes);
      
      Logger.log('');
      Logger.log('='.repeat(60));
      Logger.log('');
      
      return {
        success: true,
        activated: true,
        stats: stats,
        estimatedDuration: executionMinutes,
        autoStopTime: new Date(Date.now() + executionMinutes * 60000)
      };
      
    } else {
      Logger.log('');
      Logger.log('❌ FALHA AO ATIVAR PROCESSADOR');
      Logger.log('  Erro: ' + activateResult.error);
      Logger.log('');
      Logger.log('='.repeat(60));
      Logger.log('');
      
      return {
        success: false,
        error: activateResult.error,
        stats: stats
      };
    }
    
  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERRO NA ATIVAÇÃO INTELIGENTE');
    Logger.log('  ' + error.message);
    Logger.log('');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ativação automática inteligente (substitui autoActivateColabIfNeeded)
 * Use esta função no trigger ao invés da original
 */
function smartAutoActivateColab() {
  try {
    Logger.log('🔍 Verificação automática inteligente...');
    
    var result = smartActivateColab();
    
    if (result.activated) {
      Logger.log('✓ Colab ativado automaticamente');
      Logger.log('  Jobs: ' + result.stats.total);
      Logger.log('  Duração: ' + result.estimatedDuration + ' min');
    } else if (result.success) {
      Logger.log('✓ Nenhuma ação necessária');
      Logger.log('  Motivo: ' + result.reason);
    } else {
      Logger.log('✗ Falha: ' + result.error);
    }
    
    return result;
    
  } catch (error) {
    Logger.log('✗ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// HISTÓRICO E APRENDIZADO
// ============================================================================

/**
 * Registra ativação inteligente para análise futura
 * @param {Object} stats - Estatísticas dos jobs
 * @param {number} duration - Duração configurada (minutos)
 */
function logSmartActivation(stats, duration) {
  try {
    var ss = SpreadsheetProvider.getInstance();
    var sheet = ss.getSheetByName('ColabSmartLog');
    
    // Cria aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet('ColabSmartLog');
      sheet.appendRow([
        'Timestamp',
        'Total Jobs',
        'Job Types',
        'Estimated Duration (min)',
        'Configured Duration (min)',
        'Auto Stop Time',
        'User'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    sheet.appendRow([
      new Date(),
      stats.total,
      JSON.stringify(stats.byType),
      secondsToMinutes(stats.estimatedDuration),
      duration,
      new Date(Date.now() + duration * 60000),
      Session.getActiveUser().getEmail()
    ]);
    
  } catch (error) {
    Logger.log('⚠ Erro ao registrar ativação: ' + error.message);
  }
}

/**
 * Analisa histórico de ativações para melhorar estimativas
 * @returns {Object} Análise do histórico
 */
function analyzeActivationHistory() {
  try {
    var ss = SpreadsheetProvider.getInstance();
    var sheet = ss.getSheetByName('ColabSmartLog');
    
    if (!sheet) {
      return {
        success: false,
        message: 'Nenhum histórico disponível'
      };
    }
    
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: false,
        message: 'Histórico insuficiente'
      };
    }
    
    var totalActivations = data.length - 1;
    var totalJobs = 0;
    var avgDuration = 0;
    
    for (var i = 1; i < data.length; i++) {
      totalJobs += data[i][1];
      avgDuration += data[i][4];
    }
    
    avgDuration = Math.round(avgDuration / totalActivations);
    
    Logger.log('📊 Análise do Histórico:');
    Logger.log('  Total de ativações: ' + totalActivations);
    Logger.log('  Total de jobs processados: ' + totalJobs);
    Logger.log('  Duração média: ' + avgDuration + ' min');
    Logger.log('  Jobs por ativação: ' + Math.round(totalJobs / totalActivations));
    
    return {
      success: true,
      totalActivations: totalActivations,
      totalJobs: totalJobs,
      avgDuration: avgDuration,
      avgJobsPerActivation: Math.round(totalJobs / totalActivations)
    };
    
  } catch (error) {
    Logger.log('Erro ao analisar histórico: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

/**
 * Envia notificação sobre ativação inteligente
 * @param {Object} stats - Estatísticas dos jobs
 * @param {number} duration - Duração configurada
 */
function notifySmartActivation(stats, duration) {
  // Implementar notificação via email, Slack, etc.
  Logger.log('📧 Notificação: Colab ativado inteligentemente');
  Logger.log('   Jobs: ' + stats.total);
  Logger.log('   Duração: ' + duration + ' min');
}

// ============================================================================
// CONFIGURAÇÃO DO TRIGGER INTELIGENTE
// ============================================================================

/**
 * Configura trigger para usar ativação inteligente
 */
function setupSmartActivationTrigger() {
  try {
    Logger.log('⚙️  Configurando trigger de ativação inteligente...');
    
    // Remove triggers existentes (tanto antigos quanto novos)
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      var func = trigger.getHandlerFunction();
      if (func === 'autoActivateColabIfNeeded' || func === 'smartAutoActivateColab') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('✓ Trigger antigo removido: ' + func);
      }
    });
    
    // Cria novo trigger inteligente (a cada 5 minutos)
    ScriptApp.newTrigger('smartAutoActivateColab')
      .timeBased()
      .everyMinutes(5)
      .create();
    
    Logger.log('✓ Trigger de ativação inteligente configurado!');
    Logger.log('  Função: smartAutoActivateColab');
    Logger.log('  Frequência: A cada 5 minutos');
    Logger.log('  Ação: Calcula duração e ativa Colab automaticamente');
    
    return {
      success: true,
      message: 'Trigger inteligente configurado'
    };
    
  } catch (error) {
    Logger.log('✗ Erro ao configurar trigger: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Setup completo do sistema inteligente
 * @param {string} webhookUrl - URL do webhook do Colab
 */
function setupSmartColabSystem(webhookUrl) {
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('🧠 CONFIGURAÇÃO DO SISTEMA INTELIGENTE');
  Logger.log('='.repeat(60));
  Logger.log('');
  
  // 1. Configura webhook
  Logger.log('1. Configurando webhook...');
  var webhookResult = setupColabWebhook(webhookUrl);
  
  if (!webhookResult.success) {
    Logger.log('✗ Falha ao configurar webhook');
    return { success: false };
  }
  
  // 2. Configura trigger inteligente
  Logger.log('');
  Logger.log('2. Configurando trigger inteligente...');
  var triggerResult = setupSmartActivationTrigger();
  
  // 3. Teste de ativação inteligente
  Logger.log('');
  Logger.log('3. Testando ativação inteligente...');
  
  // Cria job de teste
  var jobId = enqueueJob('CALCULATE_STATS', { test: true });
  Logger.log('  Job de teste criado: ' + jobId);
  
  // Testa ativação
  var testResult = smartActivateColab();
  
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('RESUMO DA CONFIGURAÇÃO');
  Logger.log('='.repeat(60));
  Logger.log('Webhook: ' + (webhookResult.success ? '✓' : '✗'));
  Logger.log('Trigger Inteligente: ' + (triggerResult.success ? '✓' : '✗'));
  Logger.log('Teste: ' + (testResult.success ? '✓' : '✗'));
  Logger.log('='.repeat(60));
  Logger.log('');
  
  if (webhookResult.success && triggerResult.success) {
    Logger.log('✅ SISTEMA INTELIGENTE CONFIGURADO!');
    Logger.log('');
    Logger.log('O Colab agora será ativado automaticamente com duração calculada baseada em:');
    Logger.log('  • Quantidade de jobs pendentes');
    Logger.log('  • Tipo de cada job');
    Logger.log('  • Complexidade estimada');
    Logger.log('  • Buffer de segurança de 20%');
    Logger.log('');
    Logger.log('Limites:');
    Logger.log('  • Mínimo: ' + MIN_EXECUTION_MINUTES + ' min');
    Logger.log('  • Máximo: ' + MAX_EXECUTION_MINUTES + ' min');
    
    return {
      success: true,
      webhook: webhookResult,
      trigger: triggerResult,
      test: testResult
    };
  } else {
    Logger.log('⚠️  Configuração incompleta');
    return {
      success: false,
      webhook: webhookResult,
      trigger: triggerResult
    };
  }
}

/**
 * Diagnóstico do sistema inteligente
 */
function diagnoseSmartSystem() {
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('🔍 DIAGNÓSTICO DO SISTEMA INTELIGENTE');
  Logger.log('='.repeat(60));
  Logger.log('');
  
  // 1. Status básico
  var basicDiag = diagnoseColabAutomation();
  
  // 2. Análise de jobs
  Logger.log('');
  Logger.log('📊 Análise de Jobs Pendentes:');
  Logger.log('-'.repeat(60));
  var stats = analyzePendingJobs();
  
  if (stats.total > 0) {
    Logger.log('  Total: ' + stats.total);
    Logger.log('  Duração estimada: ' + formatDuration(stats.estimatedDuration));
    Logger.log('  Tempo configurado: ' + secondsToMinutes(stats.estimatedDuration) + ' min');
    Logger.log('');
    Logger.log('  Por tipo:');
    for (var jobType in stats.byType) {
      Logger.log('    • ' + jobType + ': ' + stats.byType[jobType]);
    }
  } else {
    Logger.log('  Nenhum job pendente');
  }
  
  // 3. Histórico
  Logger.log('');
  Logger.log('📈 Histórico de Ativações:');
  Logger.log('-'.repeat(60));
  analyzeActivationHistory();
  
  Logger.log('');
  Logger.log('='.repeat(60));
  Logger.log('');
  
  return {
    basic: basicDiag,
    stats: stats
  };
}
