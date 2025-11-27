/**
 * ============================================================================
 * USER REPOSITORY - Opera\u00e7\u00f5es Otimizadas de Dados
 * ============================================================================
 * Camada de acesso a dados com cache, Lock Service e opera\u00e7\u00f5es at\u00f4micas
 * ============================================================================
 */

var UserRepository = (function() {
  
  // Cache privado
  var _cache = {
    users: null,
    staff: null,
    lastUpdate: {
      users: 0,
      staff: 0
    },
    ttl: 5 * 60 * 1000 // 5 minutos
  };
  
  /**
   * Obt\u00e9m lock para opera\u00e7\u00f5es cr\u00edticas
   */
  function _getLock(operation) {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); // 10 segundos timeout
      return lock;
    } catch (e) {
      Logger.log('[UserRepo] Lock timeout: ' + operation);
      throw new Error('Sistema ocupado. Tente novamente.');
    }
  }
  
  /**
   * Libera lock
   */
  function _releaseLock(lock) {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (e) {
        Logger.log('[UserRepo] Erro ao liberar lock: ' + e);
      }
    }
  }
  
  /**
   * Executa função com lock
   */
  function _executeWithLock(lockName, callback) {
    var lock = _getLock(lockName);
    try {
      return callback();
    } catch (error) {
      Logger.log('[UserRepo] Erro ' + lockName + ': ' + error);
      return { success: false, error: error.toString() };
    } finally {
      _releaseLock(lock);
    }
  }
  
  /**
   * Valida cache
   */
  function _isCacheValid(type) {
    if (!_cache[type]) return false;
    var age = Date.now() - _cache.lastUpdate[type];
    return age < _cache.ttl;
  }
  
  /**
   * Busca usu\u00e1rio por username (otimizado)
   */
  function findByUsername(username) {
    try {
      var usernameLower = username.toLowerCase().trim();
      
      // Verificar cache primeiro
      var cachedUser = _findInCache(usernameLower);
      if (cachedUser) {
        Logger.log('[UserRepo] Cache hit: ' + usernameLower);
        return cachedUser;
      }
      
      // Buscar em Usuarios
      var usuarios = DataService('Usuarios').read();
      for (var i = 0; i < usuarios.length; i++) {
        var user = usuarios[i];
        var userUsername = (user.Username || user.Email || '').toLowerCase().trim();
        if (userUsername === usernameLower) {
          _cacheUser(user, 'users');
          return _normalizeUser(user, false);
        }
      }
      
      // Buscar em Pessoal
      var pessoal = DataService('Pessoal').read();
      for (var i = 0; i < pessoal.length; i++) {
        var staff = pessoal[i];
        var staffEmail = (staff.Email || '').toLowerCase().trim();
        if (staffEmail === usernameLower) {
          _cacheUser(staff, 'staff');
          return _normalizeUser(staff, true);
        }
      }
      
      return null;
      
    } catch (error) {
      Logger.log('[UserRepo] Erro findByUsername: ' + error);
      return null;
    }
  }
  
  /**
   * Busca em cache
   */
  function _findInCache(usernameLower) {
    if (_isCacheValid('users') && _cache.users) {
      for (var i = 0; i < _cache.users.length; i++) {
        var u = _cache.users[i];
        if ((u.Username || u.Email || '').toLowerCase() === usernameLower) {
          return _normalizeUser(u, false);
        }
      }
    }
    
    if (_isCacheValid('staff') && _cache.staff) {
      for (var i = 0; i < _cache.staff.length; i++) {
        var s = _cache.staff[i];
        if ((s.Email || '').toLowerCase() === usernameLower) {
          return _normalizeUser(s, true);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Adiciona ao cache
   */
  function _cacheUser(user, type) {
    if (!_cache[type]) _cache[type] = [];
    _cache[type].push(user);
    _cache.lastUpdate[type] = Date.now();
  }
  
  /**
   * Normaliza usu\u00e1rio para formato padr\u00e3o
   */
  function _normalizeUser(user, isStaff) {
    if (isStaff) {
      return {
        id: user.ID,
        username: user.Email,
        email: user.Email,
        passwordHash: user.Password_Hash || null,
        role: user.Funcao || 'Visualizador',
        permissions: _getStaffPermissions(user.Funcao),
        status: user.Status || 'Ativo',
        fullName: user.Nome_Completo,
        firstAccess: user.Primeiro_Acesso === 'Sim',
        lastLogin: user.Ultimo_Login || null,
        isPessoal: true,
        routeId: user.ID_Rota_Associada || null,
        cpf: user.CPF || null,
        source: 'Pessoal'
      };
    } else {
      return {
        id: user.ID,
        username: user.Username,
        email: user.Email,
        passwordHash: user.Password_Hash || user.password || null,
        role: user.Role || 'Visualizador',
        permissions: user.Permissions || 'dashboard:read',
        status: user.Status || 'Ativo',
        fullName: user.Nome_Completo || user.Username,
        firstAccess: user.Primeiro_Acesso === 'Sim',
        lastLogin: user.Ultimo_Login || null,
        totalLogins: parseInt(user.Total_Logins) || 0,
        isPessoal: false,
        source: 'Usuarios'
      };
    }
  }
  
  /**
   * Obt\u00e9m permiss\u00f5es por cargo
   */
  function _getStaffPermissions(funcao) {
    var perms = {
      'Motorista': 'frequencia:read,frequencia:write,incidentes:create,tracking:view,rotas:read',
      'Monitor': 'frequencia:read,frequencia:write,incidentes:create,alunos:read',
      'Monitora': 'frequencia:read,frequencia:write,incidentes:create,alunos:read'
    };
    return perms[funcao] || 'dashboard:read';
  }
  
  /**
   * Atualiza senha (opera\u00e7\u00e3o at\u00f4mica)
   */
  function updatePassword(userId, newPasswordHash, source) {
    return _executeWithLock('updatePassword', function() {
      var sheetName = source === 'Pessoal' ? 'Pessoal' : 'Usuarios';
      var updateData = {
        Password_Hash: newPasswordHash,
        Primeiro_Acesso: 'Não',
        Senha_Alterada_Em: new Date().toISOString()
      };
      
      DataService(sheetName).update(userId, updateData);
      
      // Invalidar cache
      _cache[source === 'Pessoal' ? 'staff' : 'users'] = null;
      
      Logger.log('[UserRepo] Senha atualizada: ' + userId);
      return { success: true };
    });
  }
  
  /**
   * Atualiza \u00faltimo login
   */
  function updateLastLogin(userId, source) {
    try {
      // Opera\u00e7\u00e3o n\u00e3o cr\u00edtica, sem lock
      var sheetName = source === 'Pessoal' ? 'Pessoal' : 'Usuarios';
      var updateData = {
        Ultimo_Login: new Date().toISOString()
      };
      
      if (source !== 'Pessoal') {
        var user = DataService('Usuarios').read(userId);
        if (user && user[0]) {
          updateData.Total_Logins = (parseInt(user[0].Total_Logins) || 0) + 1;
        }
      }
      
      DataService(sheetName).update(userId, updateData);
      
    } catch (error) {
      Logger.log('[UserRepo] Erro updateLastLogin: ' + error);
    }
  }
  
  /**
   * Cria novo usu\u00e1rio
   */
  function createUser(userData) {
    return _executeWithLock('createUser', function() {
      // Verificar duplica\u00e7\u00e3o
      if (findByUsername(userData.username)) {
        return { success: false, error: 'Usu\u00e1rio j\u00e1 existe' };
      }
      
      var newUser = {
        Username: userData.username,
        Password_Hash: userData.passwordHash,
        Email: userData.email,
        Role: userData.role || 'Visualizador',
        Permissions: userData.permissions || 'dashboard:read',
        Status: 'Ativo',
        Primeiro_Acesso: 'Sim',
        Criado_Em: new Date().toISOString(),
        Total_Logins: 0
      };
      
      var result = DataService('Usuarios').create(newUser);
      
      // Invalidar cache
      _cache.users = null;
      
      return { success: true, userId: result.id };
    });
  }
  
  /**
   * Lista todos usu\u00e1rios
   */
  function listAll() {
    try {
      var allUsers = [];
      
      var usuarios = DataService('Usuarios').read();
      usuarios.forEach(function(u) {
        allUsers.push(_normalizeUser(u, false));
      });
      
      var pessoal = DataService('Pessoal').read();
      pessoal.forEach(function(s) {
        if (s.Email) {
          allUsers.push(_normalizeUser(s, true));
        }
      });
      
      return allUsers;
    } catch (error) {
      Logger.log('[UserRepo] Erro listAll: ' + error);
      return [];
    }
  }
  
  /**
   * Invalida cache
   */
  function invalidateCache() {
    _cache.users = null;
    _cache.staff = null;
    _cache.lastUpdate.users = 0;
    _cache.lastUpdate.staff = 0;
  }
  
  // API p\u00fablica
  return {
    findByUsername: findByUsername,
    updatePassword: updatePassword,
    updateLastLogin: updateLastLogin,
    createUser: createUser,
    listAll: listAll,
    invalidateCache: invalidateCache
  };
  
})();
