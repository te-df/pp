/**
 * QUICK START - Script de Inicialização Rápida
 * 
 * Execute estas funções na ordem para configurar o sistema de jobs
 */

/**
 * PASSO 1: Inicializar Sistema de Jobs
 * Execute esta função UMA VEZ para criar a planilha JobQueue
 */
function quickStart_Step1_InitializeJobQueue() {
  try {
    Logger.log('='.repeat(60));
    Logger.log('PASSO 1: Inicializando JobQueue');
    Logger.log('='.repeat(60));
    
    // Verifica se a aba JobQueue já existe
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('JobQueue');
    
    if (!sheet) {
      // Cria a aba JobQueue
      sheet = ss.insertSheet('JobQueue');
      sheet.getRange(1, 1, 1, 11).setValues([[
        'ID', 'Job_Name', 'Status', 'Payload', 'Timestamp_Enqueued',
        'User_Email', 'Timestamp_Claimed', 'Timestamp_Completed',
        'Result', 'Error_Code', 'Error_Message'
      ]]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
      sheet.setFrozenRows(1);
      Logger.log('✓ Aba JobQueue criada');
    } else {
      Logger.log('✓ Aba JobQueue já existe');
    }
    
    Logger.log('✓ Planilha JobQueue inicializada com sucesso!');
    Logger.log('');
    Logger.log('Próximo passo: Execute quickStart_Step2_CreateTestJob()');
    Logger.log('='.repeat(60));
    
    return {
      success: true,
      message: 'JobQueue inicializada com sucesso'
    };
  } catch (error) {
    Logger.log('✗ Erro ao inicializar JobQueue: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * PASSO 2: Criar Job de Teste
 * Execute esta função para criar um job de teste
 */
function quickStart_Step2_CreateTestJob() {
  try {
    Logger.log('='.repeat(60));
    Logger.log('PASSO 2: Criando Job de Teste');
    Logger.log('='.repeat(60));
    
    // Usa a função global enqueueJob
    const jobId = enqueueJob('CALCULATE_STATS', {
      sheetName: 'JobQueue'
    });
    
    Logger.log('✓ Job de teste criado!');
    Logger.log('  Job ID: ' + jobId);
    Logger.log('  Tipo: CALCULATE_STATS');
    Logger.log('  Status: PENDING');
    Logger.log('');
    Logger.log('Próximo passo: Configure o Google Colab');
    Logger.log('  1. Acesse: https://colab.research.google.com/');
    Logger.log('  2. Copie o código de colab_main_processor.py');
    Logger.log('  3. Substitua SPREADSHEET_ID pelo ID desta planilha');
    Logger.log('  4. Execute as células na ordem');
    Logger.log('');
    Logger.log('ID desta planilha: ' + SpreadsheetApp.getActiveSpreadsheet().getId());
    Logger.log('='.repeat(60));
    
    return {
      success: true,
      jobId: jobId,
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
    };
  } catch (error) {
    Logger.log('✗ Erro ao criar job de teste: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * PASSO 3: Verificar Status do Job de Teste
 * Execute esta função após o Colab processar o job
 */
function quickStart_Step3_CheckTestJob() {
  try {
    Logger.log('='.repeat(60));
    Logger.log('PASSO 3: Verificando Jobs');
    Logger.log('='.repeat(60));
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('JobQueue');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('Total de jobs: ' + (data.length - 1));
    Logger.log('');
    
    for (let i = 1; i < data.length; i++) {
      const job = {
        jobId: data[i][0],
        jobName: data[i][1],
        status: data[i][2],
        timestamp: data[i][5]
      };
      
      Logger.log('Job ' + i + ':');
      Logger.log('  ID: ' + job.jobId);
      Logger.log('  Tipo: ' + job.jobName);
      Logger.log('  Status: ' + job.status);
      Logger.log('  Criado em: ' + job.timestamp);
      Logger.log('');
    }
    
    const pendingJobs = data.filter((row, i) => i > 0 && row[2] === 'PENDING').length;
    const runningJobs = data.filter((row, i) => i > 0 && row[2] === 'RUNNING').length;
    const completedJobs = data.filter((row, i) => i > 0 && row[2] === 'COMPLETED').length;
    const failedJobs = data.filter((row, i) => i > 0 && row[2] === 'FAILED').length;
    
    Logger.log('Resumo:');
    Logger.log('  PENDING: ' + pendingJobs);
    Logger.log('  RUNNING: ' + runningJobs);
    Logger.log('  COMPLETED: ' + completedJobs);
    Logger.log('  FAILED: ' + failedJobs);
    Logger.log('');
    
    if (completedJobs > 0) {
      Logger.log('✓ Sistema funcionando corretamente!');
      Logger.log('');
      Logger.log('Próximo passo: Teste no frontend');
      Logger.log('  1. Abra a aplicação web');
      Logger.log('  2. Abra o console (F12)');
      Logger.log('  3. Execute: JobHelpers.exportCSV("JobQueue")');
    } else if (pendingJobs > 0) {
      Logger.log('⚠ Jobs ainda pendentes. Verifique se o Colab está rodando.');
    } else {
      Logger.log('ℹ Nenhum job encontrado. Execute quickStart_Step2_CreateTestJob()');
    }
    
    Logger.log('='.repeat(60));
    
    return {
      success: true,
      summary: {
        total: data.length - 1,
        pending: pendingJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs
      }
    };
  } catch (error) {
    Logger.log('✗ Erro ao verificar jobs: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * PASSO 4: Configurar Trigger de Limpeza Automática
 * Execute esta função para configurar limpeza diária de jobs antigos
 */
function quickStart_Step4_SetupDailyCleanup() {
  try {
    Logger.log('='.repeat(60));
    Logger.log('PASSO 4: Configurando Limpeza Automática');
    Logger.log('='.repeat(60));
    
    // Remove triggers existentes para evitar duplicação
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'dailyJobCleanup') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('✓ Trigger antigo removido');
      }
    });
    
    // Cria novo trigger
    ScriptApp.newTrigger('dailyJobCleanup')
      .timeBased()
      .atHour(2) // 2h da manhã
      .everyDays(1)
      .create();
    
    Logger.log('✓ Trigger de limpeza diária configurado!');
    Logger.log('  Função: dailyJobCleanup');
    Logger.log('  Horário: 02:00 - 03:00');
    Logger.log('  Frequência: Diária');
    Logger.log('  Ação: Remove jobs com mais de 7 dias');
    Logger.log('');
    Logger.log('✓ Configuração completa!');
    Logger.log('='.repeat(60));
    
    return {
      success: true,
      message: 'Trigger configurado com sucesso'
    };
  } catch (error) {
    Logger.log('✗ Erro ao configurar trigger: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * FUNÇÃO COMPLETA: Executa todos os passos de uma vez
 * Execute esta função para configurar tudo automaticamente
 */
function quickStart_CompleteSetup() {
  Logger.log('\n\n');
  Logger.log('#'.repeat(60));
  Logger.log('# QUICK START - CONFIGURAÇÃO COMPLETA');
  Logger.log('#'.repeat(60));
  Logger.log('\n');
  
  // Passo 1
  const step1 = quickStart_Step1_InitializeJobQueue();
  if (!step1.success) {
    Logger.log('\n✗ Configuração falhou no Passo 1');
    return step1;
  }
  
  Utilities.sleep(1000);
  
  // Passo 2
  const step2 = quickStart_Step2_CreateTestJob();
  if (!step2.success) {
    Logger.log('\n✗ Configuração falhou no Passo 2');
    return step2;
  }
  
  Utilities.sleep(1000);
  
  // Passo 4
  const step4 = quickStart_Step4_SetupDailyCleanup();
  if (!step4.success) {
    Logger.log('\n✗ Configuração falhou no Passo 4');
    return step4;
  }
  
  Logger.log('\n\n');
  Logger.log('#'.repeat(60));
  Logger.log('# ✓ CONFIGURAÇÃO COMPLETA!');
  Logger.log('#'.repeat(60));
  Logger.log('\n');
  Logger.log('Próximos passos:');
  Logger.log('  1. Configure o Google Colab (veja IMPLEMENTACAO_JOBS_COLAB.txt)');
  Logger.log('  2. Execute quickStart_Step3_CheckTestJob() após o Colab processar');
  Logger.log('  3. Teste no frontend com JobHelpers.exportCSV("JobQueue")');
  Logger.log('\n');
  Logger.log('ID da planilha: ' + step2.spreadsheetId);
  Logger.log('Job de teste: ' + step2.jobId);
  Logger.log('\n');
  
  return {
    success: true,
    spreadsheetId: step2.spreadsheetId,
    testJobId: step2.jobId
  };
}

/**
 * FUNÇÃO DE DIAGNÓSTICO: Verifica o estado do sistema
 */
function quickStart_Diagnostics() {
  Logger.log('='.repeat(60));
  Logger.log('DIAGNÓSTICO DO SISTEMA');
  Logger.log('='.repeat(60));
  
  const diagnostics = {
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    jobQueueExists: false,
    totalJobs: 0,
    pendingJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    triggersConfigured: false,
    servicesAvailable: {
      enqueueJob: typeof enqueueJob !== 'undefined',
      checkJobStatus: typeof checkJobStatus !== 'undefined'
    }
  };
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('JobQueue');
    if (sheet) {
      diagnostics.jobQueueExists = true;
      const data = sheet.getDataRange().getValues();
      diagnostics.totalJobs = data.length - 1;
      
      for (let i = 1; i < data.length; i++) {
        const status = data[i][2];
        if (status === 'PENDING') diagnostics.pendingJobs++;
        if (status === 'RUNNING') diagnostics.runningJobs++;
        if (status === 'COMPLETED') diagnostics.completedJobs++;
        if (status === 'FAILED') diagnostics.failedJobs++;
      }
    }
  } catch (error) {
    Logger.log('Erro ao verificar JobQueue: ' + error.toString());
  }
  
  try {
    const triggers = ScriptApp.getProjectTriggers();
    diagnostics.triggersConfigured = triggers.some(t => t.getHandlerFunction() === 'dailyJobCleanup');
  } catch (error) {
    Logger.log('Erro ao verificar triggers: ' + error.toString());
  }
  
  Logger.log('\nInformações da Planilha:');
  Logger.log('  ID: ' + diagnostics.spreadsheetId);
  Logger.log('  Nome: ' + diagnostics.spreadsheetName);
  Logger.log('\nJobQueue:');
  Logger.log('  Existe: ' + (diagnostics.jobQueueExists ? 'Sim' : 'Não'));
  Logger.log('  Total de Jobs: ' + diagnostics.totalJobs);
  Logger.log('  Pendentes: ' + diagnostics.pendingJobs);
  Logger.log('  Em Execução: ' + diagnostics.runningJobs);
  Logger.log('  Concluídos: ' + diagnostics.completedJobs);
  Logger.log('  Falhos: ' + diagnostics.failedJobs);
  Logger.log('\nServiços:');
  Logger.log('  enqueueJob: ' + (diagnostics.servicesAvailable.enqueueJob ? 'OK' : 'ERRO'));
  Logger.log('  checkJobStatus: ' + (diagnostics.servicesAvailable.checkJobStatus ? 'OK' : 'ERRO'));
  Logger.log('\nTriggers:');
  Logger.log('  Limpeza Diária: ' + (diagnostics.triggersConfigured ? 'Configurado' : 'Não Configurado'));
  Logger.log('\n' + '='.repeat(60));
  
  return diagnostics;
}
