/**
 * @file Config.gs
 * @description Configuração centralizada do sistema - Constantes e configurações globais
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * 
 * IMPORTANTE: Este arquivo centraliza TODAS as constantes do sistema.
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// NOMES DE PLANILHAS (SHEET_NAMES)
// ============================================================================

/**
 * @const {Object} SHEET_NAMES
 * @description Nomes padronizados para todas as planilhas do sistema
 */
var SHEET_NAMES = SHEET_NAMES || {
  // Planilhas principais
  ALUNOS: 'Alunos',
  ROTAS: 'Rotas',
  VEICULOS: 'Veiculos',
  FREQUENCIA: 'Frequencia',
  PESSOAL: 'Pessoal',
  USUARIOS: 'Usuarios',
  EVENTOS: 'Eventos',
  INCIDENTES: 'Incidentes',
  
  // Planilhas de sistema
  CONFIGURACOES: 'Configuracoes',
  LOGS: 'Logs',
  ERROR_LOGS: 'ERROR_LOGS',
  TELEMETRY: 'Telemetry',
  AUDITORIA: 'Auditoria',
  JOB_QUEUE: 'JobQueue',
  
  // Planilhas de dados
  DASHBOARD: 'Dashboard',
  RELATORIOS: 'Relatorios',
  ENGAGEMENT: 'Engagement',
  TRACKING: 'Tracking',
  WHATSAPP: 'WhatsApp',
  CHATBOT: 'Chatbot',
  
  // Planilhas de gestão
  PROJETOS: 'Projetos',
  KANBAN: 'Kanban',
  AUTOMACOES: 'Automacoes',
  GAMIFICACAO: 'Gamificacao',
  
  // Planilhas de compliance
  COMPLIANCE: 'Compliance',
  ATESTADOS: 'Atestados',
  MANUTENCAO: 'Manutencao',
  FATURAMENTOS: 'Faturamentos',
  UTILIZACAO_FROTA: 'UtilizacaoFrota',
  
  // Planilhas de IA
  AI_REPORTS: 'AIReports',
  MCP_SERVER: 'MCPServer',
  
  // Planilhas de mapa
  MAPA: 'Mapa',
  
  // Planilhas de Autenticação
  SESSIONS: 'Sessoes',
  
  // Aliases para compatibilidade
  USERS: 'Usuarios',
  STAFF: 'Pessoal'
};

// ============================================================================
// CHAVES DE CACHE (CACHE_KEYS)
// ============================================================================

/**
 * @const {Object} CACHE_KEYS
 * @description Chaves padronizadas para o CacheService
 */
var CACHE_KEYS = CACHE_KEYS || {
  SYSTEM_CONFIG: 'system_config',
  USER_PERMISSIONS: 'user_permissions_',  // + email
  ROUTE_DATA: 'route_data_',              // + routeId
  STUDENT_DATA: 'student_data_',          // + studentId
  VEHICLE_DATA: 'vehicle_data_',          // + vehicleId
  DASHBOARD_DATA: 'dashboard_data',
  MENU_DATA: 'menu_data_',                // + userId
  SESSION_DATA: 'session_',               // + sessionId
  AUTH_TOKEN: 'auth_token_',              // + userId
  FORM_DATA: 'form_data_'                 // + formId
};

// ============================================================================
// CHAVES DE PROPRIEDADES (PROPERTY_KEYS)
// ============================================================================

/**
 * @const {Object} PROPERTY_KEYS
 * @description Chaves padronizadas para o PropertiesService
 */
var PROPERTY_KEYS = PROPERTY_KEYS || {
  // Configurações principais
  MAIN_SPREADSHEET_ID: 'MAIN_SPREADSHEET_ID',
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  
  // Pastas do Drive
  BACKUP_FOLDER_ID: 'BACKUP_FOLDER_ID',
  EXPORT_FOLDER_ID: 'EXPORT_FOLDER_ID',
  LOGS_FOLDER_ID: 'LOGS_FOLDER_ID',
  REPORTS_FOLDER_ID: 'REPORTS_FOLDER_ID',
  
  // APIs externas
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GOOGLE_MAPS_API_KEY: 'GOOGLE_MAPS_API_KEY',
  
  // Ambiente e versão
  ENVIRONMENT: 'ENVIRONMENT',
  SYSTEM_VERSION: 'SYSTEM_VERSION',
  
  // Timestamps
  LAST_BACKUP_TIMESTAMP: 'LAST_BACKUP_TIMESTAMP',
  LAST_SYNC_TIMESTAMP: 'LAST_SYNC_TIMESTAMP',
  PRODUCTION_INITIALIZED: 'PRODUCTION_INITIALIZED',
  
  // Configurações de sistema
  LOGGING_ENABLED: 'LOGGING_ENABLED',
  DEBUG_MODE: 'DEBUG_MODE',
  TELEMETRY_ENABLED: 'TELEMETRY_ENABLED',
  
  // Backup
  BACKUP_ENABLED: 'BACKUP_ENABLED',
  BACKUP_FREQUENCY: 'BACKUP_FREQUENCY',
  BACKUP_RETENTION_DAYS: 'BACKUP_RETENTION_DAYS',

  // Autenticação - Tentativas de login
  LOGIN_ATTEMPTS_PREFIX: 'AUTH_ATTEMPTS_',
  LOGIN_LOCK_PREFIX: 'AUTH_LOCK_',
  
  // Autenticação - Cache de usuários
  USER_CACHE_PREFIX: 'CACHE_USER_',
  STAFF_CACHE_PREFIX: 'CACHE_STAFF_',
  CACHE_TTL_MINUTES: 5,
  
  // Autenticação - Última limpeza de sessões
  LAST_SESSION_CLEANUP: 'AUTH_LAST_SESSION_CLEANUP'
};

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE (ENV_CONFIG)
// ============================================================================

/**
 * @const {Object} ENV_CONFIG
 * @description Configurações de ambiente e runtime
 */
var ENV_CONFIG = ENV_CONFIG || {
  SPREADSHEET_ID: null,
  CACHE_DURATION: 300,        // 5 minutos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,          // 1 segundo
  RETRY_INTERVAL: 2000,       // 2 segundos
  DEBUG_MODE: false,
  MAX_EXECUTION_TIME: 270000  // 4.5 minutos (270 segundos)
};

// ============================================================================
// ÍNDICES DE COLUNAS (COLUMN_INDEX)
// ============================================================================

/**
 * @const {Object} COLUMN_INDEX
 * @description Índices de colunas para evitar magic numbers
 */
var COLUMN_INDEX = COLUMN_INDEX || {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
  SIXTH: 6,
  SEVENTH: 7,
  EIGHTH: 8,
  NINTH: 9,
  TENTH: 10,
  FIFTEENTH: 15,
  TWENTIETH: 20
};

// ============================================================================
// CONSTANTES DE TEMPO (TIME_CONSTANTS)
// ============================================================================

/**
 * @const {Object} TIME_CONSTANTS
 * @description Constantes de tempo em milissegundos
 */
var TIME_CONSTANTS = TIME_CONSTANTS || {
  ONE_SECOND: 1000,
  FIVE_SECONDS: 5000,
  TEN_SECONDS: 10000,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  TEN_MINUTES: 600000,
  THIRTY_MINUTES: 1800000,
  ONE_HOUR: 3600000,
  ONE_DAY: 86400000,
  ONE_WEEK: 604800000
};

// ============================================================================
// LIMITES DE DADOS (DATA_LIMITS)
// ============================================================================

/**
 * @const {Object} DATA_LIMITS
 * @description Limites de dados e operações
 */
var DATA_LIMITS = DATA_LIMITS || {
  MAX_BATCH_SIZE: 100,
  MAX_CACHE_SIZE: 50,
  MAX_IMAGE_CACHE: 30,
  MAX_ARCHIVE_FILES: 90,
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_SEARCH_PAGE_SIZE: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_CACHE_STRING_LENGTH: 90000,  // 90KB
  MAX_HISTORY_ENTRIES: 100,
  BYTES_PER_CELL: 100,
  MEGABYTE: 1048576,               // 1024 * 1024
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_SESSIONS_PER_USER: 3
};

// ============================================================================
// PERÍODOS DE RETENÇÃO (RETENTION_DAYS)
// ============================================================================

/**
 * @const {Object} RETENTION_DAYS
 * @description Períodos de retenção de dados em dias
 */
var RETENTION_DAYS = RETENTION_DAYS || {
  LOGS: 30,
  AUDITORIA: 60,
  TELEMETRY: 15,
  ENGAGEMENT: 90,
  TRACKING: 30,
  ERROR_LOGS: 45,
  BACKUPS: 30,
  EXPORTS: 7,
  SESSIONS: 1,
  DEFAULT: 30,
  MAX_BACKUP_AGE_DAYS: 90
};

// ============================================================================
// LIMITES DE TAMANHO (SIZE_LIMITS)
// ============================================================================

/**
 * @const {Object} SIZE_LIMITS
 * @description Limites de tamanho em MB
 */
var SIZE_LIMITS = SIZE_LIMITS || {
  CRITICAL_THRESHOLD: 50,
  WARNING_THRESHOLD: 30,
  MODERATE_THRESHOLD: 20,
  MAX_FILE_SIZE: 10,
  MAX_SPREADSHEET_SIZE: 100
};

// ============================================================================
// DURAÇÕES DE SESSÃO E SEGURANÇA (SECURITY_CONFIG)
// ============================================================================

/**
 * @const {Object} SECURITY_CONFIG
 * @description Configurações de segurança e autenticação
 */
var SECURITY_CONFIG = SECURITY_CONFIG || {
  SESSION_DURATION: 3600000,        // 1 hora
  REFRESH_TOKEN_DURATION: 604800000, // 7 dias
  LOCKOUT_DURATION: 900000,         // 15 minutos
  PASSWORD_SALT_ROUNDS: 10,
  TOKEN_LENGTH: 32,
  CSRF_TOKEN_LENGTH: 64
};

// ============================================================================
// NOMES DE SERVIÇOS (SERVICE_NAMES)
// ============================================================================

/**
 * @const {Object} SERVICE_NAMES
 * @description Nomes padronizados de serviços para logging e telemetria
 */
var SERVICE_NAMES = SERVICE_NAMES || {
  AUTH_SERVICE: 'AuthService',
  DATA_SERVICE: 'DataService',
  API_SERVICE: 'APIService',
  LOGGER_SERVICE: 'LoggerService',
  AUDIT_SERVICE: 'AuditService',
  VALIDATION_SERVICE: 'ValidationService',
  EXPORT_SERVICE: 'ExportService',
  TELEMETRY_SERVICE: 'TelemetryService',
  SCHEMA_SERVICE: 'SchemaService',
  SECURITY_SERVICE: 'SecurityService'
};

// ============================================================================
// VERSÃO DO SISTEMA (SYSTEM_INFO)
// ============================================================================

/**
 * @const {Object} SYSTEM_INFO
 * @description Informações do sistema
 */
var SYSTEM_INFO = SYSTEM_INFO || {
  VERSION: '1.1.0',
  NAME: 'TE-DF-PP',
  FULL_NAME: 'Transporte Escolar DF - Sistema de Gestão',
  ENVIRONMENT: 'production',  // 'development' | 'staging' | 'production'
  BUILD_DATE: '2024-11-22'
};

// ============================================================================
// CONFIGURAÇÃO CORE (CORE_CONFIG)
// ============================================================================

/**
 * @const {Object} CORE_CONFIG
 * @description Configuração core consolidada do sistema
 * Combina todas as configurações principais em um único objeto
 */
var CORE_CONFIG = CORE_CONFIG || {
  sheets: SHEET_NAMES,
  cache: CACHE_KEYS,
  properties: PROPERTY_KEYS,
  env: ENV_CONFIG,
  time: TIME_CONSTANTS,
  limits: DATA_LIMITS,
  retention: RETENTION_DAYS,
  size: SIZE_LIMITS,
  security: SECURITY_CONFIG,
  services: SERVICE_NAMES,
  system: SYSTEM_INFO
};

/**
 * @const {Object} CONFIG
 * @description Alias para CORE_CONFIG (compatibilidade com código legado)
 */
var CONFIG = CONFIG || CORE_CONFIG;

// ============================================================================
// FUNÇÕES AUXILIARES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Obtém uma configuração do CORE_CONFIG
 * @param {string} path - Caminho da configuração (ex: 'sheets.ALUNOS')
 * @return {*} Valor da configuração
 */
function getConfig(path) {
  try {
    // Valida entrada
    if (!path || typeof path !== 'string') {
      Logger.log('[Config] Path inválido: ' + path);
      throw new Error('Path inválido: ' + path);
    }
    
    // Valida CORE_CONFIG
    if (!CORE_CONFIG || typeof CORE_CONFIG !== 'object') {
      Logger.log('[Config] CORE_CONFIG inválido');
      throw new Error('CORE_CONFIG não está definido ou não é um objeto');
    }
    
    var parts = path.split('.');
    var value = CORE_CONFIG;
    
    // Navega pela estrutura
    for (var i = 0; i < parts.length; i++) {
      if (value === null || value === undefined) {
        Logger.log('[Config] Valor null/undefined em ' + parts.slice(0, i).join('.'));
        throw new Error('Valor null/undefined no caminho: ' + parts.slice(0, i).join('.'));
      }
      
      if (typeof value !== 'object') {
        Logger.log('[Config] Valor não é objeto em ' + parts.slice(0, i).join('.'));
        throw new Error('Valor não é objeto no caminho: ' + parts.slice(0, i).join('.'));
      }
      
      value = value[parts[i]];
      
      if (value === undefined) {
        Logger.log('[Config] Configuração não encontrada: ' + path + ' (falhou em: ' + parts[i] + ')');
        throw new Error('Configuração não encontrada: ' + path + ' (falhou em: ' + parts[i] + ')');
      }
    }
    
    return value;
  } catch (error) {
    Logger.log('[Config] Erro ao obter configuração "' + path + '": ' + error.message);
    return null;
  }
}

/**
 * Valida se todas as constantes necessárias estão definidas
 * @return {Object} Resultado da validação
 */
function validateConfig() {
  var result = {
    valid: true,
    missing: [],
    warnings: []
  };
  
  // Verifica SHEET_NAMES
  if (!SHEET_NAMES || Object.keys(SHEET_NAMES).length === 0) {
    result.valid = false;
    result.missing.push('SHEET_NAMES');
  }
  
  // Verifica CACHE_KEYS
  if (!CACHE_KEYS || Object.keys(CACHE_KEYS).length === 0) {
    result.valid = false;
    result.missing.push('CACHE_KEYS');
  }
  
  // Verifica PROPERTY_KEYS
  if (!PROPERTY_KEYS || Object.keys(PROPERTY_KEYS).length === 0) {
    result.valid = false;
    result.missing.push('PROPERTY_KEYS');
  }
  
  // Verifica CORE_CONFIG
  if (!CORE_CONFIG || Object.keys(CORE_CONFIG).length === 0) {
    result.valid = false;
    result.missing.push('CORE_CONFIG');
  }
  
  return result;
}

/**
 * Imprime resumo da configuração (para debug)
 */
function printConfigSummary() {
  Logger.log('='.repeat(60));
  Logger.log('RESUMO DA CONFIGURAÇÃO DO SISTEMA');
  Logger.log('='.repeat(60));
  Logger.log('Sistema: ' + SYSTEM_INFO.FULL_NAME);
  Logger.log('Versão: ' + SYSTEM_INFO.VERSION);
  Logger.log('Ambiente: ' + SYSTEM_INFO.ENVIRONMENT);
  Logger.log('Build: ' + SYSTEM_INFO.BUILD_DATE);
  Logger.log('');
  Logger.log('Planilhas configuradas: ' + Object.keys(SHEET_NAMES).length);
  Logger.log('Chaves de cache: ' + Object.keys(CACHE_KEYS).length);
  Logger.log('Propriedades: ' + Object.keys(PROPERTY_KEYS).length);
  Logger.log('Serviços: ' + Object.keys(SERVICE_NAMES).length);
  Logger.log('='.repeat(60));
}

/**
 * Testa a função getConfig com vários caminhos
 */
function testGetConfig() {
  Logger.log('🧪 Testando getConfig...\n');
  
  // Testa se CORE_CONFIG existe
  Logger.log('1. CORE_CONFIG existe: ' + (typeof CORE_CONFIG !== 'undefined'));
  Logger.log('2. CORE_CONFIG.system existe: ' + (typeof CORE_CONFIG.system !== 'undefined'));
  Logger.log('3. CORE_CONFIG.system.VERSION existe: ' + (typeof CORE_CONFIG.system.VERSION !== 'undefined'));
  Logger.log('4. Valor direto: ' + CORE_CONFIG.system.VERSION);
  
  // Testa getConfig
  Logger.log('\nTestando getConfig:');
  
  var tests = [
    'system.VERSION',
    'system.NAME',
    'system.ENVIRONMENT',
    'sheets.ALUNOS',
    'cache.SYSTEM_CONFIG',
    'limits.MAX_BATCH_SIZE',
    'time.ONE_MINUTE'
  ];
  
  tests.forEach(function(path) {
    var value = getConfig(path);
    Logger.log('  • ' + path + ': ' + value);
  });
  
  Logger.log('\n✅ Teste concluído!');
}
