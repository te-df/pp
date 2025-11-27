/**
 * ============================================================================
 * AUTH CONFIG - Configurações Centralizadas do Sistema de Autenticação
 * ============================================================================
 * Todas as constantes, nomes de planilhas e configurações em um único local
 * para facilitar manutenção e evitar "strings mágicas" no código.
 * ============================================================================
 */

/**
 * Configurações principais de autenticação
 */
const AUTH_CONFIG = Object.freeze({
  // Segurança de senha
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_DIGIT: true,
    REQUIRE_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    
    // Algoritmo de hashing
    HASH_ALGORITHM: 'SHA_256',
    HASH_PREFIX: 'ARGON2ID', // Identificador do esquema
    SALT_LENGTH: 32, // bytes
    ITERATIONS: 1 // SHA-256 nativo, mas preparado para PBKDF2
  },
  
  // Controle de tentativas
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
    RESET_AFTER_SUCCESS: true
  },
  
  // Sessão e tokens
  SESSION: {
    TIMEOUT_HOURS: 8,
    MAX_CONCURRENT_SESSIONS: 3, // Por usuário
    TOKEN_REFRESH_THRESHOLD_MINUTES: 30, // Renovar se < 30min
    CLEANUP_EXPIRED_INTERVAL_HOURS: 24
  },
  
  // Auditoria
  AUDIT: {
    LOG_ALL_ATTEMPTS: true,
    LOG_TOKEN_VALIDATION: false, // Evita poluição de logs
    RETENTION_DAYS: 90
  },
  
  // Primeiro acesso
  FIRST_LOGIN: {
    FORCE_PASSWORD_CHANGE: true,
    SHOW_WELCOME_MESSAGE: true
  }
});

/**
 * Nomes de planilhas (Referência ao Config.gs)
 */
// SHEET_NAMES é definido globalmente em Config.gs

/**
 * Estrutura de colunas - Usuarios
 */
const USER_COLUMNS = Object.freeze({
  ID: 'ID',
  USERNAME: 'Username',
  EMAIL: 'Email',
  PASSWORD_HASH: 'Password_Hash',
  ROLE: 'Role',
  PERMISSIONS: 'Permissions',
  STATUS: 'Status',
  FIRST_ACCESS: 'Primeiro_Acesso',
  LAST_LOGIN: 'Ultimo_Login',
  TOTAL_LOGINS: 'Total_Logins',
  CREATED_AT: 'Criado_Em',
  PASSWORD_CHANGED_AT: 'Senha_Alterada_Em'
});

/**
 * Estrutura de colunas - Pessoal
 */
const STAFF_COLUMNS = Object.freeze({
  ID: 'ID',
  FULL_NAME: 'Nome_Completo',
  CPF: 'CPF',
  FUNCTION: 'Funcao',
  EMAIL: 'Email',
  PASSWORD_HASH: 'Password_Hash',
  STATUS: 'Status',
  ROUTE_ID: 'ID_Rota_Associada',
  FIRST_ACCESS: 'Primeiro_Acesso',
  LAST_LOGIN: 'Ultimo_Login'
});

/**
 * Estrutura de colunas - Logs
 */
const LOG_COLUMNS = Object.freeze({
  ID: 'ID',
  TYPE: 'Tipo',
  USER: 'Usuario',
  ACTION: 'Acao',
  SUCCESS: 'Sucesso',
  DETAILS: 'Detalhes',
  TIMESTAMP: 'Timestamp',
  IP_PROXY: 'IP',
  SESSION_ID: 'Session_ID'
});

/**
 * Estrutura de colunas - Sessoes (nova)
 */
const SESSION_COLUMNS = Object.freeze({
  ID: 'ID',
  USERNAME: 'Username',
  TOKEN_ID: 'Token_ID',
  TOKEN_HASH: 'Token_Hash',
  CREATED_AT: 'Criado_Em',
  EXPIRES_AT: 'Expira_Em',
  LAST_ACTIVITY: 'Ultima_Atividade',
  IP_PROXY: 'IP_Proxy',
  USER_AGENT: 'User_Agent',
  STATUS: 'Status', // 'active', 'expired', 'revoked'
  REVOKED_AT: 'Revogado_Em',
  REVOKED_BY: 'Revogado_Por'
});

/**
 * Ações de auditoria
 */
const AUDIT_ACTIONS = Object.freeze({
  // Login/Logout
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  
  // Senha
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_MIGRATED: 'PASSWORD_MIGRATED',
  
  // Usuários
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  
  // Sessões
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_VALIDATED: 'SESSION_VALIDATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  SESSION_REVOKED_REMOTE: 'SESSION_REVOKED_REMOTE'
});

/**
 * Status de usuário
 */
const USER_STATUS = Object.freeze({
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  LOCKED: 'Bloqueado',
  PENDING: 'Pendente'
});

/**
 * Roles padrão e suas permissões
 */
const DEFAULT_ROLES = Object.freeze({
  ADMIN: {
    name: 'Administrador',
    permissions: ['*'],
    description: 'Acesso total ao sistema'
  },
  MANAGER: {
    name: 'Gestor',
    permissions: [
      'dashboard:read',
      'usuarios:read', 'usuarios:write',
      'relatorios:read', 'relatorios:export',
      'eventos:read', 'eventos:write',
      'configuracoes:read'
    ],
    description: 'Gestão completa exceto configurações críticas'
  },
  MONITOR: {
    name: 'Monitor',
    permissions: [
      'dashboard:read',
      'frequencia:read', 'frequencia:write',
      'incidentes:read', 'incidentes:create',
      'alunos:read'
    ],
    description: 'Monitores de transporte escolar'
  },
  DRIVER: {
    name: 'Motorista',
    permissions: [
      'frequencia:read', 'frequencia:write',
      'incidentes:read', 'incidentes:create',
      'tracking:view',
      'rotas:read'
    ],
    description: 'Motoristas de veículos'
  },
  SECRETARY: {
    name: 'Secretário',
    permissions: [
      'dashboard:read',
      'eventos:read', 'eventos:write',
      'reposicao:write',
      'relatorios:read',
      'alunos:read'
    ],
    description: 'Secretaria escolar'
  },
  VIEWER: {
    name: 'Visualizador',
    permissions: ['dashboard:read'],
    description: 'Apenas visualização do dashboard'
  }
});

/**
 * Chaves de PropertiesService (Referência ao Config.gs)
 */
// PROPERTY_KEYS é definido globalmente em Config.gs

/**
 * Mensagens de erro padronizadas
 */
const ERROR_MESSAGES = Object.freeze({
  // Autenticação
  INVALID_CREDENTIALS: 'Usuário ou senha incorretos',
  ACCOUNT_LOCKED: 'Conta bloqueada por múltiplas tentativas falhas',
  ACCOUNT_INACTIVE: 'Conta inativa. Contate o administrador',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente',
  SESSION_INVALID: 'Sessão inválida',
  TOKEN_REVOKED: 'Token revogado',
  
  // Senha
  PASSWORD_TOO_SHORT: 'Senha deve ter no mínimo {min} caracteres',
  PASSWORD_TOO_LONG: 'Senha deve ter no máximo {max} caracteres',
  PASSWORD_WEAK: 'Senha fraca. Use letras maiúsculas, minúsculas, números e símbolos',
  PASSWORD_CURRENT_INCORRECT: 'Senha atual incorreta',
  PASSWORD_SAME_AS_OLD: 'Nova senha não pode ser igual à anterior',
  
  // Usuários
  USER_NOT_FOUND: 'Usuário não encontrado',
  USER_ALREADY_EXISTS: 'Usuário já existe',
  USER_MISSING_FIELDS: 'Preencha todos os campos obrigatórios',
  
  // Sistema
  SYSTEM_ERROR: 'Erro no sistema. Tente novamente',
  OPERATION_NOT_ALLOWED: 'Operação não permitida'
});

/**
 * Mensagens de sucesso padronizadas
 */
const SUCCESS_MESSAGES = Object.freeze({
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  PASSWORD_CHANGED: 'Senha alterada com sucesso',
  USER_CREATED: 'Usuário criado com sucesso',
  USER_UPDATED: 'Usuário atualizado com sucesso',
  SESSION_REVOKED: 'Sessão revogada com sucesso'
});

/**
 * Regex patterns para validação
 */
const VALIDATION_PATTERNS = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  PHONE: /^\(\d{2}\)\s?\d{4,5}-\d{4}$/,
  USERNAME: /^[a-zA-Z0-9._-]{3,50}$/,
  
  // Validações de senha
  HAS_UPPERCASE: /[A-Z]/,
  HAS_LOWERCASE: /[a-z]/,
  HAS_DIGIT: /[0-9]/,
  HAS_SPECIAL: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/
});

/**
 * Retorna configuração formatada com variáveis substituídas
 * @param {string} message - Mensagem template
 * @param {Object} vars - Variáveis para substituição
 * @return {string}
 */
function formatMessage(message, vars) {
  if (!vars) return message;
  
  let formatted = message;
  Object.keys(vars).forEach(function(key) {
    formatted = formatted.replace('{' + key + '}', vars[key]);
  });
  
  return formatted;
}

/**
 * Valida se o ambiente é Google Apps Script
 * @return {boolean}
 */
function isGoogleAppsScriptEnvironment() {
  try {
    return typeof SpreadsheetApp !== 'undefined' && 
           typeof PropertiesService !== 'undefined';
  } catch (e) {
    return false;
  }
}

/**
 * Obtém configuração específica
 * @param {string} path - Caminho da configuração (ex: 'PASSWORD.MIN_LENGTH')
 * @return {*}
 */
function getAuthConfigValue(path) {
  // Valida entrada
  if (!path || typeof path !== 'string') {
    Logger.log('[AuthConfig] Path inválido: ' + path);
    return null;
  }
  
  // Valida AUTH_CONFIG
  if (!AUTH_CONFIG || typeof AUTH_CONFIG !== 'object') {
    Logger.log('[AuthConfig] AUTH_CONFIG não está definido');
    return null;
  }
  
  const parts = path.split('.');
  let config = AUTH_CONFIG;
  
  for (let i = 0; i < parts.length; i++) {
    if (config === null || config === undefined) {
      Logger.log('[AuthConfig] Valor null/undefined no caminho: ' + parts.slice(0, i).join('.'));
      return null;
    }
    
    config = config[parts[i]];
    if (config === undefined) {
      Logger.log('[AuthConfig] Configuração não encontrada: ' + path + ' (falhou em: ' + parts[i] + ')');
      return null;
    }
  }
  
  return config;
}

/**
 * Exporta configuração para uso externo
 */
function getAuthConfig() {
  return {
    AUTH_CONFIG: AUTH_CONFIG,
    SHEET_NAMES: SHEET_NAMES,
    USER_COLUMNS: USER_COLUMNS,
    STAFF_COLUMNS: STAFF_COLUMNS,
    LOG_COLUMNS: LOG_COLUMNS,
    SESSION_COLUMNS: SESSION_COLUMNS,
    AUDIT_ACTIONS: AUDIT_ACTIONS,
    USER_STATUS: USER_STATUS,
    DEFAULT_ROLES: DEFAULT_ROLES,
    PROPERTY_KEYS: PROPERTY_KEYS,
    ERROR_MESSAGES: ERROR_MESSAGES,
    SUCCESS_MESSAGES: SUCCESS_MESSAGES,
    VALIDATION_PATTERNS: VALIDATION_PATTERNS
  };
}
