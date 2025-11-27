/**
 * @file ColabProcessorManager.gs
 * @description Gerenciador de ativação/desativação do processador Colab
 * @version 1.0.0
 * 
 * Permite controlar o processador Colab remotamente via webhook
 */

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

/**
 * Obtém a URL do webhook do Colab
 * Configure via PropertiesService ou retorne URL fixa
 */
function getColabWebhookUrl() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('COLAB_WEBHOOK_URL');
  
  if (!url) {
    throw new Error(
      'COLAB_WEBHOOK_URL não configurada! ' +
      'Configure nas Propriedades do Script ou execute setupColabWebhook("URL")'
    );
  }
  
  return url;
}

/**
 * Configura a URL do webhook do Colab
 * @param {string} webhookUrl - URL do ngrok fornecida pelo Colab
 */
function setupColabWebhook(webhookUrl) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('COLAB_WEBHOOK_URL', webhookUrl);
  
  Logger.log('✓ Webhook URL configurada: ' + webhookUrl);
  
  // Testa conexão
  const health = checkColabHealth();
  if (health.success) {
    Logger.log('✓ Conexão com Colab verificada!');
    Logger.log('  Status: ' + health.status);
  } else {
    Logger.log('⚠ Não foi possível conectar ao Colab');
    Logger.log('  Verifique se o servidor está rodando');
  }
  
  return health;
}

// ============================================================================
// CONTROLE DO PROCESSADOR
// ============================================================================

/**
 * Ativa o processador Colab remotamente
 * @param {Object} options - Opções de ativação
 * @param {number} options.interval - Intervalo entre verificações (segundos)
 * @param {number} options.auto_stop_minutes - Auto-stop após X minutos
 * @param {number} options.max_iterations - Máximo de iterações
 * @returns {Object} Resultado da ativação
 */
function activateColabProcessor(options) {
  options = options || {};
  
  try {
    const webhookUrl = getColabWebhookUrl();
    
    const payload = {
      interval: options.interval || 5,
      auto_stop_minutes: options.auto_stop_minutes || 30,
      max_iterations: options.max_iterations || null
    };
    
    Logger.log('🚀 Ativando processador Colab...');
    Logger.log('  URL: ' + webhookUrl);
    Logger.log('  Intervalo: ' + payload.interval + 's');
    Logger.log('  Auto-stop: ' + payload.auto_stop_minutes + ' min');
    
    const response = UrlFetchApp.fetch(webhookUrl + '/activate', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      Logger.log('✓ Processador ativado com sucesso!');
      
      // Registra ativação
      logColabActivity('ACTIVATED', payload);
      
      return {
        success: true,
        message: 'Processador Colab ativado',
        details: result
      };
    } else {
      Logger.log('✗ Falha ao ativar processador: ' + result.message);
      return {
        success: false,
        error: result.message
      };
    }
    
  } catch (error) {
    Logger.log('✗ Erro ao ativar processador: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Desativa o processador Colab remotamente
 * @returns {Object} Resultado da desativação
 */
function deactivateColabProcessor() {
  try {
    const webhookUrl = getColabWebhookUrl();
    
    Logger.log('⏹️  Desativando processador Colab...');
    
    const response = UrlFetchApp.fetch(webhookUrl + '/deactivate', {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      Logger.log('✓ Processador desativado com sucesso!');
      
      // Registra desativação
      logColabActivity('DEACTIVATED', {});
      
      return {
        success: true,
        message: 'Processador Colab desativado'
      };
    } else {
      Logger.log('✗ Falha ao desativar processador: ' + result.message);
      return {
        success: false,
        error: result.message
      };
    }
    
  } catch (error) {
    Logger.log('✗ Erro ao desativar processador: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica o status do processador Colab
 * @returns {Object} Status detalhado
 */
function getColabProcessorStatus() {
  try {
    const webhookUrl = getColabWebhookUrl();
    
    const response = UrlFetchApp.fetch(webhookUrl + '/status', {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      Logger.log('📊 Status do Processador Colab:');
      Logger.log('  Rodando: ' + (result.processor_running ? 'Sim' : 'Não'));
      Logger.log('  Planilha: ' + result.spreadsheet_name);
      Logger.log('  Jobs PENDING: ' + result.job_stats.PENDING);
      Logger.log('  Jobs RUNNING: ' + result.job_stats.RUNNING);
      Logger.log('  Jobs COMPLETED: ' + result.job_stats.COMPLETED);
      Logger.log('  Jobs FAILED: ' + result.job_stats.FAILED);
      
      return result;
    } else {
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    Logger.log('✗ Erro ao obter status: ' + error.message);
    return {
      success: false,
      error: error.message,
      processor_running: false
    };
  }
}

/**
 * Verifica se o servidor Colab está online
 * @returns {Object} Health check
 */
function checkColabHealth() {
  try {
    const webhookUrl = getColabWebhookUrl();
    
    const response = UrlFetchApp.fetch(webhookUrl + '/health', {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    return {
      success: true,
      status: result.status,
      processor_running: result.processor_running,
      timestamp: result.timestamp
    };
    
  } catch (error) {
    return {
      success: false,
      status: 'offline',
      error: error.message
    };
  }
}

// ============================================================================
// ATIVAÇÃO AUTOMÁTICA
// ============================================================================

/**
 * Ativa o processador automaticamente quando há jobs pendentes
 * Pode ser chamado por trigger ou manualmente
 */
function autoActivateColabIfNeeded() {
  try {
    Logger.log('🔍 Verificando necessidade de ativar Colab...');
    
    // Verifica se há jobs pendentes
    const pendingJobs = countPendingJobs();
    
    if (pendingJobs === 0) {
      Logger.log('✓ Nenhum job pendente. Colab não será ativado.');
      return {
        success: true,
        activated: false,
        reason: 'No pending jobs'
      };
    }
    
    Logger.log(`📋 ${pendingJobs} job(s) pendente(s) encontrado(s)`);
    
    // Verifica se o processador já está rodando
    const status = getColabProcessorStatus();
    
    if (status.success && status.processor_running) {
      Logger.log('✓ Processador já está rodando. Nenhuma ação necessária.');
      return {
        success: true,
        activated: false,
        reason: 'Processor already running'
      };
    }
    
    // Ativa o processador
    Logger.log('🚀 Ativando processador Colab...');
    const result = activateColabProcessor({
      interval: 5,
      auto_stop_minutes: 30
    });
    
    if (result.success) {
      Logger.log('✓ Processador ativado automaticamente!');
      
      // Envia notificação (opcional)
      notifyColabActivation(pendingJobs);
      
      return {
        success: true,
        activated: true,
        pending_jobs: pendingJobs
      };
    } else {
      Logger.log('✗ Falha ao ativar processador: ' + result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    Logger.log('✗ Erro na ativação automática: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Conta jobs pendentes na fila
 * @returns {number} Quantidade de jobs pendentes
 */
function countPendingJobs() {
  // Garante inicialização do sistema
  if (typeof System !== 'undefined') System.init();
  
  const ss = SpreadsheetProvider.getInstance();
  const sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
  if (!sheet) return 0;
  
  const data = sheet.getDataRange().getValues();
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === JobStatus.PENDING) {
      count++;
    }
  }
  
  return count;
}

// ============================================================================
// TRIGGER DE ATIVAÇÃO AUTOMÁTICA
// ============================================================================

/**
 * Configura trigger para verificar jobs pendentes a cada 5 minutos
 */
function setupAutoActivationTrigger() {
  try {
    Logger.log('⚙️  Configurando trigger de ativação automática...');
    
    // Remove triggers existentes
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'autoActivateColabIfNeeded') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('✓ Trigger antigo removido');
      }
    });
    
    // Cria novo trigger (a cada 5 minutos)
    ScriptApp.newTrigger('autoActivateColabIfNeeded')
      .timeBased()
      .everyMinutes(5)
      .create();
    
    Logger.log('✓ Trigger de ativação automática configurado!');
    Logger.log('  Função: autoActivateColabIfNeeded');
    Logger.log('  Frequência: A cada 5 minutos');
    Logger.log('  Ação: Verifica jobs pendentes e ativa Colab se necessário');
    
    return {
      success: true,
      message: 'Trigger configurado com sucesso'
    };
    
  } catch (error) {
    Logger.log('✗ Erro ao configurar trigger: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove o trigger de ativação automática
 */
function removeAutoActivationTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let removed = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'autoActivateColabIfNeeded') {
        ScriptApp.deleteTrigger(trigger);
        removed++;
      }
    });
    
    Logger.log(`✓ ${removed} trigger(s) removido(s)`);
    
    return {
      success: true,
      removed: removed
    };
    
  } catch (error) {
    Logger.log('✗ Erro ao remover trigger: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// LOGGING E AUDITORIA
// ============================================================================

/**
 * Registra atividade do Colab para auditoria
 * @param {string} action - Ação realizada (ACTIVATED, DEACTIVATED)
 * @param {Object} details - Detalhes da ação
 */
function logColabActivity(action, details) {
  try {
    // Garante inicialização do sistema
    if (typeof System !== 'undefined') System.init();
    
    const ss = SpreadsheetProvider.getInstance();
    let sheet = ss.getSheetByName('ColabActivityLog');
    
    // Cria aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet('ColabActivityLog');
      sheet.appendRow(['Timestamp', 'Action', 'User', 'Details']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const logSheet = sheet;
    
    logSheet.appendRow([
      new Date().toISOString(),
      action,
      Session.getActiveUser().getEmail(),
      JSON.stringify(details)
    ]);
    
  } catch (error) {
    Logger.log('⚠ Erro ao registrar atividade: ' + error.message);
  }
}

/**
 * Envia notificação sobre ativação do Colab (opcional)
 * @param {number} pendingJobs - Quantidade de jobs pendentes
 */
function notifyColabActivation(pendingJobs) {
  // Implementar notificação via email, Slack, etc.
  // Exemplo básico:
  Logger.log(`📧 Notificação: Colab ativado para processar ${pendingJobs} job(s)`);
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Setup completo do sistema automatizado
 * Execute esta função UMA VEZ após configurar o Colab
 * 
 * @param {string} webhookUrl - URL do ngrok fornecida pelo Colab
 */
function setupColabAutomation(webhookUrl) {
  Logger.log('=' .repeat(60));
  Logger.log('CONFIGURAÇÃO DO SISTEMA AUTOMATIZADO');
  Logger.log('=' .repeat(60));
  
  // 1. Configura webhook
  Logger.log('\n1. Configurando webhook...');
  const webhookResult = setupColabWebhook(webhookUrl);
  
  if (!webhookResult.success) {
    Logger.log('✗ Falha ao configurar webhook. Abortando.');
    return {
      success: false,
      error: 'Webhook configuration failed'
    };
  }
  
  // 2. Configura trigger de ativação automática
  Logger.log('\n2. Configurando trigger de ativação automática...');
  const triggerResult = setupAutoActivationTrigger();
  
  if (!triggerResult.success) {
    Logger.log('⚠ Falha ao configurar trigger, mas webhook está OK');
  }
  
  // 3. Testa ativação
  Logger.log('\n3. Testando ativação...');
  const testResult = activateColabProcessor({
    interval: 5,
    auto_stop_minutes: 5  // Apenas 5 minutos para teste
  });
  
  Logger.log('\n' + '=' .repeat(60));
  Logger.log('RESUMO DA CONFIGURAÇÃO');
  Logger.log('=' .repeat(60));
  Logger.log('Webhook: ' + (webhookResult.success ? '✓ OK' : '✗ FALHOU'));
  Logger.log('Trigger: ' + (triggerResult.success ? '✓ OK' : '⚠ FALHOU'));
  Logger.log('Teste: ' + (testResult.success ? '✓ OK' : '✗ FALHOU'));
  Logger.log('=' .repeat(60));
  
  if (webhookResult.success) {
    Logger.log('\n✓ Sistema automatizado configurado!');
    Logger.log('\nO processador Colab será ativado automaticamente quando:');
    Logger.log('  - Houver jobs pendentes na fila');
    Logger.log('  - A verificação ocorrer (a cada 5 minutos)');
    Logger.log('  - O processador não estiver rodando');
    Logger.log('\nO processador será desativado automaticamente após:');
    Logger.log('  - 30 minutos de execução (padrão)');
    Logger.log('  - 10 verificações consecutivas sem jobs');
    
    return {
      success: true,
      webhook: webhookResult,
      trigger: triggerResult,
      test: testResult
    };
  } else {
    Logger.log('\n✗ Configuração incompleta. Verifique os erros acima.');
    return {
      success: false,
      webhook: webhookResult
    };
  }
}

/**
 * Diagnóstico completo do sistema automatizado
 */
function diagnoseColabAutomation() {
  Logger.log('=' .repeat(60));
  Logger.log('DIAGNÓSTICO DO SISTEMA AUTOMATIZADO');
  Logger.log('=' .repeat(60));
  
  const diagnostics = {
    webhook_configured: false,
    webhook_url: null,
    colab_online: false,
    processor_running: false,
    pending_jobs: 0,
    trigger_configured: false,
    last_activity: null
  };
  
  // 1. Verifica webhook
  Logger.log('\n1. Verificando webhook...');
  try {
    diagnostics.webhook_url = getColabWebhookUrl();
    diagnostics.webhook_configured = true;
    Logger.log('✓ Webhook configurado: ' + diagnostics.webhook_url);
  } catch (error) {
    Logger.log('✗ Webhook não configurado');
  }
  
  // 2. Verifica conexão com Colab
  if (diagnostics.webhook_configured) {
    Logger.log('\n2. Verificando conexão com Colab...');
    const health = checkColabHealth();
    diagnostics.colab_online = health.success;
    
    if (health.success) {
      Logger.log('✓ Colab online');
      diagnostics.processor_running = health.processor_running;
      Logger.log('  Processador: ' + (health.processor_running ? 'Rodando' : 'Parado'));
    } else {
      Logger.log('✗ Colab offline ou inacessível');
    }
  }
  
  // 3. Verifica jobs pendentes
  Logger.log('\n3. Verificando jobs pendentes...');
  diagnostics.pending_jobs = countPendingJobs();
  Logger.log('  Jobs PENDING: ' + diagnostics.pending_jobs);
  
  // 4. Verifica trigger
  Logger.log('\n4. Verificando trigger...');
  const triggers = ScriptApp.getProjectTriggers();
  diagnostics.trigger_configured = triggers.some(t => 
    t.getHandlerFunction() === 'autoActivateColabIfNeeded'
  );
  Logger.log('  Trigger: ' + (diagnostics.trigger_configured ? 'Configurado' : 'Não configurado'));
  
  // Resumo
  Logger.log('\n' + '=' .repeat(60));
  Logger.log('RESUMO');
  Logger.log('=' .repeat(60));
  Logger.log('Webhook: ' + (diagnostics.webhook_configured ? '✓' : '✗'));
  Logger.log('Colab: ' + (diagnostics.colab_online ? '✓ Online' : '✗ Offline'));
  Logger.log('Processador: ' + (diagnostics.processor_running ? '✓ Rodando' : '⏹️  Parado'));
  Logger.log('Jobs Pendentes: ' + diagnostics.pending_jobs);
  Logger.log('Trigger: ' + (diagnostics.trigger_configured ? '✓' : '✗'));
  Logger.log('=' .repeat(60));
  
  return diagnostics;
}
