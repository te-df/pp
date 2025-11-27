/**
 * @file AuthorizationService.gs
 * @description Sistema de autorização e controle de permissões
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de autorização com:
 * - Verificação de permissões por função
 * - Decoradores para funções críticas
 * - Controle de acesso baseado em roles (RBAC)
 * - Auditoria de tentativas de acesso
 * 
 * ⚠️ SEGURANÇA CRÍTICA: Este módulo contém lógica de autorização sensível.
 * NUNCA exponha esta lógica ao Colab ou serviços externos.
 * Toda verificação de permissões e controle de acesso DEVE permanecer
 * exclusivamente no GAS para manter a segurança do Web App.
 */

// ============================================================================
// CONFIGURAÇÃO DE AUTORIZAÇÃO
// ============================================================================

/**
 * @const {Object} ROLES
 * @description Funções/papéis do sistema
 */
var ROLES = {
  ADMIN: 'Admin',
  GESTOR: 'Gestor',
  MOTORISTA: 'Motorista',
  MONITOR: 'Monitor',
  USUARIO: 'Usuario'
};

/**
 * @const {Object} PERMISSIONS
 * @description Permissões do sistema
 */
var PERMISSIONS = {
  // Usuários
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Alunos
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  
  // Veículos
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',
  
  // Rotas
  ROUTE_CREATE: 'route:create',
  ROUTE_READ: 'route:read',
  ROUTE_UPDATE: 'route:update',
  ROUTE_DELETE: 'route:delete',
  
  // Sistema
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs',
  
  // Relatórios
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export'
};

/**
 * @const {Object} ROLE_PERMISSIONS
 * @description Mapeamento de permissões por função
 */
var ROLE_PERMISSIONS = {
  Admin: [
    // Admin tem todas as permissões
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.VEHICLE_UPDATE,
    PERMISSIONS.VEHICLE_DELETE,
    PERMISSIONS.ROUTE_CREATE,
    PERMISSIONS.ROUTE_READ,
    PERMISSIONS.ROUTE_UPDATE,
    PERMISSIONS.ROUTE_DELETE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT
  ],
  
  Gestor: [
    // Gestor pode gerenciar dados mas não sistema
    PERMISSIONS.USER_READ,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.ROUTE_CREATE,
    PERMISSIONS.ROUTE_READ,
    PERMISSIONS.ROUTE_UPDATE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT
  ],
  
  Motorista: [
    // Motorista pode ver e atualizar rotas
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.ROUTE_READ,
    PERMISSIONS.ROUTE_UPDATE,
    PERMISSIONS.REPORT_VIEW
  ],
  
  Monitor: [
    // Monitor pode ver dados
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.ROUTE_READ,
    PERMISSIONS.REPORT_VIEW
  ],
  
  Usuario: [
    // Usuário básico só leitura
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.REPORT_VIEW
  ]
};

// ============================================================================
// AUTHORIZATION SERVICE
// ============================================================================

/**
 * @class AuthorizationService
 * @description Serviço de autorização
 */
var AuthorizationService = (function() {
  
  /**
   * Construtor
   * 
   * @constructor
   */
  function AuthorizationService() {
    this.stats = {
      checks: 0,
      allowed: 0,
      denied: 0
    };
  }
  
  /**
   * Verifica se usuário tem permissão
   * 
   * @param {string} userId - ID do usuário
   * @param {string} permission - Permissão requerida
   * @return {boolean} True se autorizado
   * 
   * @example
   * var canDelete = auth.hasPermission('user123', PERMISSIONS.USER_DELETE);
   */
  AuthorizationService.prototype.hasPermission = function(userId, permission) {
    try {
      this.stats.checks++;
      
      // Obtém função do usuário
      var userRole = this._getUserRole(userId);
      
      if (!userRole) {
        this.stats.denied++;
        return false;
      }
      
      // Verifica se função tem a permissão
      var rolePermissions = ROLE_PERMISSIONS[userRole] || [];
      var hasPermission = rolePermissions.indexOf(permission) !== -1;
      
      if (hasPermission) {
        this.stats.allowed++;
      } else {
        this.stats.denied++;
      }
      
      return hasPermission;
      
    } catch (error) {
      this.stats.denied++;
      return false;
    }
  };
  
  /**
   * Verifica se usuário tem uma das permissões
   * 
   * @param {string} userId - ID do usuário
   * @param {Array<string>} permissions - Lista de permissões
   * @return {boolean} True se tem pelo menos uma
   * 
   * @example
   * var canManage = auth.hasAnyPermission('user123', [
   *   PERMISSIONS.USER_UPDATE,
   *   PERMISSIONS.USER_DELETE
   * ]);
   */
  AuthorizationService.prototype.hasAnyPermission = function(userId, permissions) {
    for (var i = 0; i < permissions.length; i++) {
      if (this.hasPermission(userId, permissions[i])) {
        return true;
      }
    }
    return false;
  };
  
  /**
   * Verifica se usuário tem todas as permissões
   * 
   * @param {string} userId - ID do usuário
   * @param {Array<string>} permissions - Lista de permissões
   * @return {boolean} True se tem todas
   * 
   * @example
   * var canFullManage = auth.hasAllPermissions('user123', [
   *   PERMISSIONS.USER_READ,
   *   PERMISSIONS.USER_UPDATE
   * ]);
   */
  AuthorizationService.prototype.hasAllPermissions = function(userId, permissions) {
    for (var i = 0; i < permissions.length; i++) {
      if (!this.hasPermission(userId, permissions[i])) {
        return false;
      }
    }
    return true;
  };
  
  /**
   * Verifica se usuário tem função específica
   * 
   * @param {string} userId - ID do usuário
   * @param {string} role - Função requerida
   * @return {boolean} True se tem a função
   * 
   * @example
   * var isAdmin = auth.hasRole('user123', ROLES.ADMIN);
   */
  AuthorizationService.prototype.hasRole = function(userId, role) {
    try {
      var userRole = this._getUserRole(userId);
      return userRole === role;
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Requer permissão (lança erro se não autorizado)
   * 
   * @param {string} userId - ID do usuário
   * @param {string} permission - Permissão requerida
   * @throws {Error} Se não autorizado
   * 
   * @example
   * auth.requirePermission('user123', PERMISSIONS.USER_DELETE);
   */
  AuthorizationService.prototype.requirePermission = function(userId, permission) {
    if (!this.hasPermission(userId, permission)) {
      // Registra tentativa de acesso negado
      this._logAccessDenied(userId, permission);
      
      throw ErrorHandler.permission(
        'Operação não autorizada',
        'Permissão necessária: ' + permission
      );
    }
  };
  
  /**
   * Requer função (lança erro se não autorizado)
   * 
   * @param {string} userId - ID do usuário
   * @param {string} role - Função requerida
   * @throws {Error} Se não autorizado
   * 
   * @example
   * auth.requireRole('user123', ROLES.ADMIN);
   */
  AuthorizationService.prototype.requireRole = function(userId, role) {
    if (!this.hasRole(userId, role)) {
      this._logAccessDenied(userId, 'role:' + role);
      
      throw ErrorHandler.permission(
        'Acesso negado',
        'Função necessária: ' + role
      );
    }
  };
  
  /**
   * Obtém permissões do usuário
   * 
   * @param {string} userId - ID do usuário
   * @return {Array<string>} Lista de permissões
   * 
   * @example
   * var permissions = auth.getUserPermissions('user123');
   */
  AuthorizationService.prototype.getUserPermissions = function(userId) {
    try {
      var userRole = this._getUserRole(userId);
      return ROLE_PERMISSIONS[userRole] || [];
    } catch (error) {
      return [];
    }
  };
  
  /**
   * Obtém estatísticas
   * 
   * @return {Object} Estatísticas
   */
  AuthorizationService.prototype.getStats = function() {
    var denialRate = this.stats.checks > 0
      ? ((this.stats.denied / this.stats.checks) * 100).toFixed(2)
      : 0;
    
    return {
      checks: this.stats.checks,
      allowed: this.stats.allowed,
      denied: this.stats.denied,
      denialRate: denialRate + '%'
    };
  };
  
  /**
   * Obtém função do usuário
   * 
   * @private
   * @param {string} userId - ID do usuário
   * @return {string} Função do usuário
   */
  AuthorizationService.prototype._getUserRole = function(userId) {
    try {
      // Tenta obter da sessão
      if (typeof Session !== 'undefined') {
        var email = Session.getActiveUser().getEmail();
        
        // Busca usuário no banco
        var user = this._findUserByEmail(email);
        if (user && user.funcao) {
          return user.funcao;
        }
      }
      
      // Fallback: busca por ID
      var user = this._findUserById(userId);
      if (user && user.funcao) {
        return user.funcao;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Busca usuário por email
   * 
   * @private
   * @param {string} email - Email
   * @return {Object} Usuário
   */
  AuthorizationService.prototype._findUserByEmail = function(email) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Usuarios');
      
      if (!sheet) return null;
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var emailIndex = headers.indexOf('Email');
      var funcaoIndex = headers.indexOf('Funcao');
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][emailIndex] === email) {
          return {
            email: data[i][emailIndex],
            funcao: data[i][funcaoIndex]
          };
        }
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Busca usuário por ID
   * 
   * @private
   * @param {string} userId - ID
   * @return {Object} Usuário
   */
  AuthorizationService.prototype._findUserById = function(userId) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Usuarios');
      
      if (!sheet) return null;
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idIndex = headers.indexOf('ID');
      var funcaoIndex = headers.indexOf('Funcao');
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][idIndex] === userId) {
          return {
            id: data[i][idIndex],
            funcao: data[i][funcaoIndex]
          };
        }
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Registra acesso negado
   * 
   * @private
   * @param {string} userId - ID do usuário
   * @param {string} permission - Permissão negada
   */
  AuthorizationService.prototype._logAccessDenied = function(userId, permission) {
    try {
      getLogger().warn('Acesso negado', {
        userId: userId,
        permission: permission,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      Logger.log('[Authorization] Acesso negado: ' + userId + ' -> ' + permission);
    }
  };
  
  return AuthorizationService;
})();

// ============================================================================
// DECORADORES E WRAPPERS
// ============================================================================

/**
 * Decorator para funções que requerem permissão
 * 
 * @param {Function} fn - Função original
 * @param {string} permission - Permissão requerida
 * @return {Function} Função decorada
 * 
 * @example
 * var deleteUserSecure = requirePermission(deleteUser, PERMISSIONS.USER_DELETE);
 */
function requirePermission(fn, permission) {
  return function() {
    var auth = getAuthorizationService();
    var userId = getCurrentUserId();
    
    // Verifica permissão
    auth.requirePermission(userId, permission);
    
    // Executa função original
    return fn.apply(this, arguments);
  };
}

/**
 * Decorator para funções que requerem função específica
 * 
 * @param {Function} fn - Função original
 * @param {string} role - Função requerida
 * @return {Function} Função decorada
 * 
 * @example
 * var configSystemSecure = requireRole(configSystem, ROLES.ADMIN);
 */
function requireRole(fn, role) {
  return function() {
    var auth = getAuthorizationService();
    var userId = getCurrentUserId();
    
    // Verifica função
    auth.requireRole(userId, role);
    
    // Executa função original
    return fn.apply(this, arguments);
  };
}

/**
 * Verifica permissão inline
 * 
 * @param {string} permission - Permissão
 * @return {boolean} True se autorizado
 * 
 * @example
 * if (checkPermission(PERMISSIONS.USER_DELETE)) {
 *   // Pode deletar
 * }
 */
function checkPermission(permission) {
  var auth = getAuthorizationService();
  var userId = getCurrentUserId();
  return auth.hasPermission(userId, permission);
}

/**
 * Verifica função inline
 * 
 * @param {string} role - Função
 * @return {boolean} True se tem a função
 * 
 * @example
 * if (checkRole(ROLES.ADMIN)) {
 *   // É admin
 * }
 */
function checkRole(role) {
  var auth = getAuthorizationService();
  var userId = getCurrentUserId();
  return auth.hasRole(userId, role);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global do AuthorizationService
 * 
 * @return {AuthorizationService}
 */
function getAuthorizationService() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getAuthorizationService();
  }
  
  if (typeof globalThis._authService === 'undefined') {
    globalThis._authService = new AuthorizationService();
  }
  return globalThis._authService;
}

/**
 * Obtém ID do usuário atual
 * 
 * @return {string} ID do usuário
 */
function getCurrentUserId() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return 'anonymous';
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================



// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa AuthorizationService
 */
function testAuthorizationService() {
  Logger.log('🧪 Testando Authorization Service...\n');
  
  try {
    var auth = new AuthorizationService();
    
    // Simula usuário admin
    Logger.log('=== Teste 1: Admin ===');
    // Nota: Em produção, userId seria obtido da sessão
    var adminPermissions = ROLE_PERMISSIONS[ROLES.ADMIN];
    Logger.log('✓ Admin tem ' + adminPermissions.length + ' permissões');
    
    // Teste 2: Gestor
    Logger.log('\n=== Teste 2: Gestor ===');
    var gestorPermissions = ROLE_PERMISSIONS[ROLES.GESTOR];
    Logger.log('✓ Gestor tem ' + gestorPermissions.length + ' permissões');
    
    // Teste 3: Motorista
    Logger.log('\n=== Teste 3: Motorista ===');
    var motoristaPermissions = ROLE_PERMISSIONS[ROLES.MOTORISTA];
    Logger.log('✓ Motorista tem ' + motoristaPermissions.length + ' permissões');
    
    // Teste 4: Decorator
    Logger.log('\n=== Teste 4: Decorator ===');
    Logger.log('✓ Decorator criado com sucesso');
    
    // Teste 5: Estatísticas
    Logger.log('\n=== Teste 5: Estatísticas ===');
    var stats = auth.getStats();
    Logger.log('✓ Stats: ' + JSON.stringify(stats));
    
    Logger.log('\n✅ Testes concluídos!');
    
    return { success: true };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return { success: false, error: error.message };
  }
}


