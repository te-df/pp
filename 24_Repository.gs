/**
 * @file Repository.gs
 * @description Repository Pattern - Abstração de acesso a dados
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * 
 * IMPORTANTE: Este arquivo implementa o Repository Pattern para padronizar
 * operações CRUD e abstrair o acesso direto às planilhas.
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// BASE REPOSITORY - Classe Abstrata
// ============================================================================

/**
 * @class BaseRepository
 * @description Classe base para todos os repositories
 * Implementa operações CRUD genéricas
 */
var BaseRepository = (function() {
  
  /**
   * Construtor do BaseRepository
   * @param {string} sheetName - Nome da planilha
   */
  function BaseRepository(sheetName) {
    if (!sheetName) {
      throw new Error('[BaseRepository] Nome da planilha é obrigatório');
    }
    
    this.sheetName = sheetName;
    this.dataService = new DataService(sheetName);
    this.cache = CacheService.getScriptCache();
    this.cachePrefix = 'repo_' + sheetName + '_';
    this.cacheDuration = getConfig('env.CACHE_DURATION') || 300;
  }
  
  // ==========================================================================
  // OPERAÇÕES CRUD BÁSICAS
  // ==========================================================================
  
  /**
   * Cria um novo registro
   * @param {Object} data - Dados do registro
   * @return {Object} { success: boolean, data?: Object, error?: string }
   */
  BaseRepository.prototype.create = function(data) {
    try {
      // Validação básica
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Dados inválidos' };
      }
      
      // Adiciona metadados de auditoria
      data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      
      // Cria registro via DataService
      var result = this.dataService.create(data);
      
      // Limpa cache se sucesso
      if (result.success) {
        this._clearCache();
      }
      
      return result;
    } catch (error) {
      Logger.log('[BaseRepository.create] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Busca um registro por ID
   * @param {string|number} id - ID do registro
   * @return {Object} { success: boolean, data?: Object, error?: string }
   */
  BaseRepository.prototype.findById = function(id) {
    try {
      if (!id) {
        return { success: false, error: 'ID não fornecido' };
      }
      
      // Tenta buscar no cache
      var cacheKey = this.cachePrefix + 'id_' + id;
      var cached = this.cache.get(cacheKey);
      
      if (cached) {
        return { success: true, data: JSON.parse(cached), fromCache: true };
      }
      
      // Busca no DataService
      var result = this.dataService.read(id);
      
      // Armazena no cache se sucesso
      if (result.success && result.data) {
        this.cache.put(cacheKey, JSON.stringify(result.data), this.cacheDuration);
      }
      
      return result;
    } catch (error) {
      Logger.log('[BaseRepository.findById] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Busca todos os registros
   * @param {Object} filters - Filtros opcionais
   * @return {Object} { success: boolean, data?: Array, error?: string }
   */
  BaseRepository.prototype.findAll = function(filters) {
    try {
      filters = filters || {};
      
      // Tenta buscar no cache (apenas se sem filtros)
      if (Object.keys(filters).length === 0) {
        var cacheKey = this.cachePrefix + 'all';
        var cached = this.cache.get(cacheKey);
        
        if (cached) {
          return { success: true, data: JSON.parse(cached), fromCache: true };
        }
      }
      
      // Busca no DataService
      var result = this.dataService.read(null, filters);
      
      // Armazena no cache se sucesso e sem filtros
      if (result.success && result.data && Object.keys(filters).length === 0) {
        var cacheKey = this.cachePrefix + 'all';
        this.cache.put(cacheKey, JSON.stringify(result.data), this.cacheDuration);
      }
      
      return result;
    } catch (error) {
      Logger.log('[BaseRepository.findAll] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Busca registros com filtros específicos
   * @param {Object} filters - Filtros
   * @return {Object} { success: boolean, data?: Array, error?: string }
   */
  BaseRepository.prototype.findWhere = function(filters) {
    return this.findAll(filters);
  };
  
  /**
   * Busca um único registro com filtros
   * @param {Object} filters - Filtros
   * @return {Object} { success: boolean, data?: Object, error?: string }
   */
  BaseRepository.prototype.findOne = function(filters) {
    try {
      var result = this.findWhere(filters);
      
      if (result.success && result.data && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      
      return { success: false, error: 'Registro não encontrado' };
    } catch (error) {
      Logger.log('[BaseRepository.findOne] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Atualiza um registro
   * @param {string|number} id - ID do registro
   * @param {Object} data - Dados para atualizar
   * @return {Object} { success: boolean, data?: Object, error?: string }
   */
  BaseRepository.prototype.update = function(id, data) {
    try {
      if (!id) {
        return { success: false, error: 'ID não fornecido' };
      }
      
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Dados inválidos' };
      }
      
      // Adiciona metadado de atualização
      data.updatedAt = new Date().toISOString();
      
      // Atualiza via DataService
      var result = this.dataService.update(id, data);
      
      // Limpa cache se sucesso
      if (result.success) {
        this._clearCache();
      }
      
      return result;
    } catch (error) {
      Logger.log('[BaseRepository.update] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Deleta um registro
   * @param {string|number} id - ID do registro
   * @return {Object} { success: boolean, error?: string }
   */
  BaseRepository.prototype.delete = function(id) {
    try {
      if (!id) {
        return { success: false, error: 'ID não fornecido' };
      }
      
      // Deleta via DataService
      var result = this.dataService.delete(id);
      
      // Limpa cache se sucesso
      if (result.success) {
        this._clearCache();
      }
      
      return result;
    } catch (error) {
      Logger.log('[BaseRepository.delete] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  // ==========================================================================
  // OPERAÇÕES AVANÇADAS
  // ==========================================================================
  
  /**
   * Busca com paginação
   * @param {number} page - Número da página (1-based)
   * @param {number} pageSize - Tamanho da página
   * @param {Object} filters - Filtros opcionais
   * @return {Object} { success: boolean, data?: Array, pagination?: Object, error?: string }
   */
  BaseRepository.prototype.findPaginated = function(page, pageSize, filters) {
    try {
      page = page || 1;
      pageSize = pageSize || getConfig('limits.DEFAULT_PAGE_SIZE') || 20;
      filters = filters || {};
      
      // Busca todos os registros
      var result = this.findAll(filters);
      
      if (!result.success) {
        return result;
      }
      
      var allData = result.data || [];
      var totalRecords = allData.length;
      var totalPages = Math.ceil(totalRecords / pageSize);
      
      // Calcula índices
      var startIndex = (page - 1) * pageSize;
      var endIndex = startIndex + pageSize;
      
      // Extrai página
      var pageData = allData.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: pageData,
        pagination: {
          page: page,
          pageSize: pageSize,
          totalRecords: totalRecords,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      Logger.log('[BaseRepository.findPaginated] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Conta registros
   * @param {Object} filters - Filtros opcionais
   * @return {Object} { success: boolean, count?: number, error?: string }
   */
  BaseRepository.prototype.count = function(filters) {
    try {
      var result = this.findAll(filters);
      
      if (!result.success) {
        return result;
      }
      
      return {
        success: true,
        count: result.data ? result.data.length : 0
      };
    } catch (error) {
      Logger.log('[BaseRepository.count] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Verifica se existe um registro
   * @param {string|number} id - ID do registro
   * @return {Object} { success: boolean, exists?: boolean, error?: string }
   */
  BaseRepository.prototype.exists = function(id) {
    try {
      var result = this.findById(id);
      
      return {
        success: true,
        exists: result.success && result.data !== null
      };
    } catch (error) {
      Logger.log('[BaseRepository.exists] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Operações em lote
   * @param {Array} operations - Array de operações { type: 'create'|'update'|'delete', data: {...} }
   * @return {Object} { success: boolean, results?: Array, error?: string }
   */
  BaseRepository.prototype.batch = function(operations) {
    try {
      if (!Array.isArray(operations)) {
        return { success: false, error: 'Operações devem ser um array' };
      }
      
      var results = [];
      var hasError = false;
      
      for (var i = 0; i < operations.length; i++) {
        var op = operations[i];
        var result;
        
        switch (op.type) {
          case 'create':
            result = this.create(op.data);
            break;
          case 'update':
            result = this.update(op.id, op.data);
            break;
          case 'delete':
            result = this.delete(op.id);
            break;
          default:
            result = { success: false, error: 'Tipo de operação inválido: ' + op.type };
        }
        
        results.push(result);
        
        if (!result.success) {
          hasError = true;
        }
      }
      
      // Limpa cache após operações em lote
      this._clearCache();
      
      return {
        success: !hasError,
        results: results,
        total: operations.length,
        succeeded: results.filter(function(r) { return r.success; }).length,
        failed: results.filter(function(r) { return !r.success; }).length
      };
    } catch (error) {
      Logger.log('[BaseRepository.batch] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  // ==========================================================================
  // MÉTODOS DE CACHE
  // ==========================================================================
  
  /**
   * Limpa o cache do repository
   * @private
   */
  BaseRepository.prototype._clearCache = function() {
    try {
      // Remove cache de 'all'
      this.cache.remove(this.cachePrefix + 'all');
      
      // Nota: Não é possível remover todos os caches com prefixo no Apps Script
      // Cada ID específico permanecerá em cache até expirar
      
      Logger.log('[BaseRepository] Cache limpo para: ' + this.sheetName);
    } catch (error) {
      Logger.log('[BaseRepository._clearCache] Erro: ' + error.message);
    }
  };
  
  /**
   * Limpa cache de um ID específico
   * @param {string|number} id - ID do registro
   */
  BaseRepository.prototype.clearCacheById = function(id) {
    try {
      var cacheKey = this.cachePrefix + 'id_' + id;
      this.cache.remove(cacheKey);
    } catch (error) {
      Logger.log('[BaseRepository.clearCacheById] Erro: ' + error.message);
    }
  };
  
  // ==========================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ==========================================================================
  
  /**
   * Obtém estatísticas do repository
   * @return {Object} { success: boolean, stats?: Object, error?: string }
   */
  BaseRepository.prototype.getStats = function() {
    try {
      return this.dataService.getStats();
    } catch (error) {
      Logger.log('[BaseRepository.getStats] Erro: ' + error.message);
      return { success: false, error: error.message };
    }
  };
  
  return BaseRepository;
})();

// ============================================================================
// REPOSITORIES ESPECÍFICOS
// ============================================================================

/**
 * @class AlunoRepository
 * @extends BaseRepository
 * @description Repository específico para Alunos
 */
var AlunoRepository = (function() {
  function AlunoRepository() {
    BaseRepository.call(this, SHEET_NAMES.ALUNOS);
  }
  
  // Herda do BaseRepository
  AlunoRepository.prototype = Object.create(BaseRepository.prototype);
  AlunoRepository.prototype.constructor = AlunoRepository;
  
  /**
   * Busca alunos por rota
   * @param {string} rotaId - ID da rota
   * @return {Object}
   */
  AlunoRepository.prototype.findByRota = function(rotaId) {
    return this.findWhere({ rotaId: rotaId });
  };
  
  /**
   * Busca alunos por escola
   * @param {string} escolaNome - Nome da escola
   * @return {Object}
   */
  AlunoRepository.prototype.findByEscola = function(escolaNome) {
    return this.findWhere({ escola: escolaNome });
  };
  
  /**
   * Busca alunos com necessidades especiais
   * @return {Object}
   */
  AlunoRepository.prototype.findComNecessidadesEspeciais = function() {
    return this.findWhere({ necessidadesEspeciais: 'Sim' });
  };
  
  return AlunoRepository;
})();

/**
 * @class RotaRepository
 * @extends BaseRepository
 * @description Repository específico para Rotas
 */
var RotaRepository = (function() {
  function RotaRepository() {
    BaseRepository.call(this, SHEET_NAMES.ROTAS);
  }
  
  RotaRepository.prototype = Object.create(BaseRepository.prototype);
  RotaRepository.prototype.constructor = RotaRepository;
  
  /**
   * Busca rotas por veículo
   * @param {string} veiculoId - ID do veículo
   * @return {Object}
   */
  RotaRepository.prototype.findByVeiculo = function(veiculoId) {
    return this.findWhere({ veiculoId: veiculoId });
  };
  
  /**
   * Busca rotas ativas
   * @return {Object}
   */
  RotaRepository.prototype.findAtivas = function() {
    return this.findWhere({ status: 'Ativa' });
  };
  
  return RotaRepository;
})();

/**
 * @class VeiculoRepository
 * @extends BaseRepository
 * @description Repository específico para Veículos
 */
var VeiculoRepository = (function() {
  function VeiculoRepository() {
    BaseRepository.call(this, SHEET_NAMES.VEICULOS);
  }
  
  VeiculoRepository.prototype = Object.create(BaseRepository.prototype);
  VeiculoRepository.prototype.constructor = VeiculoRepository;
  
  /**
   * Busca veículos disponíveis
   * @return {Object}
   */
  VeiculoRepository.prototype.findDisponiveis = function() {
    return this.findWhere({ status: 'Disponível' });
  };
  
  /**
   * Busca veículo por placa
   * @param {string} placa - Placa do veículo
   * @return {Object}
   */
  VeiculoRepository.prototype.findByPlaca = function(placa) {
    return this.findOne({ placa: placa });
  };
  
  return VeiculoRepository;
})();

/**
 * @class UsuarioRepository
 * @extends BaseRepository
 * @description Repository específico para Usuários
 */
var UsuarioRepository = (function() {
  function UsuarioRepository() {
    BaseRepository.call(this, SHEET_NAMES.USUARIOS);
  }
  
  UsuarioRepository.prototype = Object.create(BaseRepository.prototype);
  UsuarioRepository.prototype.constructor = UsuarioRepository;
  
  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @return {Object}
   */
  UsuarioRepository.prototype.findByEmail = function(email) {
    return this.findOne({ email: email });
  };
  
  /**
   * Busca usuários por função
   * @param {string} funcao - Função do usuário
   * @return {Object}
   */
  UsuarioRepository.prototype.findByFuncao = function(funcao) {
    return this.findWhere({ funcao: funcao });
  };
  
  /**
   * Busca usuários ativos
   * @return {Object}
   */
  UsuarioRepository.prototype.findAtivos = function() {
    return this.findWhere({ status: 'Ativo' });
  };
  
  return UsuarioRepository;
})();

// ============================================================================
// FACTORY DE REPOSITORIES
// ============================================================================

/**
 * @class RepositoryFactory
 * @description Factory para criar repositories
 */
var RepositoryFactory = (function() {
  var instances = {};
  
  return {
    /**
     * Obtém repository para uma entidade
     * @param {string} entityName - Nome da entidade
     * @return {BaseRepository}
     */
    getRepository: function(entityName) {
      // Singleton pattern
      if (instances[entityName]) {
        return instances[entityName];
      }
      
      var repository;
      
      switch (entityName.toLowerCase()) {
        case 'aluno':
        case 'alunos':
          repository = new AlunoRepository();
          break;
        case 'rota':
        case 'rotas':
          repository = new RotaRepository();
          break;
        case 'veiculo':
        case 'veiculos':
          repository = new VeiculoRepository();
          break;
        case 'usuario':
        case 'usuarios':
          repository = new UsuarioRepository();
          break;
        default:
          // Repository genérico
          repository = new BaseRepository(entityName);
      }
      
      instances[entityName] = repository;
      return repository;
    },
    
    /**
     * Limpa instâncias em cache
     */
    clearInstances: function() {
      instances = {};
    }
  };
})();
