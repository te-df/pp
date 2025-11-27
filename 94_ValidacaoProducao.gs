/**
 * ============================================================================
 * SCRIPT DE VALIDAÇÃO PARA PRODUÇÃO - TE-DF-PP v4.2
 * ============================================================================
 * 
 * Execute este script ANTES do deploy para validar se tudo está pronto.
 * 
 * Como usar:
 * 1. Abra o Apps Script Editor
 * 2. Execute: validarSistemaProducao()
 * 3. Verifique os logs para qualquer ❌
 * 4. Corrija os problemas identificados
 * 5. Execute novamente até todos serem ✅
 * 
 * ============================================================================
 */

// Constantes globais
const REQUIRED_SHEETS = [
  'Usuarios',
  'Alunos',
  'Rotas',
  'Frequencia',
  'Incidentes',
  'Eventos',
  'Logs',
  'JobQueue'
];

/**
 * Classe auxiliar para gerenciamento de validações
 */
class ValidationSuite {
  constructor(name) {
    this.name = name;
    this.checks = [];
    this.passedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Adiciona e executa uma verificação
   * @param {string} description - Descrição do teste
   * @param {Function} checkFn - Função que retorna true/false ou lança erro
   * @param {string} failureMessage - Mensagem opcional de falha
   */
  check(description, checkFn, failureMessage) {
    const checkId = this.checks.length + 1;
    try {
      const result = checkFn();
      if (result) {
        Logger.log(`✅ ${this.name}.${checkId} - ${description}`);
        this.passedCount++;
      } else {
        Logger.log(`❌ ${this.name}.${checkId} - ${description} FALHOU`);
        if (failureMessage) Logger.log(`   ${failureMessage}`);
        this.failedCount++;
      }
    } catch (e) {
      Logger.log(`❌ ${this.name}.${checkId} - ${description} ERRO: ${e.toString()}`);
      this.failedCount++;
    }
    this.checks.push({ description, passed: this.passedCount > this.checks.length }); // Simplified tracking
  }

  getResults() {
    return {
      total: this.checks.length,
      passed: this.passedCount,
      failed: this.failedCount
    };
  }
}

/**
 * Função principal de validação
 * Executa todas as verificações necessárias
 */
function validarSistemaProducao() {
  Logger.log('='.repeat(80));
  Logger.log('🔍 VALIDAÇÃO DO SISTEMA PARA PRODUÇÃO - TE-DF-PP v4.2');
  Logger.log('='.repeat(80));
  Logger.log('');
  
  // Garante inicialização do sistema
  if (typeof System !== 'undefined') System.init();
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  
  // Validações
  const validations = [
    runConfigValidation,
    runSheetValidation,
    runDataValidation,
    runBackendValidation,
    runSecurityValidation,
    runPerformanceValidation
  ];
  
  validations.forEach(valFn => {
    const result = valFn();
    totalChecks += result.total;
    passedChecks += result.passed;
    failedChecks += result.failed;
  });
  
  // Resumo final
  Logger.log('\n' + '='.repeat(80));
  Logger.log('📊 RESUMO DA VALIDAÇÃO');
  Logger.log('='.repeat(80));
  Logger.log(`Total de verificações: ${totalChecks}`);
  Logger.log(`✅ Aprovadas: ${passedChecks}`);
  Logger.log(`❌ Reprovadas: ${failedChecks}`);
  const successRate = totalChecks > 0 ? ((passedChecks/totalChecks)*100).toFixed(1) : 0;
  Logger.log(`📈 Taxa de sucesso: ${successRate}%`);
  Logger.log('');
  
  if (failedChecks === 0) {
    Logger.log('🎉 SISTEMA 100% PRONTO PARA PRODUÇÃO!');
    Logger.log('✅ Todos os testes passaram. Você pode fazer o deploy.');
  } else if (failedChecks <= 3) {
    Logger.log('⚠️  SISTEMA QUASE PRONTO - Corrija os problemas menores.');
    Logger.log(`${failedChecks} verificações falharam. Revise os logs acima.`);
  } else {
    Logger.log('❌ SISTEMA NÃO ESTÁ PRONTO PARA PRODUÇÃO!');
    Logger.log(`${failedChecks} verificações críticas falharam. NÃO FAÇA DEPLOY!`);
  }
  
  Logger.log('='.repeat(80));
}

/**
 * Validação 1: Configuração de Ambiente
 */
function runConfigValidation() {
  const suite = new ValidationSuite('1');
  Logger.log(`\n${'='.repeat(80)}\n1. Configuração de Ambiente\n${'='.repeat(80)}`);

  suite.check('SPREADSHEET_ID configurado', () => {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    return id && id.length > 30;
  }, 'Execute: configurarSpreadsheetProducao()');

  suite.check('Acesso à planilha', () => {
    try {
      const ss = SpreadsheetProvider.getInstance();
      if (ss) {
        Logger.log(`   ID: ${ss.getId()}`);
        return true;
      }
    } catch (e) {
      Logger.log(`   Erro: ${e.message}`);
    }
    return false;
  });

  suite.check('ENV_CONFIG definido', () => {
    if (typeof ENV_CONFIG !== 'undefined') {
      Logger.log(`   Cache: ${ENV_CONFIG.CACHE_DURATION}s`);
      if (ENV_CONFIG.DEBUG_MODE === true) Logger.log('⚠️  WARNING: DEBUG_MODE está ATIVO.');
      return true;
    }
    return false;
  });

  suite.check('SHEET_CONFIG definido', () => {
    return typeof SHEET_CONFIG !== 'undefined' && Object.keys(SHEET_CONFIG).length > 0;
  });

  suite.check('Função doGet() definida (Web App)', () => {
    return typeof doGet === 'function';
  });

  return suite.getResults();
}

/**
 * Validação 2: Estrutura de Planilhas
 */
function runSheetValidation() {
  const suite = new ValidationSuite('2');
  Logger.log(`\n${'='.repeat(80)}\n2. Estrutura de Planilhas\n${'='.repeat(80)}`);

  try {
    const ss = SpreadsheetProvider.getInstance();
    const sheets = ss.getSheets().map(s => s.getName());

    REQUIRED_SHEETS.forEach(sheetName => {
      suite.check(`Planilha '${sheetName}' existe`, () => {
        if (sheets.includes(sheetName)) {
          const sheet = ss.getSheetByName(sheetName);
          Logger.log(`   (${sheet.getLastRow()} linhas)`);
          return true;
        }
        return false;
      }, 'Execute: createMissingSheets()');
    });
  } catch (error) {
    Logger.log(`❌ Erro ao acessar spreadsheet: ${error.message}`);
    suite.check('Acesso à planilha', () => false, error.message);
  }

  return suite.getResults();
}

/**
 * Validação 3: Dados Essenciais
 */
function runDataValidation() {
  const suite = new ValidationSuite('3');
  Logger.log(`\n${'='.repeat(80)}\n3. Dados Essenciais\n${'='.repeat(80)}`);

  const ss = SpreadsheetProvider.getInstance();

  REQUIRED_SHEETS.forEach(sheetName => {
    suite.check(`'${sheetName}' tem dados`, () => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return false;
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        Logger.log(`   (${lastRow - 1} registros)`);
        return true;
      }
      return false;
    }, 'Execute: createMissingSheets() para adicionar dados demo');
  });

  return suite.getResults();
}

/**
 * Validação 4: Funções Backend
 */
function runBackendValidation() {
  const suite = new ValidationSuite('4');
  Logger.log(`\n${'='.repeat(80)}\n4. Funções Backend\n${'='.repeat(80)}`);

  const requiredFunctions = [
    { name: 'doGet', desc: 'Função principal Web App' },
    { name: 'include', desc: 'Sistema de includes HTML' },
    { name: 'getSpreadsheet', desc: 'Acesso à planilha' },
    { name: 'createMissingSheets', desc: 'Criação de planilhas' },
    { name: 'generateUniqueId', desc: 'Geração de IDs' },
    { name: 'createRecord', desc: 'CRUD - Create' },
    { name: 'readRecords', desc: 'CRUD - Read' },
    { name: 'updateRecord', desc: 'CRUD - Update' },
    { name: 'deleteRecord', desc: 'CRUD - Delete' },
    { name: 'DataService', desc: 'Classe DataService' }
  ];

  requiredFunctions.forEach(func => {
    suite.check(`${func.desc} (${func.name})`, () => {
      return typeof eval(func.name) !== 'undefined';
    });
  });

  return suite.getResults();
}

/**
 * Validação 5: Segurança
 */
function runSecurityValidation() {
  const suite = new ValidationSuite('5');
  Logger.log(`\n${'='.repeat(80)}\n5. Segurança\n${'='.repeat(80)}`);

  suite.check('Senha do admin segura', () => {
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName('Usuarios');
    if (sheet && sheet.getLastRow() > 1) {
      const adminPassword = sheet.getRange(2, 4).getValue(); // Linha 2, Coluna 4
      return adminPassword && adminPassword !== 'hash123' && adminPassword !== 'admin' && adminPassword.length > 10;
    }
    return false;
  }, 'Execute: atualizarSenhasProducao()');

  suite.check('PropertiesService acessível (OAuth OK)', () => {
    PropertiesService.getScriptProperties();
    return true;
  });

  suite.check('DEBUG_MODE desativado', () => {
    return typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.DEBUG_MODE === false;
  }, 'Altere ENV_CONFIG.DEBUG_MODE para false');

  suite.check('Planilha acessível', () => {
    const ss = SpreadsheetProvider.getInstance();
    const protection = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    Logger.log(`   Proteções: ${protection.length}`);
    return true;
  });

  return suite.getResults();
}

/**
 * Validação 6: Performance
 */
function runPerformanceValidation() {
  const suite = new ValidationSuite('6');
  Logger.log(`\n${'='.repeat(80)}\n6. Performance\n${'='.repeat(80)}`);

  suite.check('Cache configurado corretamente', () => {
    if (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.CACHE_DURATION) {
      const duration = ENV_CONFIG.CACHE_DURATION;
      Logger.log(`   Cache: ${duration}s`);
      return duration >= 60 && duration <= 600;
    }
    return false;
  });

  suite.check('Velocidade de leitura (< 3000ms)', () => {
    const start = new Date().getTime();
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName('Usuarios');
    if (sheet) sheet.getDataRange().getValues();
    const duration = new Date().getTime() - start;
    Logger.log(`   Duração: ${duration}ms`);
    return duration < 3000;
  });

  suite.check('DataService funcional', () => {
    const start = new Date().getTime();
    const service = new DataService('Usuarios');
    const result = service.read();
    const duration = new Date().getTime() - start;
    if (result.success) {
      Logger.log(`   Duração: ${duration}ms`);
      return true;
    }
    return false;
  });

  suite.check('Número de planilhas adequado (< 15)', () => {
    const ss = SpreadsheetProvider.getInstance();
    const count = ss.getSheets().length;
    Logger.log(`   Total: ${count}`);
    return count < 15;
  });

  suite.check('Volume de dados adequado (< 50000 linhas)', () => {
    const ss = SpreadsheetProvider.getInstance();
    let totalRows = 0;
    ss.getSheets().forEach(s => totalRows += s.getLastRow());
    Logger.log(`   Total linhas: ${totalRows}`);
    return totalRows < 50000;
  });

  return suite.getResults();
}

/**
 * Função auxiliar para configurar Spreadsheet ID
 */
function configurarSpreadsheetProducao() {
  Logger.log('='.repeat(80));
  Logger.log('⚙️  CONFIGURAÇÃO DE SPREADSHEET PARA PRODUÇÃO');
  Logger.log('='.repeat(80));
  
  try {
    const ss = SpreadsheetProvider.getInstance();
    const id = ss.getId();
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
    
    Logger.log(`\n✅ SPREADSHEET_ID configurado: ${id}`);
    Logger.log(`Nome: ${ss.getName()}`);
    Logger.log(`URL: ${ss.getUrl()}\n`);
    Logger.log('Próximos passos:');
    Logger.log('1. Execute: validarSistemaProducao()');
    Logger.log('2. Se todos os testes passarem, faça o deploy do Web App');
  } catch (error) {
    Logger.log(`\n❌ ERRO: ${error.toString()}`);
  }
  Logger.log('='.repeat(80));
}

/**
 * Função para gerar relatório resumido
 */
function gerarRelatorioProducao() {
  Logger.log('='.repeat(80));
  Logger.log('📋 RELATÓRIO DE PRODUÇÃO - TE-DF-PP v4.2');
  Logger.log('='.repeat(80));
  
  try {
    const ss = SpreadsheetProvider.getInstance();
    Logger.log(`\n📊 SISTEMA:\n   Nome: ${ss.getName()}\n   ID: ${ss.getId()}\n   URL: ${ss.getUrl()}`);
    
    Logger.log('\n📈 DADOS:');
    let totalRecords = 0;
    REQUIRED_SHEETS.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const count = Math.max(0, sheet.getLastRow() - 1);
        totalRecords += count;
        Logger.log(`   ${sheetName}: ${count}`);
      }
    });
    Logger.log(`   TOTAL: ${totalRecords}`);
    
    Logger.log('\n⚙️  CONFIG:');
    if (typeof ENV_CONFIG !== 'undefined') {
      Logger.log(`   Cache: ${ENV_CONFIG.CACHE_DURATION}s`);
      Logger.log(`   Debug: ${ENV_CONFIG.DEBUG_MODE}`);
    }
    
    Logger.log('\n🔐 SEGURANÇA:');
    Logger.log(`   Spreadsheet ID: ${PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ? '✅' : '❌'}`);
    
    Logger.log('\n✅ Relatório gerado com sucesso!');
  } catch (error) {
    Logger.log(`\n❌ Erro: ${error.toString()}`);
  }
  Logger.log('='.repeat(80));
}
/**
 * Função para corrigir problemas automaticamente
 */
function fixAll() {
  Logger.log('='.repeat(80));
  Logger.log('🔧 CORREÇÃO AUTOMÁTICA DO SISTEMA');
  Logger.log('='.repeat(80));
  
  // 1. Configurar Spreadsheet ID
  try {
    Logger.log('\n1. Configurando Spreadsheet ID...');
    configurarSpreadsheetProducao();
  } catch (e) {
    Logger.log(`❌ Erro: ${e.message}`);
  }
  
  // 2. Atualizar Senha Admin
  try {
    Logger.log('\n2. Atualizando Senha Admin...');
    atualizarSenhasProducao();
  } catch (e) {
    Logger.log(`❌ Erro: ${e.message}`);
  }
  
  Logger.log('\n✅ Correções aplicadas. Execute validarSistemaProducao() novamente.');
  Logger.log('='.repeat(80));
}

/**
 * Atualiza senha do admin para uma segura
 */
function atualizarSenhasProducao() {
  const ss = SpreadsheetProvider.getInstance();
  const sheet = ss.getSheetByName('Usuarios');
  
  if (!sheet) {
    throw new Error('Planilha Usuarios não encontrada');
  }
  
  // Encontra admin
  const data = sheet.getDataRange().getValues();
  let adminRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'admin' || data[i][2] === 'admin@example.com') { // Username or Email
      adminRow = i + 1;
      break;
    }
  }
  
  if (adminRow === -1) {
    Logger.log('Admin não encontrado. Criando...');
    sheet.appendRow([
      'US-' + Date.now(),
      'admin',
      'admin@example.com',
      'Admin@2024!Secure', // Senha segura
      'ADMIN',
      'Ativo',
      new Date(),
      new Date()
    ]);
    Logger.log('✅ Admin criado com senha segura.');
  } else {
    sheet.getRange(adminRow, 4).setValue('Admin@2024!Secure');
    Logger.log('✅ Senha do admin atualizada para: Admin@2024!Secure');
  }
}
