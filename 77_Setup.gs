/**
 * @file Setup.gs
 * @description Script de configuração inicial do sistema
 */

/**
 * Inicializa as propriedades de segurança do script
 * Execute esta função UMA VEZ para configurar os segredos
 */
function setupSecurityProperties() {
  const props = PropertiesService.getScriptProperties();
  
  // Segredos de Autenticação
  // NOTA: Em produção, altere estes valores para strings aleatórias longas
  const secrets = {
    'AUTH_TOKEN_SECRET': 'TE-DF-SECURE-2025-CHANGE-THIS-IN-PROD',
    'AUTH_LEGACY_SALT': 'TE-DF-PP-v4.2'
  };
  
  props.setProperties(secrets);
  
  console.log('✅ Propriedades de segurança configuradas com sucesso.');
  console.log('Valores configurados:', Object.keys(secrets));
}

/**
 * Verifica se as propriedades estão configuradas
 */
function checkSecuritySetup() {
  const props = PropertiesService.getScriptProperties();
  const tokenSecret = props.getProperty('AUTH_TOKEN_SECRET');
  const legacySalt = props.getProperty('AUTH_LEGACY_SALT');
  
  if (tokenSecret && legacySalt) {
    console.log('✅ Configuração de segurança verificada: OK');
    return true;
  } else {
    console.error('❌ Configuração de segurança incompleta!');
    if (!tokenSecret) console.error('- Faltando: AUTH_TOKEN_SECRET');
    if (!legacySalt) console.error('- Faltando: AUTH_LEGACY_SALT');
    return false;
  }
}

/**
 * Inicializa a infraestrutura de jobs assíncronos
 * Cria a aba JobQueue e configura o sistema
 */
function setupJobQueue() {
  try {
    console.log('🚀 Iniciando setup da Job Queue...');
    
    // Cria a aba JobQueue
    const sheet = createJobQueueSheet();
    
    if (sheet) {
      console.log('✅ Job Queue configurada com sucesso!');
      console.log('Aba criada:', sheet.getName());
      console.log('Colunas:', sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
      return true;
    } else {
      console.error('❌ Erro ao criar Job Queue');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no setup da Job Queue:', error);
    return false;
  }
}

/**
 * Setup completo do sistema
 * Executa todas as configurações necessárias
 */
function setupComplete() {
  console.log('=' .repeat(60));
  console.log('SETUP COMPLETO DO SISTEMA');
  console.log('=' .repeat(60));
  
  // 1. Configuração de segurança
  console.log('\n1. Configurando segurança...');
  setupSecurityProperties();
  
  // 2. Verificação de segurança
  console.log('\n2. Verificando segurança...');
  const securityOk = checkSecuritySetup();
  
  // 3. Configuração da Job Queue
  console.log('\n3. Configurando Job Queue...');
  const jobQueueOk = setupJobQueue();
  
  // Resumo
  console.log('\n' + '=' .repeat(60));
  console.log('RESUMO DO SETUP');
  console.log('=' .repeat(60));
  console.log('Segurança:', securityOk ? '✅ OK' : '❌ FALHOU');
  console.log('Job Queue:', jobQueueOk ? '✅ OK' : '❌ FALHOU');
  console.log('=' .repeat(60));
  
  if (securityOk && jobQueueOk) {
    console.log('\n✅ Setup completo realizado com sucesso!');
    console.log('\nPróximos passos:');
    console.log('1. Configure o Colab com o SPREADSHEET_ID');
    console.log('2. Execute run_job_processor() no Colab');
    console.log('3. Teste com um job de exportação');
    return true;
  } else {
    console.log('\n❌ Setup incompleto. Verifique os erros acima.');
    return false;
  }
}
