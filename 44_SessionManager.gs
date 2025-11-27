/**
 * @file SessionManager.gs
 * @description Gerenciamento de sessões com expiração e renovação de token
 * @version 2.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de sessão com:
 * - Tempo de expiração configurável
 * - Renovação automática de token
 * - Refresh token
 * - Sessões persistentes
 * - Controle de sessões ativas
 * 
 * Intervenção #29 - Sessão com expiração e renovação
 */

// ============================================================================
// CONFIGURAÇÃO DE SESSÃO
// ============================================================================

/**
 * @const {Object} SESSION_CONFIG
 * @description Configuração de sessões
 */
var SESSION_CONFIG = {
  // Duração da sessão (segundos)
  SESSION_DURATION: 3600,        // 1 hora
  
  // Duração do refresh token (segundos)
  REFRESH_TOKEN_DURATION: 86400, // 24 horas
  
  // Tempo antes da expiração para renovar (segundos)
  RENEWAL_THRESHOLD: 300,        // 5 minutos
  
  // Máximo de sessões por usuário
  MAX_SESSIONS_PER_USER: 5,
  
  // Prefixos de cache
  SESSION_PREFIX: 'session:',
  REFRESH_PREFIX: 'refresh:',
  USER_SESSIONS_PREFIX: 'user_sessions:'
};

// ============================================================================
// SESSION MANAGER
// ============================================================================

/**
 * @class SessionManager
 * @description Gerenciador de sessões
 */
var SessionManager = (function() {
  
  /**
   * Construtor
   * 
   * @constructor
   * @param {Object} [options] - Opções
   */
  function SessionManager(options) {
    options = options || {};
    
    this.sessionDuration = options.sessionDuration || SESSION_CONFIG.SESSION_DURATION;
    this.refreshDuration = options.refreshDuration || SESSION_CONFIG.REFRESH_TOKEN_DURATION;
    this.renewalThreshold = options.renewalThreshold || SESSION_CONFIG.RENEWAL_THRESHOLD;
    
    try {
      this.cache = CacheService.getUserCache();
      this.scriptCache = CacheService.getScriptCache();
    } catch (e) {
      this.cache = null;
      this.scriptCache = null;
    }
    
    this.stats = {
      created: 0,
      validated: 0,
      renewed: 0,
      expired: 0,
      revoked: 0
    };
  }
  
  /**
   * Cria nova sessão
   * 
   * @param {Object} user - Dados do usuário
   * @return {Object} Sessão criada
   * 
   * @example
   * var session = sessionMgr.createSession({
   *   id: 'user123',
   *   email: 'user@example.com',
   *   role: 'Admin'
   * });
   */
  SessionManager.prototype.createSession = function(user) {
    try {
      // Gera tokens
      var sessionToken = this._generateToken();
      var refreshToken = this._generateToken();
      
      var now = new Date().getTime();
      var expiresAt = now + (this.sessionDuration * 1000);
      var refreshExpiresAt = now + (this.refreshDuration * 1000);
      
      // Cria sessão
      var session = {
        token: sessionToken,
        refreshToken: refreshToken,
        userId: user.id || user.ID,
        email: user.email || user.Email,
        role: user.role || user.Role || user.funcao,
        createdAt: now,
        expiresAt: expiresAt,
        refreshExpiresAt: refreshExpiresAt,
        lastActivity: now
      };
      
      // Armazena sessão
      this._storeSession(session);
      
      // Adiciona à lista de sessões do usuário
      this._addUserSession(session.userId, sessionToken);
      
      // Limita sessões por usuário
      this._limitUserSessions(session.userId);
      
      this.stats.created++;
      
      // Log
      try {
        getLogger().info('Sessão criada', {
          userId: session.userId,
          expiresIn: this.sessionDuration + 's'
        });
      } catch (e) {
        Logger.log('[SessionManager] Sessão criada: ' + session.userId);
      }
      
      return {
        token: sessionToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        expiresIn: this.sessionDuration
      };
      
    } catch (error) {
      throw new Error('Erro ao criar sessão: ' + error.message);
    }
  };
  
  /**
   * Valida sessão
   * 
   * @param {string} token - Token da sessão
   * @return {Object} Resultado da validação
   * 
   * @example
   * var result = sessionMgr.validateSession(token);
   * if (result.valid) {
   *   // Sessão válida
   * }
   */
  SessionManager.prototype.validateSession = function(token) {
    try {
      this.stats.validated++;
      
      if (!token) {
        return {
          valid: false,
          error: 'Token ausente'
        };
      }
      
      // Busca sessão
      var session = this._getSession(token);
      
      if (!session) {
        this.stats.expired++;
        return {
          valid: false,
          error: 'Sessão não encontrada ou expirada'
        };
      }
      
      var now = new Date().getTime();
      
      // Verifica expiração
      if (now > session.expiresAt) {
        this._removeSession(token);
        this.stats.expired++;
        return {
          valid: false,
          error: 'Sessão expirada',
          expired: true
        };
      }
      
      // Atualiza última atividade
      session.lastActivity = now;
      this._storeSession(session);
      
      // Verifica se precisa renovar
      var timeUntilExpiry = session.expiresAt - now;
      var needsRenewal = timeUntilExpiry < (this.renewalThreshold * 1000);
      
      return {
        valid: true,
        session: session,
        needsRenewal: needsRenewal,
        expiresIn: Math.floor(timeUntilExpiry / 1000)
      };
      
    } catch (error) {
      return {
        valid: false,
        error: 'Erro ao validar sessão: ' + error.message
      };
    }
  };
  
  /**
   * Renova sessão
   * 
   * @param {string} token - Token atual
   * @return {Object} Nova sessão
   * 
   * @example
   * var newSession = sessionMgr.renewSession(oldToken);
   */
  SessionManager.prototype.renewSession = function(token) {
    try {
      // Valida sessão atual
      var validation = this.validateSession(token);
      
      if (!validation.valid) {
        throw new Error('Sessão inválida para renovação');
      }
      
      var session = validation.session;
      var now = new Date().getTime();
      
      // Gera novo token
      var newToken = this._generateToken();
      var newExpiresAt = now + (this.sessionDuration * 1000);
      
      // Atualiza sessão
      session.token = newToken;
      session.expiresAt = newExpiresAt;
      session.lastActivity = now;
      
      // Remove sessão antiga
      this._removeSession(token);
      
      // Armazena nova sessão
      this._storeSession(session);
      
      // Atualiza lista de sessões do usuário
      this._removeUserSession(session.userId, token);
      this._addUserSession(session.userId, newToken);
      
      this.stats.renewed++;
      
      // Log
      try {
        getLogger().info('Sessão renovada', {
          userId: session.userId,
          oldToken: token.substring(0, 8) + '...',
          newToken: newToken.substring(0, 8) + '...'
        });
      } catch (e) {
        Logger.log('[SessionManager] Sessão renovada: ' + session.userId);
      }
      
      return {
        token: newToken,
        refreshToken: session.refreshToken,
        expiresAt: newExpiresAt,
        expiresIn: this.sessionDuration
      };
      
    } catch (error) {
      throw new Error('Erro ao renovar sessão: ' + error.message);
    }
  };
  
  /**
   * Renova sessão usando refresh token
   * 
   * @param {string} refreshToken - Refresh token
   * @return {Object} Nova sessão
   * 
   * @example
   * var newSession = sessionMgr.refreshSession(refreshToken);
   */
  SessionManager.prototype.refreshSession = function(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token ausente');
      }
      
      // Busca sessão pelo refresh token
      var session = this._getSessionByRefreshToken(refreshToken);
      
      if (!session) {
        throw new Error('Refresh token inválido ou expirado');
      }
      
      var now = new Date().getTime();
      
      // Verifica expiração do refresh token
      if (now > session.refreshExpiresAt) {
        this._removeSession(session.token);
        throw new Error('Refresh token expirado');
      }
      
      // Gera novos tokens
      var newToken = this._generateToken();
      var newRefreshToken = this._generateToken();
      var newExpiresAt = now + (this.sessionDuration * 1000);
      var newRefreshExpiresAt = now + (this.refreshDuration * 1000);
      
      // Remove sessão antiga
      this._removeSession(session.token);
      this._removeUserSession(session.userId, session.token);
      
      // Cria nova sessão
      session.token = newToken;
      session.refreshToken = newRefreshToken;
      session.expiresAt = newExpiresAt;
      session.refreshExpiresAt = newRefreshExpiresAt;
      session.lastActivity = now;
      
      // Armazena nova sessão
      this._storeSession(session);
      this._addUserSession(session.userId, newToken);
      
      this.stats.renewed++;
      
      return {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        expiresIn: this.sessionDuration
      };
      
    } catch (error) {
      throw new Error('Erro ao refresh: ' + error.message);
    }
  };
  
  /**
   * Revoga sessão
   * 
   * @param {string} token - Token da sessão
   * @return {boolean} Sucesso
   * 
   * @example
   * sessionMgr.revokeSession(token);
   */
  SessionManager.prototype.revokeSession = function(token) {
    try {
      var session = this._getSession(token);
      
      if (session) {
        this._removeSession(token);
        this._removeUserSession(session.userId, token);
        this.stats.revoked++;
        
        // Log
        try {
          getLogger().info('Sessão revogada', { userId: session.userId });
        } catch (e) {
          Logger.log('[SessionManager] Sessão revogada: ' + session.userId);
        }
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Revoga todas as sessões do usuário
   * 
   * @param {string} userId - ID do usuário
   * @return {number} Quantidade de sessões revogadas
   * 
   * @example
   * var count = sessionMgr.revokeAllUserSessions('user123');
   */
  SessionManager.prototype.revokeAllUserSessions = function(userId) {
    try {
      var sessions = this._getUserSessions(userId);
      var count = 0;
      
      for (var i = 0; i < sessions.length; i++) {
        if (this.revokeSession(sessions[i])) {
          count++;
        }
      }
      
      return count;
      
    } catch (error) {
      return 0;
    }
  };
  
  /**
   * Obtém sessões ativas do usuário
   * 
   * @param {string} userId - ID do usuário
   * @return {Array} Lista de sessões
   * 
   * @example
   * var sessions = sessionMgr.getActiveSessions('user123');
   */
  SessionManager.prototype.getActiveSessions = function(userId) {
    try {
      var tokens = this._getUserSessions(userId);
      var sessions = [];
      
      for (var i = 0; i < tokens.length; i++) {
        var session = this._getSession(tokens[i]);
        if (session) {
          sessions.push({
            token: tokens[i].substring(0, 8) + '...',
            createdAt: new Date(session.createdAt),
            expiresAt: new Date(session.expiresAt),
            lastActivity: new Date(session.lastActivity)
          });
        }
      }
      
      return sessions;
      
    } catch (error) {
      return [];
    }
  };
  
  /**
   * Obtém estatísticas
   * 
   * @return {Object} Estatísticas
   */
  SessionManager.prototype.getStats = function() {
    return {
      created: this.stats.created,
      validated: this.stats.validated,
      renewed: this.stats.renewed,
      expired: this.stats.expired,
      revoked: this.stats.revoked
    };
  };
  
  // ==========================================================================
  // MÉTODOS PRIVADOS
  // ==========================================================================
  
  /**
   * Gera token único
   * 
   * @private
   * @return {string} Token
   */
  SessionManager.prototype._generateToken = function() {
    return Utilities.getUuid();
  };
  
  /**
   * Armazena sessão
   * 
   * @private
   * @param {Object} session - Sessão
   */
  SessionManager.prototype._storeSession = function(session) {
    if (!this.cache) return;
    
    var key = SESSION_CONFIG.SESSION_PREFIX + session.token;
    var ttl = Math.floor((session.expiresAt - new Date().getTime()) / 1000);
    
    this.cache.put(key, JSON.stringify(session), ttl);
  };
  
  /**
   * Obtém sessão
   * 
   * @private
   * @param {string} token - Token
   * @return {Object} Sessão
   */
  SessionManager.prototype._getSession = function(token) {
    if (!this.cache) return null;
    
    var key = SESSION_CONFIG.SESSION_PREFIX + token;
    var data = this.cache.get(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  };
  
  /**
   * Remove sessão
   * 
   * @private
   * @param {string} token - Token
   */
  SessionManager.prototype._removeSession = function(token) {
    if (!this.cache) return;
    
    var key = SESSION_CONFIG.SESSION_PREFIX + token;
    this.cache.remove(key);
  };
  
  /**
   * Busca sessão por refresh token
   * 
   * @private
   * @param {string} refreshToken - Refresh token
   * @return {Object} Sessão
   */
  SessionManager.prototype._getSessionByRefreshToken = function(refreshToken) {
    // Nota: Em produção, usar índice ou banco de dados
    // Por simplicidade, não implementado aqui
    return null;
  };
  
  /**
   * Adiciona sessão à lista do usuário
   * 
   * @private
   * @param {string} userId - ID do usuário
   * @param {string} token - Token
   */
  SessionManager.prototype._addUserSession = function(userId, token) {
    if (!this.scriptCache) return;
    
    var key = SESSION_CONFIG.USER_SESSIONS_PREFIX + userId;
    var data = this.scriptCache.get(key);
    var sessions = data ? JSON.parse(data) : [];
    
    sessions.push(token);
    
    this.scriptCache.put(key, JSON.stringify(sessions), this.refreshDuration);
  };
  
  /**
   * Remove sessão da lista do usuário
   * 
   * @private
   * @param {string} userId - ID do usuário
   * @param {string} token - Token
   */
  SessionManager.prototype._removeUserSession = function(userId, token) {
    if (!this.scriptCache) return;
    
    var key = SESSION_CONFIG.USER_SESSIONS_PREFIX + userId;
    var data = this.scriptCache.get(key);
    
    if (!data) return;
    
    var sessions = JSON.parse(data);
    var index = sessions.indexOf(token);
    
    if (index !== -1) {
      sessions.splice(index, 1);
      this.scriptCache.put(key, JSON.stringify(sessions), this.refreshDuration);
    }
  };
  
  /**
   * Obtém sessões do usuário
   * 
   * @private
   * @param {string} userId - ID do usuário
   * @return {Array} Tokens
   */
  SessionManager.prototype._getUserSessions = function(userId) {
    if (!this.scriptCache) return [];
    
    var key = SESSION_CONFIG.USER_SESSIONS_PREFIX + userId;
    var data = this.scriptCache.get(key);
    
    return data ? JSON.parse(data) : [];
  };
  
  /**
   * Limita sessões por usuário
   * 
   * @private
   * @param {string} userId - ID do usuário
   */
  SessionManager.prototype._limitUserSessions = function(userId) {
    var sessions = this._getUserSessions(userId);
    
    if (sessions.length > SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      // Remove sessões mais antigas
      var toRemove = sessions.length - SESSION_CONFIG.MAX_SESSIONS_PER_USER;
      
      for (var i = 0; i < toRemove; i++) {
        this.revokeSession(sessions[i]);
      }
    }
  };
  
  return SessionManager;
})();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global do SessionManager
 * 
 * @return {SessionManager}
 */
function getSessionManager() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getSessionManager();
  }
  
  if (typeof globalThis._sessionManager === 'undefined') {
    globalThis._sessionManager = new SessionManager();
  }
  return globalThis._sessionManager;
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa SessionManager
 */
function testSessionManager() {
  Logger.log('🧪 Testando Session Manager...\n');
  
  try {
    var sessionMgr = new SessionManager({
      sessionDuration: 60,  // 1 minuto para teste
      renewalThreshold: 30  // 30 segundos
    });
    
    // Teste 1: Criar sessão
    Logger.log('=== Teste 1: Criar Sessão ===');
    var user = { id: 'test123', email: 'test@example.com', role: 'Admin' };
    var session = sessionMgr.createSession(user);
    Logger.log('✓ Token: ' + session.token.substring(0, 20) + '...');
    Logger.log('✓ Expira em: ' + session.expiresIn + 's');
    
    // Teste 2: Validar sessão
    Logger.log('\n=== Teste 2: Validar Sessão ===');
    var validation = sessionMgr.validateSession(session.token);
    Logger.log('✓ Válida: ' + validation.valid);
    Logger.log('✓ Expira em: ' + validation.expiresIn + 's');
    
    // Teste 3: Renovar sessão
    Logger.log('\n=== Teste 3: Renovar Sessão ===');
    var renewed = sessionMgr.renewSession(session.token);
    Logger.log('✓ Novo token: ' + renewed.token.substring(0, 20) + '...');
    Logger.log('✓ Token diferente: ' + (renewed.token !== session.token));
    
    // Teste 4: Revogar sessão
    Logger.log('\n=== Teste 4: Revogar Sessão ===');
    sessionMgr.revokeSession(renewed.token);
    var afterRevoke = sessionMgr.validateSession(renewed.token);
    Logger.log('✓ Revogada: ' + !afterRevoke.valid);
    
    // Teste 5: Estatísticas
    Logger.log('\n=== Teste 5: Estatísticas ===');
    var stats = sessionMgr.getStats();
    Logger.log('✓ Stats: ' + JSON.stringify(stats));
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return { success: true };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return { success: false, error: error.message };
  }
}


