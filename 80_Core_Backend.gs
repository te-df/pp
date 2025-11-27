/**
 * 1_Core_Backend
 * Backend principal, API e serviços core
 * 
 * Consolidado em: 2025-10-21 01:14:28
 * Total de arquivos: 3
 * Total de linhas: 1709
 */

// ============================================================================
// BACKEND SERVICES
// ============================================================================
// NOTA: A função doGet() está em Bootstrap.gs
// Este arquivo contém apenas serviços de backend (APIService, ExportService, etc.)

////////////////////////////////////////////////////////////////////////////////
// ARQUIVO: APIService.gs
////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================================
 * ARQUIVO EXPANDIDO E REFATORADO
 * ============================================================================
 *
 * Este arquivo foi expandido para incluir:
 * - Documentação JSDoc completa
 * - Tratamento de erros robusto
 * - Logging detalhado
 * - Validações de entrada/saída
 * - Funções auxiliares e utilitárias
 * - Métricas e telemetria
 * - Cache e otimizações
 *
 * Versão: 2.0 - Expandida
 * Data: 2025-10-11
 * ============================================================================
 */

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES GLOBAIS
// ============================================================================

// NOTA: Utilitários globais (CustomLogger, InputValidator, SimpleCacheManager, retryOperation)
// estão definidos em UtilsService.gs para evitar duplicação

/**
 * APIService.gs
 * Serviço de API e integrações externas
 * Gerado em: 2025-10-11 12:34:20
 *
 * Consolida: 15_APIService.gs, 11_ExportService.gs, 09_DriveHelper.gs
 */

// ============================================================================
// API SERVICE
// ============================================================================

/**
 * Classe de serviço de API
 */
class APIService {

  constructor() {
    this.baseUrl = ScriptApp.getService().getUrl();
    this.cache = CacheService.getScriptCache();
  }

  /**
   * Processa requisição de API
   */
  handleRequest(endpoint, method, data = null) {
    try {
      try {
        getLogger().info(`API Request: ${method} ${endpoint}`, { endpoint: endpoint, method: method });
      } catch (err) {
        Logger.log(`API Request: ${method} ${endpoint}`);
      }

      // Roteamento de endpoints
      switch(endpoint) {
        case '/api/records':
          return this.handleRecordsEndpoint(method, data);
        case '/api/export':
          return this.handleExportEndpoint(method, data);
        case '/api/import':
          return this.handleImportEndpoint(method, data);
        case '/api/stats':
          return this.handleStatsEndpoint(method, data);
        case '/api/health':
          return this.handleHealthEndpoint(method, data);
        case '/api/mapping':
          return this.handleMappingEndpoint(method, data);
        case '/api/mapping/validate':
          return this.handleMappingValidationEndpoint(method, data);
        
        // Novos endpoints de automação
        case '/api/admin/triggers/setup':
          return this.handleTriggerSetup(method, data);
        case '/api/admin/triggers/list':
          return this.handleTriggerList(method, data);
        case '/api/admin/triggers/remove':
          return this.handleTriggerRemove(method, data);
        case '/api/reports/weekly':
          return this.handleWeeklyReport(method, data);
        case '/api/backup/monthly':
          return this.handleMonthlyBackup(method, data);
        
        // Admin Dashboard Endpoints
        case '/api/admin/archiving/status':
          return this.handleArchivingStatus(method, data);
        case '/api/admin/archiving/cleanup':
          return this.handleManualCleanup(method, data);
        case '/api/admin/archiving/archive':
          return this.handleManualArchive(method, data);
        case '/api/admin/dataset/size':
          return this.handleDatasetSize(method, data);
        case '/api/admin/history':
          return this.handleCleanupHistory(method, data);
          
        default:
          return this.errorResponse('Endpoint não encontrado', 404);
      }
    } catch (error) {
      try {
        getLogger().error('Erro ao processar requisição API', { error: error.message });
      } catch (err) {
        Logger.log('Erro ao processar requisição API: ' + error.toString());
      }
      return this.errorResponse(error.message, 500);
    }
  }

  /**
   * Endpoint de registros
   */
  handleRecordsEndpoint(method, data) {
    const service = new DataService();

    switch(method) {
      case 'GET':
        let result;
        if (data && data.id) {
          result = service.read(data.id);
        } else {
          result = service.read(null, data || {});
        }
        
        // Aplica mascaramento de dados sensíveis (LGPD)
        if (result && typeof DataMaskingService !== 'undefined') {
          if (Array.isArray(result)) {
            result = DataMaskingService.maskArray(result);
          } else if (typeof result === 'object') {
            result = DataMaskingService.maskObject(result);
          }
        }
        
        return this.successResponse(result);

      case 'POST':
        return this.successResponse(service.create(data));

      case 'PUT':
        if (!data || !data.id) {
          return this.errorResponse('ID é obrigatório para atualização', 400);
        }
        return this.successResponse(service.update(data.id, data));

      case 'DELETE':
        if (!data || !data.id) {
          return this.errorResponse('ID é obrigatório para exclusão', 400);
        }
        return this.successResponse(service.delete(data.id));

      default:
        return this.errorResponse('Método não permitido', 405);
    }
  }

 /**
 * Endpoint de exportação (refatorado para usar jobs assíncronos)
 */
 handleExportEndpoint(method, data) {
    if (method !== 'GET' && method !== 'POST') {
      return this.errorResponse('Método não permitido', 405);
 }

    const format = data?.format || 'json';
 const sheetName = data?.sheetName || null;

 // Exportações pesadas (CSV, PDF, Excel) são processadas via job queue
 if (format === 'csv' || format === 'pdf' || format === 'excel') {
      return this.exportCSV_Proxy(sheetName, format);
 }

 // JSON continua síncrono (rápido)
 const exporter = new ExportService();
 return this.successResponse(exporter.exportJSON(sheetName));
 }

 /**
 * Proxy para exportação assíncrona via job queue
 */
 exportCSV_Proxy(sheetName, format = 'csv') {
    try {
      const jobName = format === 'pdf' ? 'EXPORT_PDF' : 
                      format === 'excel' ? 'EXPORT_EXCEL' : 'EXPORT_CSV';
      
      const jobId = enqueueJob(jobName, { 
        sheetName: sheetName,
        format: format
      });
      
      return {
        success: true,
        data: {
          jobId: jobId,
          status: 'PENDING',
          message: `Exportação ${format.toUpperCase()} iniciada. Use o jobId para monitorar o progresso.`
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.errorResponse(`Erro ao iniciar exportação: ${error.toString()}`, 500);
    }
 }

 /**
 * Endpoint de importação
 */
 handleImportEndpoint(method, data) {
    if (method !== 'POST') {
      return this.errorResponse('Método não permitido', 405);
 }

    const format = data?.format || 'json';
 const content = data?.content;
 const sheetName = data?.sheetName || null;

 if (!content) {
      return this.errorResponse('Conteúdo é obrigatório', 400);
 }

 const importer = new ExportService();

 switch(format) {
      case 'json':
 return this.successResponse(importer.importJSON(content, sheetName));
      case 'csv':
 return this.successResponse(importer.importCSV(content, sheetName));
 default:
        return this.errorResponse('Formato não suportado', 400);
 }
 }

 /**
 * Endpoint de estatísticas
 */
 handleStatsEndpoint(method, data) {
    if (method !== 'GET') {
      return this.errorResponse('Método não permitido', 405);
 }

 const service = new DataService();
 return this.successResponse(service.getStats());
 }

 /**
 * Endpoint de health check
 */
 handleHealthEndpoint(method, data) {
    if (method !== 'GET') {
      return this.errorResponse('Método não permitido', 405);
 }

 return this.successResponse({
      status: 'healthy',
 version: CONFIG.VERSION,
 timestamp: new Date().toISOString(),
 uptime: Session.getTemporaryActiveUserKey()
 });
 }

 /**
 * Endpoint de mapeamento de planilhas
 * Retorna o mapeamento completo ou de uma seção específica
 */
 handleMappingEndpoint(method, data) {
    if (method !== 'GET') {
      return this.errorResponse('Método não permitido', 405);
 }

 try {
 // Se foi solicitada uma seção específica
 if (data && data.sectionId) {
 const metadata = getSectionMetadata(data.sectionId);
 if (!metadata) {
          return this.errorResponse(`Seção '${data.sectionId}' não encontrada`, 404);
 }
 return this.successResponse({
 sectionId: data.sectionId,
 metadata: metadata,
 mainSheet: getSectionMainSheet(data.sectionId),
 allSheets: getSectionSheets(data.sectionId)
 });
 }

 // Retorna mapeamento completo
 return this.successResponse({
 sections: getAllSections(),
 totalSections: Object.keys(SHEET_TO_SECTION_MAP).length,
 totalSheets: Object.keys(SHEET_CONFIG).length
 });

 } catch (error) {
 return this.errorResponse(`Erro ao obter mapeamento: ${error.toString()}`, 500);
 }
 }

 /**
 * Endpoint de validação de mapeamento
 * Valida se todas as planilhas estão mapeadas corretamente
 */
 handleMappingValidationEndpoint(method, data) {
    if (method !== 'GET') {
      return this.errorResponse('Método não permitido', 405);
 }

 try {
 const validation = validateSheetMapping();
 return this.successResponse(validation);
 } catch (error) {
 return this.errorResponse(`Erro na validação: ${error.toString()}`, 500);
 }
 }

 /**
 * Resposta de sucesso
 */
 successResponse(data) {
 return {
 success: true,
 data: data,
 timestamp: new Date().toISOString()
 };
 }

 /**
 * Resposta de erro
 */
 errorResponse(message, code = 400) {
 return {
 success: false,
 error: message,
 code: code,
 timestamp: new Date().toISOString()
 };
 }

 /**
 * Endpoint de configuração do sistema
 * ADICIONADO: Intervenção 4
 */
 handleConfigEndpoint(method, data) {
    if (method !== 'GET') {
      return this.errorResponse('Apenas método GET é permitido para /api/config', 405);
    }

    try {
      return this.successResponse({
        appName: CONFIG.APP_NAME,
        version: CONFIG.VERSION,
        environment: CONFIG.ENVIRONMENT,
        sheetNames: CONFIG.SHEET_NAMES,
        features: CONFIG.FEATURES,
        limits: CONFIG.LIMITS
      });
    } catch (error) {
      return this.errorResponse(`Erro ao obter configuração: ${error.toString()}`, 500);
    }
 }

 /**
 * Endpoint para iniciar um job assíncrono
 */
 

 /**
 * Endpoint para consultar status de um job
 */
 

  /**
   * Endpoint de geração de relatórios
   * Inicia um job assíncrono para gerar o relatório solicitado
   */
  handleGenerateReportEndpoint(data) {
    try {
      if (!data) {
        return this.errorResponse('Dados do relatório são obrigatórios', 400);
      }

      // Validação básica
      if (!data.reportType) {
        return this.errorResponse('Tipo de relatório (reportType) é obrigatório', 400);
      }

      const jobId = enqueueJob('GENERATE_REPORT', data);
      
      return this.successResponse({
        jobId: jobId,
        status: 'PENDING',
        message: 'Geração de relatório iniciada com sucesso'
      });
    } catch (error) {
      return this.errorResponse(`Erro ao iniciar relatório: ${error.toString()}`, 500);
    }
  }

  /**
   * Handler para configuração de triggers
   */
  handleTriggerSetup(method, data) {
    if (method !== 'POST') return this.errorResponse('Método não permitido', 405);
    try {
      const result = configurarTriggersAutomaticos();
      return this.successResponse(result);
    } catch (error) {
      return this.errorResponse(`Erro ao configurar triggers: ${error.toString()}`, 500);
    }
  }

  /**
   * Handler para listar triggers
   */
  handleTriggerList(method, data) {
    if (method !== 'GET') return this.errorResponse('Método não permitido', 405);
    try {
      const result = listarTriggersAtivos();
      return this.successResponse(result);
    } catch (error) {
      return this.errorResponse(`Erro ao listar triggers: ${error.toString()}`, 500);
    }
  }

  /**
   * Handler para remover triggers
   */
  handleTriggerRemove(method, data) {
    if (method !== 'POST') return this.errorResponse('Método não permitido', 405);
    try {
      const result = removerTodosOsTriggers();
      return this.successResponse(result);
    } catch (error) {
      return this.errorResponse(`Erro ao remover triggers: ${error.toString()}`, 500);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================



/**
 * Obtém ou cria uma planilha
 */
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    try {
      getLogger().info(`Planilha '${name}' criada`);
    } catch (err) {
      Logger.log(`Planilha '${name}' criada`);
    }
  }
  
  return sheet;
}
