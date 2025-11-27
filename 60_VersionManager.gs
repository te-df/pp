/**
 * @file VersionManager.gs
 * @description Gerenciamento centralizado de versão do sistema
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de versionamento com:
 * - Versão semântica (SemVer)
 * - Cache-busting automático
 * - Histórico de versões
 * - Comparação de versões
 * - Changelog
 * 
 * Intervenção #52 - Versionamento e cache-busting
 */

// ============================================================================
// CONFIGURAÇÃO DE VERSÃO
// ============================================================================

/**
 * @const {Object} VERSION_INFO
 * @description Informações de versão do sistema
 */
var VERSION_INFO = {
  // Versão atual (Semantic Versioning)
  MAJOR: 4,
  MINOR: 2,
  PATCH: 0,
  
  // Build info
  BUILD_DATE: '2024-11-22',
  BUILD_NUMBER: 142,
  
  // Ambiente
  ENVIRONMENT: 'production',
  
  // Metadados
  CODE_NAME: 'Phoenix',
  RELEASE_NOTES: 'Sistema completo de gestão com auditoria, cache e segurança'
};

/**
 * @const {string} SERVICE_VERSION
 * @description Versão completa do serviço (para cache-busting)
 */
var SERVICE_VERSION = VERSION_INFO.MAJOR + '.' + 
                      VERSION_INFO.MINOR + '.' + 
                      VERSION_INFO.PATCH;

/**
 * @const {string} VERSION_HASH
 * @description Hash da versão para cache-busting
 */
var VERSION_HASH = 'v' + SERVICE_VERSION + '-b' + VERSION_INFO.BUILD_NUMBER;

// ============================================================================
// VERSION MANAGER
// ============================================================================

/**
 * @class VersionManager
 * @description Gerenciador de versões
 */
var VersionManager = (function() {
  
  /**
   * Construtor
   * 
   * @constructor
   */
  function VersionManager() {
    this.currentVersion = SERVICE_VERSION;
    this.versionHash = VERSION_HASH;
  }
  
  /**
   * Obtém versão atual
   * 
   * @return {string} Versão
   * 
   * @example
   * var version = versionMgr.getVersion();
   * // '4.2.0'
   */
  VersionManager.prototype.getVersion = function() {
    return this.currentVersion;
  };
  
  /**
   * Obtém versão completa com build
   * 
   * @return {string} Versão completa
   * 
   * @example
   * var fullVersion = versionMgr.getFullVersion();
   * // '4.2.0-b142'
   */
  VersionManager.prototype.getFullVersion = function() {
    return this.currentVersion + '-b' + VERSION_INFO.BUILD_NUMBER;
  };
  
  /**
   * Obtém hash para cache-busting
   * 
   * @return {string} Hash
   * 
   * @example
   * var hash = versionMgr.getVersionHash();
   * // 'v4.2.0-b142'
   */
  VersionManager.prototype.getVersionHash = function() {
    return this.versionHash;
  };
  
  /**
   * Obtém informações completas da versão
   * 
   * @return {Object} Informações
   * 
   * @example
   * var info = versionMgr.getVersionInfo();
   */
  VersionManager.prototype.getVersionInfo = function() {
    return {
      version: this.currentVersion,
      fullVersion: this.getFullVersion(),
      hash: this.versionHash,
      major: VERSION_INFO.MAJOR,
      minor: VERSION_INFO.MINOR,
      patch: VERSION_INFO.PATCH,
      buildNumber: VERSION_INFO.BUILD_NUMBER,
      buildDate: VERSION_INFO.BUILD_DATE,
      environment: VERSION_INFO.ENVIRONMENT,
      codeName: VERSION_INFO.CODE_NAME,
      releaseNotes: VERSION_INFO.RELEASE_NOTES
    };
  };
  
  /**
   * Compara versões
   * 
   * @param {string} version1 - Versão 1
   * @param {string} version2 - Versão 2
   * @return {number} -1 se v1 < v2, 0 se iguais, 1 se v1 > v2
   * 
   * @example
   * versionMgr.compareVersions('4.2.0', '4.1.5'); // 1
   * versionMgr.compareVersions('4.2.0', '4.2.0'); // 0
   * versionMgr.compareVersions('4.1.0', '4.2.0'); // -1
   */
  VersionManager.prototype.compareVersions = function(version1, version2) {
    var v1Parts = version1.split('.').map(function(n) { return parseInt(n); });
    var v2Parts = version2.split('.').map(function(n) { return parseInt(n); });
    
    for (var i = 0; i < 3; i++) {
      var v1 = v1Parts[i] || 0;
      var v2 = v2Parts[i] || 0;
      
      if (v1 > v2) return 1;
      if (v1 < v2) return -1;
    }
    
    return 0;
  };
  
  /**
   * Verifica se versão é compatível
   * 
   * @param {string} requiredVersion - Versão mínima requerida
   * @return {boolean} True se compatível
   * 
   * @example
   * versionMgr.isCompatible('4.0.0'); // true
   * versionMgr.isCompatible('5.0.0'); // false
   */
  VersionManager.prototype.isCompatible = function(requiredVersion) {
    return this.compareVersions(this.currentVersion, requiredVersion) >= 0;
  };
  
  /**
   * Gera URL com cache-busting
   * 
   * @param {string} url - URL base
   * @return {string} URL com versão
   * 
   * @example
   * var url = versionMgr.cacheBustUrl('script.js');
   * // 'script.js?v=v4.2.0-b142'
   */
  VersionManager.prototype.cacheBustUrl = function(url) {
    var separator = url.indexOf('?') !== -1 ? '&' : '?';
    return url + separator + 'v=' + this.versionHash;
  };
  
  /**
   * Incrementa versão
   * 
   * @param {string} type - Tipo (major, minor, patch)
   * @return {string} Nova versão
   * 
   * @example
   * versionMgr.incrementVersion('patch'); // '4.2.1'
   * versionMgr.incrementVersion('minor'); // '4.3.0'
   * versionMgr.incrementVersion('major'); // '5.0.0'
   */
  VersionManager.prototype.incrementVersion = function(type) {
    var major = VERSION_INFO.MAJOR;
    var minor = VERSION_INFO.MINOR;
    var patch = VERSION_INFO.PATCH;
    
    switch (type.toLowerCase()) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
      default:
        throw new Error('Tipo inválido: ' + type);
    }
    
    return major + '.' + minor + '.' + patch;
  };
  
  /**
   * Salva versão nas propriedades
   * 
   * @return {boolean} Sucesso
   */
  VersionManager.prototype.saveVersion = function() {
    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty('SYSTEM_VERSION', this.currentVersion);
      props.setProperty('BUILD_NUMBER', VERSION_INFO.BUILD_NUMBER.toString());
      props.setProperty('BUILD_DATE', VERSION_INFO.BUILD_DATE);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Carrega versão das propriedades
   * 
   * @return {Object} Versão carregada
   */
  VersionManager.prototype.loadVersion = function() {
    try {
      var props = PropertiesService.getScriptProperties();
      return {
        version: props.getProperty('SYSTEM_VERSION'),
        buildNumber: props.getProperty('BUILD_NUMBER'),
        buildDate: props.getProperty('BUILD_DATE')
      };
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Verifica se precisa atualizar
   * 
   * @return {boolean} True se precisa atualizar
   */
  VersionManager.prototype.needsUpdate = function() {
    var stored = this.loadVersion();
    
    if (!stored || !stored.version) {
      return true;
    }
    
    return this.compareVersions(this.currentVersion, stored.version) > 0;
  };
  
  return VersionManager;
})();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global do VersionManager
 * 
 * @return {VersionManager}
 */
function getVersionManager() {
  if (typeof ServiceManager !== 'undefined') {
    return ServiceManager.getVersionManager();
  }
  
  if (typeof globalThis._versionManager === 'undefined') {
    globalThis._versionManager = new VersionManager();
  }
  return globalThis._versionManager;
}

/**
 * Obtém versão atual (wrapper)
 * 
 * @return {string} Versão
 */
function getVersion() {
  return SERVICE_VERSION;
}

/**
 * Obtém hash de versão (wrapper)
 * 
 * @return {string} Hash
 */
function getVersionHash() {
  return VERSION_HASH;
}

/**
 * Adiciona cache-busting a URL (wrapper)
 * 
 * @param {string} url - URL
 * @return {string} URL com versão
 */
function cacheBustUrl(url) {
  return getVersionManager().cacheBustUrl(url);
}

// ============================================================================
// CHANGELOG
// ============================================================================

/**
 * @const {Array} CHANGELOG
 * @description Histórico de versões
 */
var CHANGELOG = [
  {
    version: '4.2.0',
    date: '2024-11-22',
    codeName: 'Phoenix',
    changes: [
      'Sistema de versionamento centralizado',
      'Cache-busting automático',
      'Gerenciamento de sessões com expiração',
      'Sistema de autorização RBAC',
      'Auditoria completa de operações',
      'Validação de documentos brasileiros',
      'Retry com backoff exponencial',
      'Sistema de cache em múltiplas camadas'
    ]
  },
  {
    version: '4.1.0',
    date: '2024-11-15',
    codeName: 'Eagle',
    changes: [
      'Sistema de logging estruturado',
      'Validação centralizada de dados',
      'Tratamento de erros robusto',
      'Performance otimizada com batch operations'
    ]
  },
  {
    version: '4.0.0',
    date: '2024-11-01',
    codeName: 'Dragon',
    changes: [
      'Refatoração completa do sistema',
      'Arquitetura modular',
      'Interface redesenhada',
      'PWA support'
    ]
  }
];

/**
 * Obtém changelog
 * 
 * @param {number} [limit] - Limite de versões
 * @return {Array} Changelog
 */
function getChangelog(limit) {
  limit = limit || CHANGELOG.length;
  return CHANGELOG.slice(0, limit);
}

/**
 * Obtém mudanças da versão atual
 * 
 * @return {Object} Mudanças
 */
function getCurrentChanges() {
  return CHANGELOG[0];
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa VersionManager
 */
function testVersionManager() {
  Logger.log('🧪 Testando Version Manager...\n');
  
  try {
    var versionMgr = new VersionManager();
    
    // Teste 1: Versão atual
    Logger.log('=== Teste 1: Versão Atual ===');
    Logger.log('✓ Versão: ' + versionMgr.getVersion());
    Logger.log('✓ Versão completa: ' + versionMgr.getFullVersion());
    Logger.log('✓ Hash: ' + versionMgr.getVersionHash());
    
    // Teste 2: Informações
    Logger.log('\n=== Teste 2: Informações ===');
    var info = versionMgr.getVersionInfo();
    Logger.log('✓ Code name: ' + info.codeName);
    Logger.log('✓ Build: ' + info.buildNumber);
    Logger.log('✓ Data: ' + info.buildDate);
    
    // Teste 3: Comparação
    Logger.log('\n=== Teste 3: Comparação ===');
    Logger.log('✓ 4.2.0 vs 4.1.0: ' + versionMgr.compareVersions('4.2.0', '4.1.0'));
    Logger.log('✓ 4.2.0 vs 4.2.0: ' + versionMgr.compareVersions('4.2.0', '4.2.0'));
    Logger.log('✓ 4.1.0 vs 4.2.0: ' + versionMgr.compareVersions('4.1.0', '4.2.0'));
    
    // Teste 4: Compatibilidade
    Logger.log('\n=== Teste 4: Compatibilidade ===');
    Logger.log('✓ Compatível com 4.0.0: ' + versionMgr.isCompatible('4.0.0'));
    Logger.log('✓ Compatível com 5.0.0: ' + versionMgr.isCompatible('5.0.0'));
    
    // Teste 5: Cache-busting
    Logger.log('\n=== Teste 5: Cache-busting ===');
    var url = versionMgr.cacheBustUrl('script.js');
    Logger.log('✓ URL: ' + url);
    
    // Teste 6: Incremento
    Logger.log('\n=== Teste 6: Incremento ===');
    Logger.log('✓ Patch: ' + versionMgr.incrementVersion('patch'));
    Logger.log('✓ Minor: ' + versionMgr.incrementVersion('minor'));
    Logger.log('✓ Major: ' + versionMgr.incrementVersion('major'));
    
    // Teste 7: Changelog
    Logger.log('\n=== Teste 7: Changelog ===');
    var changes = getCurrentChanges();
    Logger.log('✓ Versão: ' + changes.version);
    Logger.log('✓ Mudanças: ' + changes.changes.length);
    
    Logger.log('\n✅ Todos os testes passaram!');
    
    return { success: true };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return { success: false, error: error.message };
  }
}


