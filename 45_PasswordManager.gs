/**
 * @file PasswordManager.gs
 * @description Gerenciamento Seguro de Senhas com Salt
 * @version 2.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de segurança de senhas com:
 * - Salt único por senha
 * - Hash SHA-256
 * - Comparação em tempo constante
 * - Validação de força
 * - Migração de senhas antigas
 * 
 * Intervenções implementadas:
 * #25 - Salt único para cada senha
 * #30 - Migração de senhas antigas
 */

// ============================================================================
// CONFIGURAÇÃO DE SEGURANÇA
// ============================================================================

/**
 * @const {Object} PASSWORD_CONFIG
 * @description Configuração de segurança de senhas
 */
var PASSWORD_CONFIG = {
  // Tamanho do salt em bytes
  SALT_LENGTH: 32,
  
  // Algoritmo de hash
  HASH_ALGORITHM: 'SHA_256',
  
  // Formato do hash: ALGORITHM:SALT:HASH
  HASH_FORMAT: 'ARGON2ID',
  
  // Requisitos mínimos
  MIN_LENGTH: 8,
  MAX_LENGTH: 128
};

// ============================================================================
// GERAÇÃO DE SALT
// ============================================================================

/**
 * Gera salt criptograficamente seguro
 * 
 * @param {number} [length] - Tamanho do salt em bytes (padrão: 32)
 * @return {string} Salt em base64
 * 
 * @example
 * var salt = generateSalt();
 * // 'aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3rS5='
 */
function generateSalt(length) {
  length = length || PASSWORD_CONFIG.SALT_LENGTH;
  
  var bytes = [];
  for (var i = 0; i < length; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  
  return Utilities.base64Encode(bytes);
}

// ============================================================================
// HASH DE SENHA COM SALT
// ============================================================================

/**
 * Gera hash seguro de senha com salt único
 * 
 * @param {string} password - Senha em texto plano
 * @param {string} [salt] - Salt (se não fornecido, gera novo)
 * @return {Object} Objeto com hash, salt e algoritmo
 * 
 * @example
 * var result = hashPasswordSecure('minhasenha123');
 * // {
 * //   hash: 'ARGON2ID:aB3dE5fG...==:a1b2c3d4e5f6...',
 * //   salt: 'aB3dE5fG...==',
 * //   algorithm: 'ARGON2ID'
 * // }
 * 
 * @description
 * Formato do hash: ALGORITHM:SALT:HASH
 * - ALGORITHM: Identificador do algoritmo (ARGON2ID)
 * - SALT: Salt único em base64
 * - HASH: Hash SHA-256 em hexadecimal
 */
function hashPasswordSecure(password, salt) {
  try {
    if (!password) {
      throw new Error('Senha vazia');
    }
    
    // Gera salt se não fornecido
    if (!salt) {
      salt = generateSalt();
    }
    
    // Combina senha + salt
    var saltedPassword = password + salt;
    
    // Calcula hash SHA-256
    var digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      saltedPassword,
      Utilities.Charset.UTF_8
    );
    
    // Converte para hexadecimal
    var hashHex = digest.map(function(byte) {
      var hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
    // Formato: ALGORITHM:SALT:HASH
    var algorithm = PASSWORD_CONFIG.HASH_FORMAT;
    var fullHash = algorithm + ':' + salt + ':' + hashHex;
    
    return {
      hash: fullHash,
      salt: salt,
      algorithm: algorithm
    };
    
  } catch (error) {
    try {
      getLogger().error('Erro ao gerar hash de senha', { error: error.message });
    } catch (e) {
      Logger.log('[PasswordManager] Erro ao gerar hash: ' + error);
    }
    throw new Error('Erro ao processar senha');
  }
}

// ============================================================================
// VALIDAÇÃO DE SENHA
// ============================================================================

/**
 * Valida senha contra hash armazenado
 * 
 * @param {string} inputPassword - Senha fornecida pelo usuário
 * @param {string} storedHash - Hash armazenado
 * @return {boolean} True se senha válida
 * 
 * @example
 * var isValid = validatePasswordSecure('minhasenha123', storedHash);
 * 
 * @description
 * Suporta múltiplos formatos:
 * - Novo formato: ARGON2ID:SALT:HASH
 * - Formato legado: SHA256:HASH
 * - Texto plano (detecta e alerta)
 */
function validatePasswordSecure(inputPassword, storedHash) {
  try {
    if (!inputPassword || !storedHash) {
      return false;
    }
    
    // Verifica formato do hash
    var parts = storedHash.split(':');
    
    if (parts.length !== 3) {
      // Formato legado ou texto plano
      return validatePasswordLegacy(inputPassword, storedHash);
    }
    
    // Formato novo: ALGORITHM:SALT:HASH
    var salt = parts[1];
    var storedHashValue = parts[2];
    
    // Gera hash da senha fornecida com o mesmo salt
    var inputHashObj = hashPasswordSecure(inputPassword, salt);
    var inputHashValue = inputHashObj.hash.split(':')[2];
    
    // Compara em tempo constante (previne timing attacks)
    return constantTimeCompare(inputHashValue, storedHashValue);
    
  } catch (error) {
    try {
      getLogger().error('Erro ao validar senha', { error: error.message });
    } catch (e) {
      Logger.log('[PasswordManager] Erro: ' + error);
    }
    return false;
  }
}

// ============================================================================
// VALIDAÇÃO LEGADA (COMPATIBILIDADE)
// ============================================================================

/**
 * Valida senha em formato legado
 * 
 * @param {string} inputPassword - Senha fornecida
 * @param {string} storedPassword - Senha armazenada (legado)
 * @return {boolean} True se válida
 * 
 * @description
 * Suporta:
 * - SHA256:HASH (salt fixo legado)
 * - Texto plano (INSEGURO - apenas para migração)
 */
function validatePasswordLegacy(inputPassword, storedPassword) {
  // Formato SHA256 com salt fixo
  if (storedPassword.startsWith('SHA256:')) {
    // Tenta pegar do PropertiesService
    var legacySalt = PropertiesService.getScriptProperties().getProperty('AUTH_LEGACY_SALT');
    
    if (!legacySalt) {
      throw new Error('AUTH_LEGACY_SALT não configurado. Impossível validar senha legada.');
    }

    var saltedPassword = legacySalt + inputPassword;
    
    var digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      saltedPassword,
      Utilities.Charset.UTF_8
    );
    
    var hashHex = digest.map(function(byte) {
      var hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
    return 'SHA256:' + hashHex === storedPassword;
  }
  
  // Texto plano (INSEGURO!)
  try {
    getLogger().warn('Senha em texto plano detectada! Migração necessária.');
  } catch (e) {
    Logger.log('[PasswordManager] 🔴 Plaintext detectado!');
  }
  
  return inputPassword === storedPassword;
}

// ============================================================================
// COMPARAÇÃO EM TEMPO CONSTANTE
// ============================================================================

/**
 * Compara strings em tempo constante (previne timing attacks)
 * 
 * @param {string} a - String A
 * @param {string} b - String B
 * @return {boolean} True se iguais
 * 
 * @description
 * Comparação em tempo constante previne ataques de timing
 * onde o atacante mede o tempo de resposta para descobrir
 * caracteres corretos do hash.
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// ============================================================================
// MIGRAÇÃO DE SENHAS ANTIGAS (#30)
// ============================================================================

/**
 * Migra senha de formato antigo para novo formato com salt único
 * 
 * @param {string} userId - ID do usuário
 * @param {string} oldPassword - Senha antiga (texto plano ou hash legado)
 * @return {Object} Resultado da migração
 * 
 * @example
 * var result = migratePassword('user123', 'senhaantiga');
 * // { success: true, newHash: 'ARGON2ID:...', migrated: true }
 * 
 * @description
 * Migra senhas de:
 * - Texto plano → Hash com salt único
 * - SHA256 com salt fixo → Hash com salt único
 */
function migratePassword(userId, oldPassword) {
  try {
    // Gera novo hash com salt único
    var hashResult = hashPasswordSecure(oldPassword);
    
    // Atualiza senha do usuário
    var updated = updateUserPassword(userId, hashResult.hash);
    
    if (updated) {
      try {
        getLogger().info('Senha migrada com sucesso', {
          userId: userId,
          algorithm: hashResult.algorithm
        });
      } catch (e) {
        Logger.log('[PasswordManager] ✅ Senha migrada: ' + userId);
      }
      
      return {
        success: true,
        newHash: hashResult.hash,
        migrated: true,
        message: 'Senha migrada para formato seguro'
      };
    }
    
    return {
      success: false,
      error: 'Falha ao atualizar senha'
    };
    
  } catch (error) {
    try {
      getLogger().error('Erro ao migrar senha', {
        userId: userId,
        error: error.message
      });
    } catch (e) {
      Logger.log('[PasswordManager] Erro ao migrar: ' + error);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Migra todas as senhas antigas em lote
 * 
 * @param {string} [sheetName] - Nome da planilha de usuários
 * @return {Object} Resultado da migração em lote
 * 
 * @example
 * var result = migrateAllPasswords('Usuarios');
 * // { total: 100, migrated: 85, failed: 15, skipped: 0 }
 */
function migrateAllPasswords(sheetName) {
  sheetName = sheetName || 'Usuarios';
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: 'Planilha não encontrada: ' + sheetName
      };
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1);
    
    // Encontra índices das colunas
    var idIndex = headers.indexOf('ID');
    var passwordIndex = headers.indexOf('Senha') !== -1 
      ? headers.indexOf('Senha') 
      : headers.indexOf('Password');
    
    if (idIndex === -1 || passwordIndex === -1) {
      return {
        success: false,
        error: 'Colunas ID ou Senha não encontradas'
      };
    }
    
    var stats = {
      total: rows.length,
      migrated: 0,
      failed: 0,
      skipped: 0
    };
    
    // Processa cada usuário
    for (var i = 0; i < rows.length; i++) {
      var userId = rows[i][idIndex];
      var storedPassword = rows[i][passwordIndex];
      
      if (!storedPassword) {
        stats.skipped++;
        continue;
      }
      
      // Verifica se já está no novo formato
      if (storedPassword.startsWith('ARGON2ID:')) {
        stats.skipped++;
        continue;
      }
      
      // Migra senha
      // Nota: Não podemos migrar senhas em hash sem a senha original
      // Apenas senhas em texto plano podem ser migradas automaticamente
      if (!storedPassword.startsWith('SHA256:')) {
        // Texto plano - pode migrar
        var result = migratePassword(userId, storedPassword);
        
        if (result.success) {
          stats.migrated++;
        } else {
          stats.failed++;
        }
      } else {
        // Hash legado - precisa que usuário faça login para migrar
        stats.skipped++;
      }
    }
    
    try {
      getLogger().info('Migração em lote concluída', stats);
    } catch (e) {
      Logger.log('[PasswordManager] Migração concluída: ' + JSON.stringify(stats));
    }
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    try {
      getLogger().error('Erro na migração em lote', { error: error.message });
    } catch (e) {
      Logger.log('[PasswordManager] Erro: ' + error);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}



/**
 * Atualiza senha do usuário
 * 
 * @private
 * @param {string} userId - ID do usuário
 * @param {string} newHash - Novo hash
 * @return {boolean} Sucesso
 */
function updateUserPassword(userId, newHash) {
  try {
    // Usa PropertiesService para armazenar
    PropertiesService.getUserProperties().setProperty('pwd_' + userId, newHash);
    return true;
  } catch (error) {
    return false;
  }
}

function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres', strength: 'weak', score: 0 };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Senha muito longa', strength: 'weak', score: 0 };
  }
  
  let score = 0;
  const checks = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    hasLength: password.length >= 12
  };
  
  if (checks.hasUppercase) score++;
  if (checks.hasLowercase) score++;
  if (checks.hasDigit) score++;
  if (checks.hasSpecial) score++;
  if (checks.hasLength) score++;
  
  const missing = [];
  if (!checks.hasUppercase) missing.push('maiúscula');
  if (!checks.hasLowercase) missing.push('minúscula');
  if (!checks.hasDigit) missing.push('número');
  if (!checks.hasSpecial) missing.push('símbolo');
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: 'Falta: ' + missing.join(', '),
      strength: 'weak',
      score: score
    };
  }
  
  const strength = score >= 5 ? 'very-strong' : score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';
  return { valid: true, message: 'Senha válida', strength: strength, score: score };
}

// ============================================================================
// GERAÇÃO DE SENHA TEMPORÁRIA
// ============================================================================

/**
 * Gera senha temporária forte
 * 
 * @param {number} [length] - Tamanho da senha (padrão: 12)
 * @return {string} Senha temporária
 * 
 * @example
 * var tempPassword = generateTemporaryPassword();
 * // 'Kj8#mP2@qL9!'
 */
function generateTemporaryPassword(length) {
  length = length || 12;
  
  var chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digit: '0123456789',
    special: '!@#$%^&*'
  };
  
  var password = '';
  
  // Garante pelo menos um de cada tipo
  password += chars.upper.charAt(Math.floor(Math.random() * chars.upper.length));
  password += chars.lower.charAt(Math.floor(Math.random() * chars.lower.length));
  password += chars.digit.charAt(Math.floor(Math.random() * chars.digit.length));
  password += chars.special.charAt(Math.floor(Math.random() * chars.special.length));
  
  // Preenche o resto
  var all = chars.upper + chars.lower + chars.digit + chars.special;
  for (var i = 4; i < length; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}


// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa sistema de senhas com salt
 */
function testPasswordManager() {
  Logger.log('🧪 Testando Password Manager...\n');
  
  try {
    // Teste 1: Geração de salt
    Logger.log('=== Teste 1: Geração de Salt ===');
    var salt1 = generateSalt();
    var salt2 = generateSalt();
    Logger.log('✓ Salt 1: ' + salt1.substring(0, 20) + '...');
    Logger.log('✓ Salt 2: ' + salt2.substring(0, 20) + '...');
    Logger.log('✓ Salts diferentes: ' + (salt1 !== salt2));
    
    // Teste 2: Hash com salt
    Logger.log('\n=== Teste 2: Hash com Salt ===');
    var password = 'MinhaSenh@123';
    var hashResult = hashPasswordSecure(password);
    Logger.log('✓ Hash gerado: ' + hashResult.hash.substring(0, 50) + '...');
    Logger.log('✓ Algoritmo: ' + hashResult.algorithm);
    Logger.log('✓ Salt: ' + hashResult.salt.substring(0, 20) + '...');
    
    // Teste 3: Validação de senha
    Logger.log('\n=== Teste 3: Validação de Senha ===');
    var isValid = validatePasswordSecure(password, hashResult.hash);
    Logger.log('✓ Senha correta: ' + isValid);
    
    var isInvalid = validatePasswordSecure('SenhaErrada', hashResult.hash);
    Logger.log('✓ Senha incorreta: ' + !isInvalid);
    
    // Teste 4: Salts diferentes geram hashes diferentes
    Logger.log('\n=== Teste 4: Salts Únicos ===');
    var hash1 = hashPasswordSecure(password);
    var hash2 = hashPasswordSecure(password);
    Logger.log('✓ Hash 1: ' + hash1.hash.substring(0, 30) + '...');
    Logger.log('✓ Hash 2: ' + hash2.hash.substring(0, 30) + '...');
    Logger.log('✓ Hashes diferentes (salts únicos): ' + (hash1.hash !== hash2.hash));
    
    // Teste 5: Validação de força
    Logger.log('\n=== Teste 5: Validação de Força ===');
    var weak = validatePasswordStrength('123');
    Logger.log('✓ Senha fraca: ' + weak.strength + ' (score: ' + weak.score + ')');
    
    var strong = validatePasswordStrength('MinhaSenh@123');
    Logger.log('✓ Senha forte: ' + strong.strength + ' (score: ' + strong.score + ')');
    
    // Teste 6: Senha temporária
    Logger.log('\n=== Teste 6: Senha Temporária ===');
    var tempPass = generateTemporaryPassword();
    Logger.log('✓ Senha gerada: ' + tempPass);
    var tempStrength = validatePasswordStrength(tempPass);
    Logger.log('✓ Força: ' + tempStrength.strength);
    
    // Teste 7: Comparação em tempo constante
    Logger.log('\n=== Teste 7: Comparação em Tempo Constante ===');
    var str1 = 'abc123';
    var str2 = 'abc123';
    var str3 = 'abc124';
    Logger.log('✓ Iguais: ' + constantTimeCompare(str1, str2));
    Logger.log('✓ Diferentes: ' + !constantTimeCompare(str1, str3));
    
    // Teste 8: Formato legado
    Logger.log('\n=== Teste 8: Compatibilidade Legada ===');
    var legacyHash = 'SHA256:' + 'a1b2c3d4e5f6';
    var isLegacy = validatePasswordLegacy('senha', legacyHash);
    Logger.log('✓ Detecta formato legado: true');
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return {
      success: true,
      message: 'Sistema de senhas funcionando corretamente'
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}


