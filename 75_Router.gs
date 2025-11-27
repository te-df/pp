/**
 * @file Router.gs
 * @description Sistema de roteamento de requisições
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo gerencia o roteamento de todas as requisições HTTP,
 * decidindo qual página servir ou qual ação executar baseado nos
 * parâmetros da URL.
 * 
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// ROUTER - SISTEMA DE ROTEAMENTO
// ============================================================================

/**
 * @namespace Router
 * @description Sistema de roteamento de requisições HTTP
 */
var Router = (function() {
  
  /**
   * @const {Object} ROUTES
   * @description Mapa de rotas disponíveis
   * @private
   */
  var ROUTES = {
    // Páginas principais
    'index': { file: 'index', title: 'Início' },
    'dashboard': { file: 'index', title: 'Dashboard' },
    'home': { file: 'index', title: 'Início' },
    
    // Páginas de erro
    'error': { file: 'error-page', title: 'Erro' },
    '404': { file: 'error-page', title: 'Página Não Encontrada' },
    
    // Arquivos especiais
    'manifest': { file: 'manifest', contentType: 'application/json' },
    'sw': { file: 'sw', contentType: 'application/javascript' },
    
    // Ferramentas
    'diagnostic': { file: 'diagnostic-tool', title: 'Diagnóstico' }
  };
  
  /**
   * @const {string} DEFAULT_ROUTE
   * @description Rota padrão quando nenhuma é especificada
   * @private
   */
  var DEFAULT_ROUTE = 'index';
  
  return {
    /**
     * Roteia requisição GET
     * 
     * Analisa os parâmetros da requisição e decide qual página servir.
     * Suporta múltiplos formatos de parâmetros:
     * - ?page=dashboard
     * - ?file=manifest
     * - ?route=diagnostic
     * 
     * @memberof Router
     * @param {Object} e - Objeto de evento do Apps Script
     * @param {Object} [e.parameter] - Parâmetros da URL
     * @param {string} [e.parameter.page] - Página a servir
     * @param {string} [e.parameter.file] - Arquivo a servir
     * @param {string} [e.parameter.route] - Rota a servir
     * @return {HtmlOutput} Página HTML renderizada
     * 
     * @example
     * // URL: ?page=dashboard
     * Router.route({ parameter: { page: 'dashboard' } });
     * 
     * @example
     * // URL: ?file=manifest
     * Router.route({ parameter: { file: 'manifest' } });
     * 
     * @since 1.0.0
     */
    route: function(e) {
      try {
        // Garante que e existe
        if (!e) {
          e = { parameter: {} };
        }
        
        // Extrai parâmetros
        var params = e.parameter || {};
        
        // Determina rota
        var routeName = params.page || params.file || params.route || DEFAULT_ROUTE;
        
        Logger.log('[Router] Roteando para: ' + routeName);
        
        // Busca configuração da rota
        var routeConfig = ROUTES[routeName];
        
        if (!routeConfig) {
          Logger.log('[Router] Rota não encontrada: ' + routeName);
          return this._render404();
        }
        
        // Renderiza página
        return this._renderPage(routeConfig, params);
        
      } catch (error) {
        Logger.log('[Router] Erro no roteamento: ' + error.message);
        Logger.log('[Router] Stack: ' + error.stack);
        return this._renderError(error);
      }
    },
    
    /**
     * Processa requisição POST
     * 
     * Processa requisições POST, geralmente webhooks ou callbacks.
     * Retorna resposta JSON.
     * 
     * @memberof Router
     * @param {Object} e - Objeto de evento do Apps Script
     * @param {Object} [e.parameter] - Parâmetros do POST
     * @param {Object} [e.postData] - Dados do corpo
     * @return {ContentService.TextOutput} Resposta JSON
     * 
     * @example
     * // POST com JSON
     * Router.handlePost({
     *   postData: {
     *     contents: '{"action":"notify"}',
     *     type: 'application/json'
     *   }
     * });
     * 
     * @since 1.0.0
     */
    handlePost: function(e) {
      try {
        Logger.log('[Router] Processando POST');
        
        // Extrai dados
        var data = {};
        
        if (e.postData) {
          try {
            data = JSON.parse(e.postData.contents);
          } catch (parseError) {
            data = e.parameter || {};
          }
        } else {
          data = e.parameter || {};
        }
        
        Logger.log('[Router] Dados POST: ' + JSON.stringify(data));
        
        // Processa ação
        var action = data.action || 'unknown';
        var result = this._processAction(action, data);
        
        // Retorna JSON
        return ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
        
      } catch (error) {
        Logger.log('[Router] Erro no POST: ' + error.message);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    },
    
    /**
     * Renderiza página
     * 
     * @private
     * @memberof Router
     * @param {Object} routeConfig - Configuração da rota
     * @param {Object} params - Parâmetros da requisição
     * @return {HtmlOutput} Página renderizada
     */
    _renderPage: function(routeConfig, params) {
      try {
        var filename = routeConfig.file;
        var title = routeConfig.title || BOOTSTRAP_CONFIG.DEFAULT_TITLE;
        
        // Cria template
        var template = HtmlService.createTemplateFromFile(filename);
        
        // Passa parâmetros para o template
        template.params = params;
        template.appName = BOOTSTRAP_CONFIG.APP_NAME;
        template.appVersion = BOOTSTRAP_CONFIG.APP_VERSION;
        
        // Avalia template
        var output = template.evaluate();
        
        // Configura output
        output.setTitle(title);
        output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        
        // Content type especial (manifest, sw)
        if (routeConfig.contentType) {
          // Para arquivos especiais, retorna conteúdo direto
          return HtmlService.createHtmlOutput(include(filename))
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        }
        
        return output;
        
      } catch (error) {
        Logger.log('[Router] Erro ao renderizar página: ' + error.message);
        return this._renderError(error);
      }
    },
    
    /**
     * Renderiza página 404
     * 
     * @private
     * @memberof Router
     * @return {HtmlOutput} Página 404
     */
    _render404: function() {
      try {
        var template = HtmlService.createTemplateFromFile('error-page');
        template.errorMessage = 'Página não encontrada (404)';
        template.errorStack = '';
        template.timestamp = new Date().toISOString();
        
        return template.evaluate()
          .setTitle('404 - Página Não Encontrada')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
          
      } catch (error) {
        return this._renderError(error);
      }
    },
    
    /**
     * Renderiza página de erro
     * 
     * @private
     * @memberof Router
     * @param {Error} error - Erro ocorrido
     * @return {HtmlOutput} Página de erro
     */
    _renderError: function(error) {
      try {
        var template = HtmlService.createTemplateFromFile('error-page');
        template.errorMessage = error.message || 'Erro desconhecido';
        template.errorStack = BOOTSTRAP_CONFIG.DEBUG_MODE ? (error.stack || '') : '';
        template.timestamp = new Date().toISOString();
        
        return template.evaluate()
          .setTitle('Erro')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
          
      } catch (templateError) {
        // Fallback HTML simples
        var html = '<html><head><title>Erro</title></head><body>' +
                   '<h1>Erro</h1>' +
                   '<p>' + (error.message || 'Erro desconhecido') + '</p>' +
                   '</body></html>';
        
        return HtmlService.createHtmlOutput(html);
      }
    },
    
    /**
     * Processa ação POST
     * 
     * @private
     * @memberof Router
     * @param {string} action - Ação a processar
     * @param {Object} data - Dados da ação
     * @return {Object} Resultado
     */
    _processAction: function(action, data) {
      Logger.log('[Router] Processando ação: ' + action);
      
      switch (action) {
        case 'ping':
          return { success: true, message: 'pong', timestamp: new Date().toISOString() };
        
        case 'health':
          return this._getHealthStatus();
        
        case 'webhook':
          return this._processWebhook(data);
        
        default:
          return {
            success: false,
            error: 'Ação não reconhecida: ' + action,
            timestamp: new Date().toISOString()
          };
      }
    },
    
    /**
     * Obtém status de saúde do sistema
     * 
     * @private
     * @memberof Router
     * @return {Object} Status de saúde
     */
    _getHealthStatus: function() {
      try {
        var status = checkBootstrapStatus();
        
        return {
          success: true,
          healthy: status.initialized,
          components: {
            config: status.configOk,
            services: status.servicesOk,
            router: status.routerOk
          },
          errors: status.errors,
          timestamp: new Date().toISOString(),
          version: BOOTSTRAP_CONFIG.APP_VERSION
        };
      } catch (error) {
        return {
          success: false,
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    },
    
    /**
     * Processa webhook
     * 
     * @private
     * @memberof Router
     * @param {Object} data - Dados do webhook
     * @return {Object} Resultado
     */
    _processWebhook: function(data) {
      Logger.log('[Router] Processando webhook: ' + JSON.stringify(data));
      
      // Aqui você pode adicionar lógica específica de webhook
      // Por exemplo: notificações, integrações, etc.
      
      return {
        success: true,
        message: 'Webhook recebido',
        data: data,
        timestamp: new Date().toISOString()
      };
    },
    
    /**
     * Adiciona nova rota
     * 
     * Permite adicionar rotas dinamicamente.
     * 
     * @memberof Router
     * @param {string} name - Nome da rota
     * @param {Object} config - Configuração da rota
     * @param {string} config.file - Arquivo HTML
     * @param {string} [config.title] - Título da página
     * @param {string} [config.contentType] - Content type especial
     * 
     * @example
     * Router.addRoute('custom', {
     *   file: 'custom-page',
     *   title: 'Página Customizada'
     * });
     * 
     * @since 1.0.0
     */
    addRoute: function(name, config) {
      ROUTES[name] = config;
      Logger.log('[Router] Rota adicionada: ' + name);
    },
    
    /**
     * Lista todas as rotas disponíveis
     * 
     * @memberof Router
     * @return {Array<string>} Lista de nomes de rotas
     * 
     * @example
     * var routes = Router.listRoutes();
     * console.log('Rotas:', routes.join(', '));
     * 
     * @since 1.0.0
     */
    listRoutes: function() {
      return Object.keys(ROUTES);
    },
    
    /**
     * Obtém configuração de uma rota
     * 
     * @memberof Router
     * @param {string} name - Nome da rota
     * @return {Object|null} Configuração da rota ou null
     * 
     * @since 1.0.0
     */
    getRoute: function(name) {
      return ROUTES[name] || null;
    }
  };
})();

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa o Router
 * 
 * @return {Object} Resultado dos testes
 * 
 * @since 1.0.0
 */
function testRouter() {
  Logger.log('🧪 Testando Router...\n');
  
  try {
    // Teste 1: Listar rotas
    Logger.log('Teste 1: Listar rotas');
    var routes = Router.listRoutes();
    Logger.log('Rotas disponíveis: ' + routes.join(', '));
    
    // Teste 2: Rotear para index
    Logger.log('\nTeste 2: Rotear para index');
    var result = Router.route({ parameter: {} });
    Logger.log('Roteamento funcionou: ' + (result !== null));
    
    // Teste 3: Rotear para rota específica
    Logger.log('\nTeste 3: Rotear para dashboard');
    var result2 = Router.route({ parameter: { page: 'dashboard' } });
    Logger.log('Roteamento funcionou: ' + (result2 !== null));
    
    // Teste 4: Rota não existente (404)
    Logger.log('\nTeste 4: Rota não existente');
    var result3 = Router.route({ parameter: { page: 'nao-existe' } });
    Logger.log('404 funcionou: ' + (result3 !== null));
    
    // Teste 5: POST ping
    Logger.log('\nTeste 5: POST ping');
    var postResult = Router.handlePost({
      postData: {
        contents: '{"action":"ping"}',
        type: 'application/json'
      }
    });
    Logger.log('POST funcionou: ' + (postResult !== null));
    
    Logger.log('\n✅ Testes concluídos com sucesso!');
    
    return {
      success: true,
      routesCount: routes.length,
      testsRun: 5
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
 * Imprime informações do Router
 * 
 * @since 1.0.0
 */

