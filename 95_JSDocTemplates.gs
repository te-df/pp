/**
 * @file JSDocTemplates.gs
 * @description Templates e guia de JSDoc para o projeto
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * 
 * Este arquivo contém templates e exemplos de documentação JSDoc
 * para padronizar a documentação em todo o projeto.
 */

// ============================================================================
// GUIA DE JSDOC - TAGS PRINCIPAIS
// ============================================================================

/**
 * TAGS OBRIGATÓRIAS:
 * 
 * @file        - Nome e descrição do arquivo
 * @description - Descrição detalhada
 * @version     - Versão do arquivo/módulo
 * @author      - Autor do código
 * 
 * @param       - Parâmetro de função
 * @return      - Valor de retorno
 * @throws      - Exceções lançadas
 * 
 * @type        - Tipo de variável
 * @typedef     - Define tipo customizado
 * @property    - Propriedade de objeto
 * 
 * @class       - Define classe
 * @constructor - Construtor de classe
 * @extends     - Herança de classe
 * 
 * @namespace   - Define namespace
 * @memberof    - Membro de namespace/classe
 * 
 * @example     - Exemplo de uso
 * @see         - Referência relacionada
 * @since       - Versão de introdução
 * @deprecated  - Marcado como obsoleto
 */

// ============================================================================
// TEMPLATE 1: ARQUIVO
// ============================================================================

/**
 * @file NomeDoArquivo.gs
 * @description Descrição breve do propósito do arquivo
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * @example
 * // Como usar este arquivo
 * var service = new MinhaClasse();
 * var result = service.metodo();
 */

// ============================================================================
// TEMPLATE 2: FUNÇÃO SIMPLES
// ============================================================================

/**
 * Descrição breve da função (uma linha)
 * 
 * Descrição detalhada da função, explicando o que ela faz,
 * quando usar, e qualquer informação importante.
 * 
 * @param {string} param1 - Descrição do primeiro parâmetro
 * @param {number} param2 - Descrição do segundo parâmetro
 * @param {Object} [options] - Parâmetro opcional
 * @param {boolean} [options.flag=false] - Flag opcional
 * @return {Object} Objeto com resultado
 * @return {boolean} return.success - Se operação foi bem-sucedida
 * @return {string} [return.error] - Mensagem de erro (se houver)
 * @return {*} [return.data] - Dados retornados
 * 
 * @throws {Error} Se parâmetros inválidos
 * 
 * @example
 * var result = minhaFuncao('teste', 123);
 * if (result.success) {
 *   console.log(result.data);
 * }
 * 
 * @see outraFuncaoRelacionada
 * @since 1.0.0
 */
function minhaFuncao(param1, param2, options) {
  // Implementação
}

// ============================================================================
// TEMPLATE 3: FUNÇÃO COM TIPOS COMPLEXOS
// ============================================================================

/**
 * @typedef {Object} Aluno
 * @property {string} id - ID único do aluno
 * @property {string} nome - Nome completo
 * @property {string} cpf - CPF formatado
 * @property {Date} dataNascimento - Data de nascimento
 * @property {string} escola - Nome da escola
 * @property {string} [rotaId] - ID da rota (opcional)
 * @property {boolean} necessidadesEspeciais - Tem necessidades especiais
 */

/**
 * Busca alunos com filtros
 * 
 * @param {Object} filters - Filtros de busca
 * @param {string} [filters.escola] - Filtrar por escola
 * @param {string} [filters.rota] - Filtrar por rota
 * @param {boolean} [filters.ativo] - Filtrar por status
 * @return {Object} Resultado da busca
 * @return {boolean} return.success - Sucesso da operação
 * @return {Aluno[]} [return.data] - Array de alunos encontrados
 * @return {number} [return.count] - Quantidade de alunos
 * @return {string} [return.error] - Mensagem de erro
 * 
 * @example
 * var result = buscarAlunos({ escola: 'Escola ABC', ativo: true });
 * console.log('Encontrados:', result.count, 'alunos');
 */
function buscarAlunos(filters) {
  // Implementação
}

// ============================================================================
// TEMPLATE 4: CLASSE
// ============================================================================

/**
 * @class MinhaClasse
 * @description Descrição da classe e seu propósito
 * 
 * @example
 * var instance = new MinhaClasse('config');
 * var result = instance.metodo();
 * 
 * @since 1.0.0
 */
var MinhaClasse = (function() {
  
  /**
   * Construtor da classe
   * 
   * @constructor
   * @param {string} config - Configuração inicial
   * @throws {Error} Se configuração inválida
   */
  function MinhaClasse(config) {
    if (!config) {
      throw new Error('Configuração é obrigatória');
    }
    this.config = config;
  }
  
  /**
   * Método público da classe
   * 
   * @memberof MinhaClasse
   * @param {string} param - Parâmetro do método
   * @return {Object} Resultado
   * 
   * @example
   * var instance = new MinhaClasse('config');
   * var result = instance.metodo('teste');
   */
  MinhaClasse.prototype.metodo = function(param) {
    // Implementação
  };
  
  /**
   * Método privado (convenção com _)
   * 
   * @private
   * @memberof MinhaClasse
   * @param {*} data - Dados a processar
   * @return {*} Dados processados
   */
  MinhaClasse.prototype._metodoPrivado = function(data) {
    // Implementação
  };
  
  return MinhaClasse;
})();

// ============================================================================
// TEMPLATE 5: NAMESPACE/MÓDULO
// ============================================================================

/**
 * @namespace MeuModulo
 * @description Módulo com funções utilitárias
 * 
 * @example
 * var result = MeuModulo.funcao1('teste');
 * var formatted = MeuModulo.funcao2(123);
 */
var MeuModulo = (function() {
  return {
    /**
     * Primeira função do módulo
     * 
     * @memberof MeuModulo
     * @param {string} input - Entrada
     * @return {string} Saída processada
     */
    funcao1: function(input) {
      // Implementação
    },
    
    /**
     * Segunda função do módulo
     * 
     * @memberof MeuModulo
     * @param {number} value - Valor a formatar
     * @return {string} Valor formatado
     */
    funcao2: function(value) {
      // Implementação
    }
  };
})();

// ============================================================================
// TEMPLATE 6: CONSTANTES E ENUMS
// ============================================================================

/**
 * @const {Object} MINHAS_CONSTANTES
 * @description Constantes do sistema
 * @readonly
 * 
 * @property {number} MAX_ITEMS - Máximo de items
 * @property {number} TIMEOUT - Timeout em ms
 * @property {string} DEFAULT_VALUE - Valor padrão
 */
var MINHAS_CONSTANTES = {
  MAX_ITEMS: 100,
  TIMEOUT: 5000,
  DEFAULT_VALUE: 'default'
};

/**
 * @enum {string}
 * @description Status possíveis
 * @readonly
 */
var Status = {
  /** Status ativo */
  ATIVO: 'ativo',
  /** Status inativo */
  INATIVO: 'inativo',
  /** Status pendente */
  PENDENTE: 'pendente'
};

// ============================================================================
// TEMPLATE 7: CALLBACK E PROMISES
// ============================================================================

/**
 * @callback SuccessCallback
 * @param {Object} result - Resultado da operação
 * @param {boolean} result.success - Se foi bem-sucedido
 * @param {*} result.data - Dados retornados
 */

/**
 * @callback ErrorCallback
 * @param {Error} error - Erro ocorrido
 */

/**
 * Executa operação assíncrona
 * 
 * @param {string} operation - Nome da operação
 * @param {SuccessCallback} onSuccess - Callback de sucesso
 * @param {ErrorCallback} onError - Callback de erro
 * 
 * @example
 * executarAsync('getData', 
 *   function(result) { console.log(result.data); },
 *   function(error) { console.error(error); }
 * );
 */
function executarAsync(operation, onSuccess, onError) {
  // Implementação
}

// ============================================================================
// TEMPLATE 8: FUNÇÃO DEPRECATED
// ============================================================================

/**
 * Função antiga (não usar mais)
 * 
 * @deprecated Desde v2.0.0 - Use novaFuncao() ao invés
 * @param {string} param - Parâmetro
 * @return {string} Resultado
 * 
 * @see novaFuncao
 */
function funcaoAntiga(param) {
  Logger.log('AVISO: funcaoAntiga() está deprecated. Use novaFuncao()');
  return novaFuncao(param);
}

// ============================================================================
// TEMPLATE 9: FUNÇÃO COM MÚLTIPLOS RETORNOS
// ============================================================================

/**
 * Função que pode retornar diferentes tipos
 * 
 * @param {string} type - Tipo de retorno desejado
 * @return {(string|number|Object)} Retorno baseado no tipo
 * 
 * @example
 * var str = funcaoMultipla('string');  // retorna string
 * var num = funcaoMultipla('number');  // retorna number
 * var obj = funcaoMultipla('object');  // retorna object
 */
function funcaoMultipla(type) {
  switch(type) {
    case 'string': return 'texto';
    case 'number': return 123;
    case 'object': return { key: 'value' };
  }
}

// ============================================================================
// TEMPLATE 10: FUNÇÃO GOOGLE APPS SCRIPT
// ============================================================================

/**
 * Função chamada pelo frontend via google.script.run
 * 
 * @param {Object} params - Parâmetros da requisição
 * @param {string} params.action - Ação a executar
 * @param {Object} [params.data] - Dados da requisição
 * @return {Object} Resposta padronizada
 * @return {boolean} return.success - Status da operação
 * @return {*} [return.data] - Dados de resposta
 * @return {string} [return.error] - Mensagem de erro
 * @return {string} [return.message] - Mensagem informativa
 * 
 * @example
 * // No frontend:
 * google.script.run
 *   .withSuccessHandler(function(result) {
 *     if (result.success) {
 *       console.log(result.data);
 *     }
 *   })
 *   .minhaFuncaoGAS({ action: 'getData', data: { id: 123 } });
 */
function minhaFuncaoGAS(params) {
  try {
    // Validação
    if (!params || !params.action) {
      return { success: false, error: 'Ação não especificada' };
    }
    
    // Processamento
    var result = processarAcao(params.action, params.data);
    
    return {
      success: true,
      data: result,
      message: 'Operação concluída com sucesso'
    };
    
  } catch (error) {
    Logger.log('[minhaFuncaoGAS] Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
