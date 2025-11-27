/**
 * @file Bootstrap.gs
 * @description Ponto de entrada e inicialização do sistema
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo é o ponto de entrada principal do sistema.
 * Contém apenas doGet() e doPost(), delegando toda a lógica
 * para Router.gs e outros serviços especializados.
 * 
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// CONFIGURAÇÃO GLOBAL DO SISTEMA
// ============================================================================

/**
 * @const {Object} BOOTSTRAP_CONFIG
 * @description Configuração de inicialização do sistema
 * @readonly
 */
var BOOTSTRAP_CONFIG = {
  APP_NAME: 'Transporte Escolar DF',
  APP_VERSION: '1.1.0',
  ENVIRONMENT: 'production',
  DEBUG_MODE: false,
  ENABLE_LOGGING: true,
  ENABLE_TELEMETRY: true,
  DEFAULT_TITLE: 'Transporte Escolar DF - Sistema de Gestão',
  ERROR_TITLE: 'Erro - Sistema TE-DF'
};

// ============================================================================
// FUNÇÃO PRINCIPAL - doGet()
// ============================================================================

/**
 * Função principal para servir o aplicativo web (HTTP GET)
 * 
 * Esta é a função obrigatória do Google Apps Script que é chamada
 * automaticamente quando o app é acessado via navegador.
 * 
 * Responsabilidades:
 * - Receber requisições HTTP GET
 * - Delegar roteamento para Router.gs
 * - Servir páginas HTML
 * - Tratar erros globalmente
 * 
 * @param {Object} e - Objeto de evento do Apps Script
 * @param {Object} [e.parameter] - Parâmetros da URL
 * @param {string} [e.parameter.page] - Página a servir
 * @param {string} [e.parameter.file] - Arquivo a servir
 * @param {Object} [e.queryString] - Query string completa
 * @param {Object} [e.pathInfo] - Informações do path
 * @return {HtmlOutput} Página HTML renderizada
 * 
 * @example
 * // Acesso direto: https://script.google.com/macros/s/.../exec
 * // Retorna: index.html
 * 
 * @example
 * // Com parâmetro: https://script.google.com/macros/s/.../exec?page=dashboard
 * // Retorna: página do dashboard
 * 
 * @see Router.route
 * @since 1.0.0
 */
function doGet(e) {
  try {
    // Garante que e existe
    if (!e) {
      e = { parameter: {} };
    }
    
    // Log de inicialização
    _logRequest('GET', e);
    
    // Inicializa sistema se necessário
    _ensureSystemInitialized();
    
    // Delega roteamento para Router
    return Router.route(e);
    
  } catch (error) {
    // Log de erro
    _logError('doGet', error);
    
    // Retorna página de erro
    return _renderErrorPage(error);
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL - doPost()
// ============================================================================

/**
 * Função para processar requisições HTTP POST
 * 
 * Processa requisições POST, geralmente usadas para:
 * - Webhooks
 * - Callbacks de APIs externas
 * - Submissões de formulários externos
 * 
 * @param {Object} e - Objeto de evento do Apps Script
 * @param {Object} [e.parameter] - Parâmetros do POST
 * @param {string} [e.postData] - Dados do corpo da requisição
 * @param {string} [e.postData.contents] - Conteúdo do POST
 * @param {string} [e.postData.type] - Content-Type
 * @return {ContentService.TextOutput|HtmlOutput} Resposta
 * 
 * @example
 * // Webhook externo
 * // POST https://script.google.com/macros/s/.../exec
 * // Body: { "action": "notify", "data": {...} }
 * 
 * @see Router.handlePost
 * @since 1.0.0
 */
function doPost(e) {
  try {
    // Log de inicialização
    _logRequest('POST', e);
    
    // Inicializa sistema se necessário
    _ensureSystemInitialized();
    
    // Delega para Router
    return Router.handlePost(e);
    
  } catch (error) {
    // Log de erro
    _logError('doPost', error);
    
    // Retorna erro JSON
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================================================

/**
 * Garante que o sistema está inicializado
 * 
 * Verifica e inicializa componentes essenciais:
 * - Configurações
 * - Serviços
 * - Cache
 * - Planilhas
 * 
 * FASE 2 - MELHORIAS:
 * - Validação de configuração
 * - Validação de dependências
 * - Diagnóstico de classes
 * 
 * @private
 * @throws {Error} Se inicialização falhar
 * 
 * @since 1.0.0
 */
function _ensureSystemInitialized() {
  try {
    // Verifica se já foi inicializado nesta execução
    if (typeof globalThis._systemInitialized !== 'undefined' && globalThis._systemInitialized) {
      return;
    }
    
    _log('Iniciando sistema...');
    
    // FASE 2 - NOVO: Valida configuração antes de inicializar
    if (typeof ConfigValidator !== 'undefined' && BOOTSTRAP_CONFIG.ENVIRONMENT === 'production') {
      _log('Validando configuração do sistema...');
      
      try {
        var configValidation = ConfigValidator.validateAll(false);
        
        if (!configValidation.valid) {
          _log('⚠️  Configuração com problemas:');
          _log('  - Erros: ' + configValidation.totalErrors);
          _log('  - Avisos: ' + configValidation.totalWarnings);
          
          // Em produção, erros críticos impedem inicialização
          if (configValidation.totalErrors > 0) {
            var criticalErrors = [];
            
            if (configValidation.results.config && configValidation.results.config.errors) {
              configValidation.results.config.errors.forEach(function(err) {
                if (err.severity === 'CRITICAL') {
                  criticalErrors.push(err.field + ': ' + err.message);
                }
              });
            }
            
            if (criticalErrors.length > 0) {
              throw new Error('Configuração inválida (erros críticos): ' + criticalErrors.join('; '));
            }
          }
        } else {
          _log('✅ Configuração válida');
        }
      } catch (validationError) {
        _logError('Validação de configuração', validationError);
        
        // Em produção, falha na validação impede inicialização
        if (BOOTSTRAP_CONFIG.ENVIRONMENT === 'production') {
          throw validationError;
        }
      }
    }
    
    // Usa o novo System.gs para inicialização unificada
    if (typeof System !== 'undefined') {
      System.init();
    } else {
      // Fallback se System.gs não estiver carregado (não deveria acontecer)
      _log('⚠️ System.gs não encontrado. Tentando inicialização manual.');
      if (typeof ServiceManager === 'undefined') {
        throw new Error('ServiceManager não está definido.');
      }
    }
    
    // FASE 2 - NOVO: Valida dependências após inicialização
    if (typeof ServiceManager !== 'undefined' && ServiceManager.validateAllDependencies) {
      _log('Validando dependências...');
      
      try {
        var depsValidation = ServiceManager.validateAllDependencies();
        
        if (depsValidation.invalid > 0) {
          _log('⚠️  Algumas dependências não puderam ser resolvidas: ' + depsValidation.invalid);
        } else {
          _log('✅ Todas as dependências OK');
        }
      } catch (depsError) {
        _logError('Validação de dependências', depsError);
        // Não impede inicialização, apenas loga
      }
    }
    
    // Marca como inicializado
    globalThis._systemInitialized = true;
    
    _log('✅ Sistema inicializado com sucesso');
    
  } catch (error) {
    _logError('_ensureSystemInitialized', error);
    throw new Error('Falha na inicialização do sistema: ' + error.message);
  }
}

// ============================================================================
// FUNÇÕES DE LOGGING
// ============================================================================

/**
 * Registra requisição no log
 * 
 * @private
 * @param {string} method - Método HTTP (GET, POST)
 * @param {Object} e - Objeto de evento
 * 
 * @since 1.0.0
 */
function _logRequest(method, e) {
  if (!BOOTSTRAP_CONFIG.ENABLE_LOGGING) return;
  
  try {
    var params = e && e.parameter ? JSON.stringify(e.parameter) : '{}';
    var message = '[Bootstrap] ' + method + ' request - Params: ' + params;
    
    Logger.log(message);
    
    // Log em serviço se disponível
    if (typeof ServiceManager !== 'undefined') {
      try {
        var logger = ServiceManager.getLoggerService();
        logger.info(message);
      } catch (logError) {
        // Ignora erro de logging
      }
    }
  } catch (error) {
    // Ignora erro de logging
  }
}

/**
 * Registra erro no log
 * 
 * @private
 * @param {string} context - Contexto do erro
 * @param {Error} error - Erro ocorrido
 * 
 * @since 1.0.0
 */
function _logError(context, error) {
  if (!BOOTSTRAP_CONFIG.ENABLE_LOGGING) return;
  
  try {
    var message = '[Bootstrap] ERRO em ' + context + ': ' + error.message;
    Logger.log(message);
    Logger.log(error.stack || 'Stack trace não disponível');
    
    // Log em serviço se disponível
    if (typeof ServiceManager !== 'undefined') {
      try {
        var logger = ServiceManager.getLoggerService();
        logger.error(message);
      } catch (logError) {
        // Ignora erro de logging
      }
    }
  } catch (logError) {
    // Ignora erro de logging
  }
}

/**
 * Registra mensagem informativa
 * 
 * @private
 * @param {string} message - Mensagem a registrar
 * 
 * @since 1.0.0
 */
function _log(message) {
  if (!BOOTSTRAP_CONFIG.ENABLE_LOGGING) return;
  
  try {
    Logger.log('[Bootstrap] ' + message);
  } catch (error) {
    // Ignora erro de logging
  }
}

// ============================================================================
// FUNÇÕES DE RENDERIZAÇÃO
// ============================================================================

/**
 * Renderiza página de erro
 * 
 * @private
 * @param {Error} error - Erro ocorrido
 * @return {HtmlOutput} Página de erro renderizada
 * 
 * @since 1.0.0
 */
function _renderErrorPage(error) {
  try {
    // Tenta usar template de erro
    var template = HtmlService.createTemplateFromFile('error-page');
    template.errorMessage = error.message || 'Erro desconhecido';
    template.errorStack = BOOTSTRAP_CONFIG.DEBUG_MODE ? (error.stack || '') : '';
    template.timestamp = new Date().toISOString();
    template.appName = BOOTSTRAP_CONFIG.APP_NAME;
    template.appVersion = BOOTSTRAP_CONFIG.APP_VERSION;
    
    return template.evaluate()
      .setTitle(BOOTSTRAP_CONFIG.ERROR_TITLE)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (templateError) {
    // Fallback: HTML simples se template falhar
    var html = '<html><head><title>Erro</title></head><body>' +
               '<h1>Erro no Sistema</h1>' +
               '<p>' + (error.message || 'Erro desconhecido') + '</p>' +
               '<p><small>' + new Date().toISOString() + '</small></p>' +
               '</body></html>';
    
    return HtmlService.createHtmlOutput(html)
      .setTitle(BOOTSTRAP_CONFIG.ERROR_TITLE);
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

/**
 * Função include para templates HTML
 * 
 * Permite incluir conteúdo de outros arquivos HTML em templates.
 * Usada com <?!= include('filename') ?> nos templates.
 * 
 * @param {string} filename - Nome do arquivo (sem extensão .html)
 * @return {string} Conteúdo do arquivo
 * 
 * @example
 * // No template HTML:
 * // <?!= include('Stylesheet') ?>
 * // <?!= include('JS-Core') ?>
 * 
 * @since 1.0.0
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    _logError('include', error);
    return '<!-- Erro ao incluir: ' + filename + ' -->';
  }
}

// ============================================================================
// FUNÇÕES DE DIAGNÓSTICO
// ============================================================================

/**
 * Verifica status do sistema
 * 
 * Função de diagnóstico para verificar se todos os componentes
 * essenciais estão disponíveis e funcionando.
 * 
 * @return {Object} Status do sistema
 * @return {boolean} return.initialized - Se sistema está inicializado
 * @return {boolean} return.configOk - Se Config.gs está OK
 * @return {boolean} return.servicesOk - Se ServiceManager está OK
 * @return {boolean} return.routerOk - Se Router está OK
 * @return {Array<string>} return.errors - Lista de erros encontrados
 * 
 * @example
 * var status = checkBootstrapStatus();
 * if (!status.initialized) {
 *   console.log('Erros:', status.errors);
 * }
 * 
 * @since 1.0.0
 */
function checkBootstrapStatus() {
  var status = {
    initialized: false,
    configOk: false,
    servicesOk: false,
    routerOk: false,
    errors: []
  };
  
  try {
    // Verifica Config.gs
    if (typeof CORE_CONFIG !== 'undefined') {
      status.configOk = true;
    } else {
      status.errors.push('CORE_CONFIG não definido');
    }
    
    // Verifica ServiceManager.gs
    if (typeof ServiceManager !== 'undefined') {
      status.servicesOk = true;
    } else {
      status.errors.push('ServiceManager não definido');
    }
    
    // Verifica Router.gs
    if (typeof Router !== 'undefined') {
      status.routerOk = true;
    } else {
      status.errors.push('Router não definido');
    }
    
    // Sistema inicializado se todos os componentes OK
    status.initialized = status.configOk && status.servicesOk && status.routerOk;
    
  } catch (error) {
    status.errors.push('Erro ao verificar status: ' + error.message);
  }
  
  return status;
}

/**
 * Imprime informações do sistema
 * 
 * Função de diagnóstico que imprime informações detalhadas
 * sobre o sistema no log.
 * 
 * @since 1.0.0
 */
function printSystemInfo() {
  Logger.log('='.repeat(60));
  Logger.log('INFORMAÇÕES DO SISTEMA');
  Logger.log('='.repeat(60));
  
  var status = checkBootstrapStatus();
  Logger.log('Status: ' + JSON.stringify(status, null, 2));
  
  Logger.log('='.repeat(60));
}

/**
 * Testa o Bootstrap
 * 
 * Função de teste que simula uma requisição GET
 * para verificar se o bootstrap está funcionando.
 * 
 * @return {Object} Resultado do teste
 * 
 * @since 1.0.0
 */
function testBootstrap() {
  Logger.log('🧪 Testando Bootstrap...\n');
  
  try {
    // Teste 1: Verificar status
    Logger.log('Teste 1: Verificar status');
    var status = checkBootstrapStatus();
    Logger.log('Status inicializado: ' + status.initialized);
    
    if (!status.initialized) {
      Logger.log('❌ Sistema não inicializado');
      Logger.log('Erros: ' + status.errors.join(', '));
      return { success: false, errors: status.errors };
    }
    
    // Teste 2: Simular doGet
    Logger.log('\nTeste 2: Simular doGet()');
    var mockEvent = { parameter: {} };
    var result = doGet(mockEvent);
    Logger.log('doGet retornou: ' + (result ? 'HtmlOutput' : 'null'));
    
    // Teste 3: Verificar include
    Logger.log('\nTeste 3: Testar include()');
    var included = include('index');
    Logger.log('include() funcionou: ' + (included.length > 0));
    
    // FASE 2 - NOVO: Teste 4: Validar configuração
    Logger.log('\nTeste 4: Validar configuração');
    if (typeof ConfigValidator !== 'undefined') {
      var configValidation = ConfigValidator.validateAll(false);
      Logger.log('Configuração válida: ' + configValidation.valid);
      Logger.log('Erros: ' + configValidation.totalErrors);
      Logger.log('Avisos: ' + configValidation.totalWarnings);
    } else {
      Logger.log('⚠️  ConfigValidator não disponível');
    }
    
    // FASE 2 - NOVO: Teste 5: Validar dependências
    Logger.log('\nTeste 5: Validar dependências');
    if (typeof ServiceManager !== 'undefined' && ServiceManager.validateAllDependencies) {
      var depsValidation = ServiceManager.validateAllDependencies();
      Logger.log('Dependências válidas: ' + depsValidation.valid + '/' + depsValidation.total);
      Logger.log('Inválidas: ' + depsValidation.invalid);
    } else {
      Logger.log('⚠️  Validação de dependências não disponível');
    }
    
    Logger.log('\n✅ Testes concluídos com sucesso!');
    
    return {
      success: true,
      status: status,
      includeWorks: included.length > 0,
      configValidation: typeof ConfigValidator !== 'undefined' ? configValidation : null,
      depsValidation: typeof ServiceManager !== 'undefined' ? depsValidation : null
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro nos testes: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * FASE 2 - NOVO: Executa diagnóstico completo do sistema
 * 
 * Executa todos os diagnósticos disponíveis:
 * - Status do Bootstrap
 * - Validação de configuração
 * - Validação de dependências
 * - Disponibilidade de classes
 * - Testes de integração
 * 
 * @return {Object} Resultado completo do diagnóstico
 * 
 * @since 1.1.0
 */
function runCompleteDiagnostics() {
  Logger.log('█'.repeat(80));
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█' + ' '.repeat(20) + 'DIAGNÓSTICO COMPLETO DO SISTEMA' + ' '.repeat(27) + '█');
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█'.repeat(80));
  Logger.log('\n');
  
  var results = {
    timestamp: new Date().toISOString(),
    environment: BOOTSTRAP_CONFIG.ENVIRONMENT,
    version: BOOTSTRAP_CONFIG.APP_VERSION,
    tests: {}
  };
  
  // 1. Status do Bootstrap
  Logger.log('1️⃣  STATUS DO BOOTSTRAP');
  Logger.log('-'.repeat(80));
  results.tests.bootstrap = checkBootstrapStatus();
  Logger.log('Inicializado: ' + results.tests.bootstrap.initialized);
  if (results.tests.bootstrap.errors.length > 0) {
    Logger.log('Erros: ' + results.tests.bootstrap.errors.join(', '));
  }
  Logger.log('\n');
  
  // 2. Validação de Configuração
  Logger.log('2️⃣  VALIDAÇÃO DE CONFIGURAÇÃO');
  Logger.log('-'.repeat(80));
  if (typeof ConfigValidator !== 'undefined') {
    results.tests.config = ConfigValidator.validateAll(false);
    Logger.log('Válida: ' + results.tests.config.valid);
    Logger.log('Erros: ' + results.tests.config.totalErrors);
    Logger.log('Avisos: ' + results.tests.config.totalWarnings);
  } else {
    Logger.log('⚠️  ConfigValidator não disponível');
    results.tests.config = { available: false };
  }
  Logger.log('\n');
  
  // 3. Validação de Dependências
  Logger.log('3️⃣  VALIDAÇÃO DE DEPENDÊNCIAS');
  Logger.log('-'.repeat(80));
  if (typeof ServiceManager !== 'undefined' && ServiceManager.validateAllDependencies) {
    results.tests.dependencies = ServiceManager.validateAllDependencies();
    Logger.log('Válidas: ' + results.tests.dependencies.valid + '/' + results.tests.dependencies.total);
    Logger.log('Inválidas: ' + results.tests.dependencies.invalid);
  } else {
    Logger.log('⚠️  Validação de dependências não disponível');
    results.tests.dependencies = { available: false };
  }
  Logger.log('\n');
  
  // 4. Detecção de Dependências Circulares
  Logger.log('4️⃣  DETECÇÃO DE DEPENDÊNCIAS CIRCULARES');
  Logger.log('-'.repeat(80));
  if (typeof ServiceManager !== 'undefined' && ServiceManager.detectCircularDependencies) {
    results.tests.circular = ServiceManager.detectCircularDependencies();
    if (results.tests.circular.hasCircular) {
      Logger.log('❌ Dependências circulares detectadas: ' + results.tests.circular.circular.length);
    } else {
      Logger.log('✅ Nenhuma dependência circular detectada');
    }
  } else {
    Logger.log('⚠️  Detecção de dependências circulares não disponível');
    results.tests.circular = { available: false };
  }
  Logger.log('\n');
  
  // 5. Disponibilidade de Classes
  Logger.log('5️⃣  DISPONIBILIDADE DE CLASSES');
  Logger.log('-'.repeat(80));
  if (typeof diagnosticarDisponibilidadeClasses === 'function') {
    results.tests.classes = diagnosticarDisponibilidadeClasses();
    Logger.log('Disponíveis: ' + results.tests.classes.available + '/' + results.tests.classes.total);
    Logger.log('Taxa: ' + ((results.tests.classes.available / results.tests.classes.total) * 100).toFixed(1) + '%');
  } else {
    Logger.log('⚠️  Diagnóstico de classes não disponível');
    results.tests.classes = { available: false };
  }
  Logger.log('\n');
  
  // 6. Testes de Integração
  Logger.log('6️⃣  TESTES DE INTEGRAÇÃO');
  Logger.log('-'.repeat(80));
  if (typeof runFullIntegrationTest === 'function') {
    results.tests.integration = runFullIntegrationTest();
    Logger.log('Passou: ' + results.tests.integration.passed + '/' + results.tests.integration.total);
    Logger.log('Taxa: ' + ((results.tests.integration.passed / results.tests.integration.total) * 100).toFixed(1) + '%');
  } else {
    Logger.log('⚠️  Testes de integração não disponíveis');
    results.tests.integration = { available: false };
  }
  Logger.log('\n');
  
  // Resumo Final
  Logger.log('█'.repeat(80));
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█' + ' '.repeat(30) + 'RESUMO FINAL' + ' '.repeat(36) + '█');
  Logger.log('█' + ' '.repeat(78) + '█');
  Logger.log('█'.repeat(80));
  Logger.log('');
  
  var summary = {
    bootstrap: results.tests.bootstrap.initialized ? '✅' : '❌',
    config: results.tests.config.valid ? '✅' : '❌',
    dependencies: results.tests.dependencies.invalid === 0 ? '✅' : '⚠️',
    circular: !results.tests.circular.hasCircular ? '✅' : '❌',
    classes: results.tests.classes.available === results.tests.classes.total ? '✅' : '⚠️',
    integration: results.tests.integration.passed === results.tests.integration.total ? '✅' : '⚠️'
  };
  
  Logger.log('Bootstrap:              ' + summary.bootstrap);
  Logger.log('Configuração:           ' + summary.config);
  Logger.log('Dependências:           ' + summary.dependencies);
  Logger.log('Dependências Circulares:' + summary.circular);
  Logger.log('Classes:                ' + summary.classes);
  Logger.log('Integração:             ' + summary.integration);
  Logger.log('');
  
  var allGreen = Object.values(summary).every(function(v) { return v === '✅'; });
  
  if (allGreen) {
    Logger.log('🎉 SISTEMA 100% OPERACIONAL - Todos os testes passaram!');
  } else {
    Logger.log('⚠️  ATENÇÃO - Alguns testes falharam. Revise os logs acima.');
  }
  
  Logger.log('');
  Logger.log('█'.repeat(80));
  Logger.log('\n');
  
  results.summary = summary;
  results.allGreen = allGreen;
  
  return results;
}
