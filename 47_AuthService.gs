/**
 * @file AuthService.gs
 * @description Serviço de Autenticação Unificado (Refatorado do V2)
 * @version 2.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 */

/**
 * @class AuthService
 * @description Gerencia autenticação, sessões e segurança de usuários
 */
class AuthService {
  constructor() {
    // Usa ServiceManager para obter instâncias (Singleton Pattern)
    this.userRepository = UserRepository; // UserRepository é um singleton
    
    // SessionManager precisa ser instanciado ou obtido via ServiceManager
    try {
      this.sessionManager = ServiceManager.getSessionManager();
    } catch (error) {
      // Fallback: cria nova instância se ServiceManager falhar
      Logger.log('[AuthService] Aviso: Criando nova instância de SessionManager');
      this.sessionManager = new SessionManager();
    }
    
    // Logger via ServiceManager
    try {
      this.logger = ServiceManager.getLoggerService();
    } catch (error) {
      // Fallback para Logger nativo
      this.logger = {
        info: function(msg) { Logger.log('[INFO] ' + msg); },
        error: function(msg) { Logger.log('[ERROR] ' + msg); },
        warn: function(msg) { Logger.log('[WARN] ' + msg); }
      };
    }
  }

  /**
   * Autentica usuário com credenciais
   * @param {Object} credentials {username, password}
   * @return {Object} {success, user, token, message}
   */
  authenticateUser(credentials) {
    try {
      this.logger.info(`[AuthService] 🔐 Tentativa de login: ${credentials?.username}`);

      // 1. Validação básica
      if (!credentials || !credentials.username || !credentials.password) {
        return this._errorResponse('Usuário e senha são obrigatórios');
      }

      const username = credentials.username.trim().toLowerCase();
      const password = credentials.password;

      // 2. Verificar bloqueio
      const lockStatus = this._checkLock(username);
      if (lockStatus.locked) {
        this._auditLog(username, 'LOGIN_BLOCKED', false, 'Conta bloqueada');
        return this._errorResponse(
          `Conta bloqueada. Tente em ${lockStatus.minutesRemaining} minutos`,
          { locked: true, minutesRemaining: lockStatus.minutesRemaining }
        );
      }

      // 3. Buscar usuário
      const user = this.userRepository.findByUsername(username);
      if (!user) {
        this._incrementAttempts(username);
        this._auditLog(username, 'LOGIN_FAILED', false, 'Usuário não encontrado');
        return this._errorResponse('Usuário ou senha incorretos');
      }

      // 4. Verificar status
      if (user.status !== 'Ativo') {
        this._auditLog(username, 'LOGIN_FAILED', false, 'Usuário inativo');
        return this._errorResponse('Conta inativa. Contate o administrador');
      }

      // 5. Validar senha
      const passwordValid = this._validatePassword(password, user);
      if (!passwordValid.success) {
        this._incrementAttempts(username);
        this._auditLog(username, 'LOGIN_FAILED', false, 'Senha incorreta');
        return this._errorResponse('Usuário ou senha incorretos');
      }

      // 6. Migrar senha se necessário (Legacy -> Secure)
      if (passwordValid.needsMigration) {
        this._migratePassword(user, password);
      }

      // 7. Resetar tentativas
      this._resetAttempts(username);

      // 8. Verificar primeiro acesso
      if (user.firstAccess) {
        this._auditLog(username, 'LOGIN_SUCCESS', true, 'Primeiro acesso - senha temporária');
        return {
          success: true,
          requirePasswordChange: true,
          user: this._safeUser(user),
          message: 'Primeiro acesso. Defina uma nova senha segura.'
        };
      }

      // 9. Criar sessão
      const sessionResult = this.sessionManager.createSession(user);
      if (!sessionResult.success) {
        return this._errorResponse('Erro ao criar sessão');
      }

      // 10. Atualizar último login
      this.userRepository.updateLastLogin(user.id, user.source);

      // 11. Log sucesso
      this._auditLog(username, 'LOGIN_SUCCESS', true, 'Login realizado', sessionResult.tokenId);
      this.logger.info(`[AuthService] ✅ Login sucesso: ${username}`);

      return {
        success: true,
        user: this._safeUser(user),
        token: sessionResult.token,
        expiresAt: sessionResult.expiresAt,
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      this.logger.error(`[AuthService] ❌ Erro crítico: ${error.message}`);
      return this._errorResponse('Erro no sistema. Tente novamente');
    }
  }

  /**
   * Valida token de sessão
   * @param {string} token
   * @return {Object} {valid, user, sessionId}
   */
  validateSession(token) {
    try {
      // Verifica se sessionManager está disponível
      if (!this.sessionManager) {
        this.logger.error('[AuthService] SessionManager não está disponível');
        return { valid: false, message: 'Erro interno: SessionManager não disponível' };
      }
      
      // Verifica se o método existe
      if (typeof this.sessionManager.validateSession !== 'function') {
        this.logger.error('[AuthService] SessionManager.validateSession não é uma função');
        return { valid: false, message: 'Erro interno: Método de validação não disponível' };
      }
      
      // Chama o método correto (validateSession, não validateToken)
      const result = this.sessionManager.validateSession(token);
      
      if (!result.valid) {
        return {
          valid: false,
          message: result.reason || result.message || 'Sessão inválida'
        };
      }
      
      return {
        valid: true,
        user: result.user,
        sessionId: result.sessionId
      };
    } catch (error) {
      this.logger.error(`[AuthService] Erro validateSession: ${error.message}`);
      return { valid: false, message: 'Erro ao validar sessão' };
    }
  }

  /**
   * Realiza logout
   * @param {string} token
   */
  logout(token) {
    try {
      // Verifica se sessionManager está disponível
      if (!this.sessionManager) {
        this.logger.error('[AuthService] SessionManager não está disponível');
        return { success: false, message: 'Erro interno: SessionManager não disponível' };
      }
      
      // Usa validateSession (não validateToken)
      const validation = this.sessionManager.validateSession(token);
      if (!validation.valid) {
        return { success: false, message: 'Sessão inválida' };
      }

      const username = validation.user.username;
      
      // Verifica se revokeSession existe
      if (typeof this.sessionManager.revokeSession === 'function') {
        this.sessionManager.revokeSession(validation.sessionId, 'logout');
      } else {
        this.logger.warn('[AuthService] SessionManager.revokeSession não disponível');
      }
      
      this._auditLog(username, 'LOGOUT', true, 'Logout realizado');
      return { success: true, message: 'Logout realizado com sucesso' };
    } catch (error) {
      this.logger.error(`[AuthService] Erro logout: ${error.message}`);
      return { success: false, message: 'Erro ao fazer logout' };
    }
  }

  /**
   * Troca de senha
   */
  changePassword(username, currentPassword, newPassword, isFirstAccess) {
    try {
      const user = this.userRepository.findByUsername(username);
      if (!user) return this._errorResponse('Usuário não encontrado');

      if (!isFirstAccess) {
        const passwordValid = this._validatePassword(currentPassword, user);
        if (!passwordValid.success) {
          this._auditLog(username, 'PASSWORD_CHANGE_FAILED', false, 'Senha atual incorreta');
          return this._errorResponse('Senha atual incorreta');
        }
      }

      // Validar força (assumindo função global ou helper)
      const strengthCheck = this.isValidPassword(newPassword); // Usa método interno
      if (!strengthCheck) return this._errorResponse('Senha fraca. Use 8+ caracteres, maiúsculas, minúsculas e números.');

      // Hash seguro
      const hashResult = hashPasswordSecure(newPassword);

      // Atualizar
      const updateResult = this.userRepository.updatePassword(user.id, hashResult.hash, user.source);
      if (!updateResult.success) return this._errorResponse('Erro ao atualizar senha');

      // Revogar sessões
      this.sessionManager.revokeAllSessions(username, 'password_changed');

      this._auditLog(username, 'PASSWORD_CHANGED', true, isFirstAccess ? 'Primeiro acesso' : 'Senha alterada');
      return { success: true, message: 'Senha alterada com sucesso. Faça login novamente.' };

    } catch (error) {
      this.logger.error(`[AuthService] Erro changePassword: ${error.message}`);
      return this._errorResponse('Erro ao alterar senha');
    }
  }

  /**
   * Registra novo usuário (Compatibilidade)
   */
  register(userData) {
    try {
      if (!userData || !userData.username || !userData.password || !userData.email) {
        return this._errorResponse('Dados incompletos');
      }

      if (!this.isValidEmail(userData.email)) {
        return this._errorResponse('Email inválido');
      }

      if (!this.isValidPassword(userData.password)) {
        return this._errorResponse('Senha fraca');
      }

      const hashResult = hashPasswordSecure(userData.password);
      
      const newUser = {
        username: userData.username,
        passwordHash: hashResult.hash,
        email: userData.email,
        role: userData.role || 'Visualizador',
        permissions: userData.permissions || 'dashboard:read'
      };

      const result = this.userRepository.createUser(newUser);
      
      if (result.success) {
        this._auditLog(userData.username, 'REGISTER', true, 'Novo usuário registrado');
        return { success: true, userId: result.userId, message: 'Usuário registrado com sucesso' };
      } else {
        return this._errorResponse(result.error || 'Erro ao criar usuário');
      }

    } catch (error) {
      this.logger.error(`[AuthService] Erro register: ${error.message}`);
      return this._errorResponse('Erro ao registrar usuário');
    }
  }

  /**
   * Valida formato de email (Compatibilidade)
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Valida força da senha (Compatibilidade)
   * Retorna boolean para compatibilidade com testes antigos
   */
  isValidPassword(password) {
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  /**
   * Valida força da senha (Formato objeto para testes)
   * @param {string} password
   * @return {Object} {valid, errors}
   */
  validatePassword(password) {
    const isValid = this.isValidPassword(password);
    return {
      valid: isValid,
      errors: isValid ? [] : ['Senha fraca']
    };
  }

  // ==================== Private Methods ====================

  _validatePassword(password, user) {
    if (!user.passwordHash) return { success: false };
    
    // Assumindo função global validatePasswordSecure do PasswordManager.gs
    const isValid = validatePasswordSecure(password, user.passwordHash);
    const needsMigration = isValid && user.passwordHash.indexOf(':') === -1;
    
    return { success: isValid, needsMigration: needsMigration };
  }

  _migratePassword(user, password) {
    try {
      this.logger.info(`[AuthService] 🔄 Migrando senha: ${user.username}`);
      const hashResult = hashPasswordSecure(password);
      this.userRepository.updatePassword(user.id, hashResult.hash, user.source);
      this._auditLog(user.username, 'PASSWORD_MIGRATED', true, 'Senha migrada');
    } catch (error) {
      this.logger.error(`[AuthService] Erro migração: ${error.message}`);
    }
  }

  _checkLock(username) {
    const props = PropertiesService.getScriptProperties();
    const lockKey = 'LOCK_' + username;
    const lockData = props.getProperty(lockKey);

    if (lockData) {
      const lockTime = parseInt(lockData);
      const now = Date.now();
      const lockDuration = 30 * 60 * 1000; // 30 min

      if (now - lockTime < lockDuration) {
        const minutesRemaining = Math.ceil((lockDuration - (now - lockTime)) / 60000);
        return { locked: true, minutesRemaining: minutesRemaining };
      } else {
        props.deleteProperty(lockKey);
        props.deleteProperty('ATTEMPTS_' + username);
      }
    }
    return { locked: false };
  }

  _incrementAttempts(username) {
    const props = PropertiesService.getScriptProperties();
    const attemptsKey = 'ATTEMPTS_' + username;
    const lockKey = 'LOCK_' + username;
    
    const attempts = parseInt(props.getProperty(attemptsKey) || '0') + 1;
    props.setProperty(attemptsKey, attempts.toString());

    if (attempts >= 5) {
      props.setProperty(lockKey, Date.now().toString());
      this.logger.warn(`[AuthService] 🔒 Usuário bloqueado: ${username}`);
    }
  }

  _resetAttempts(username) {
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('ATTEMPTS_' + username);
    props.deleteProperty('LOCK_' + username);
  }

  _auditLog(username, action, success, details, sessionId) {
    try {
      // Mascarar dados sensíveis nos detalhes se necessário
      // Assumindo que DataMaskingService existe
      
      const logEntry = {
        Tipo: 'AUTH',
        Usuario: username,
        Acao: action,
        Sucesso: success ? 'Sim' : 'Não',
        Detalhes: details || '',
        Timestamp: new Date(),
        Session_ID: sessionId || ''
      };
      
      // Usar ServiceManager para pegar DataService 'Logs'
      const logsService = ServiceManager.getDataService('Logs');
      logsService.create(logEntry);
    } catch (e) {
      Logger.log(`[AuthService] Erro ao logar: ${e.message}`);
    }
  }

  _safeUser(user) {
    return {
      username: user.username,
      email: user.email,
      nome: user.fullName,
      role: user.role,
      permissions: this._parsePermissions(user.permissions),
      isPessoal: user.isPessoal || false,
      idRota: user.routeId || '',
      firstAccess: user.firstAccess || false
    };
  }

  _parsePermissions(permissionsStr) {
    if (!permissionsStr) return [];
    if (permissionsStr === '*') return ['*'];
    return permissionsStr.split(',').map(p => p.trim());
  }

  _errorResponse(message, extra) {
    const response = { success: false, message: message };
    if (extra) Object.assign(response, extra);
    return response;
  }
}

// ============================================================================
// GLOBAL WRAPPERS (Para acesso via google.script.run)
// ============================================================================

/**
 * Wrapper global para autenticação
 */
function authenticateUser(credentials) {
  const authService = ServiceManager.getAuthService();
  return authService.authenticateUser(credentials);
}

/**
 * Wrapper global para validar sessão
 */
function validateSession(token) {
  const authService = ServiceManager.getAuthService();
  return authService.validateSession(token);
}

/**
 * Wrapper global para logout
 */
function logout(token) {
  const authService = ServiceManager.getAuthService();
  return authService.logout(token);
}

/**
 * Wrapper global para troca de senha
 */
function changePassword(username, currentPassword, newPassword, isFirstAccess) {
  const authService = ServiceManager.getAuthService();
  return authService.changePassword(username, currentPassword, newPassword, isFirstAccess);
}
