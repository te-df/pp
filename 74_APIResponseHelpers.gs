/**
 * @file APIResponseHelpers.gs
 * @description Helpers para criar respostas estruturadas para o frontend
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Padroniza respostas do backend para google.script.run
 */

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

/**
 * Cria resposta de sucesso
 * 
 * @param {*} data - Dados
 * @param {string} [message] - Mensagem
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function getUsers() {
 *   try {
 *     var users = fetchUsers();
 *     return apiSuccess(users, 'Usuários carregados');
 *   } catch (error) {
 *     return apiError(error);
 *   }
 * }
 */
function apiSuccess(data, message) {
  return {
    success: true,
    data: data,
    message: message || 'Operação realizada com sucesso',
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta de erro
 * 
 * @param {Error|string} error - Erro
 * @param {string} [type] - Tipo do erro
 * @param {Object} [details] - Detalhes
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function deleteUser(id) {
 *   try {
 *     if (!id) {
 *       return apiError('ID obrigatório', 'VALIDATION');
 *     }
 *     // ...
 *   } catch (error) {
 *     return apiError(error);
 *   }
 * }
 */
function apiError(error, type, details) {
  var message = typeof error === 'string' ? error : error.message;
  var errorType = type || (error.type ? error.type : 'SERVER_ERROR');
  
  return {
    success: false,
    error: message,
    errorType: errorType,
    details: details || (error.details ? error.details : {}),
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta de validação
 * 
 * @param {string} message - Mensagem
 * @param {Object} errors - Erros de validação
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function createUser(data) {
 *   if (!data.email) {
 *     return apiValidationError('Dados inválidos', { email: 'Email obrigatório' });
 *   }
 * }
 */
function apiValidationError(message, errors) {
  return {
    success: false,
    error: message,
    errorType: 'VALIDATION',
    details: { errors: errors },
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta de não encontrado
 * 
 * @param {string} resource - Recurso
 * @param {string} id - ID
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function getUser(id) {
 *   var user = findUser(id);
 *   if (!user) {
 *     return apiNotFound('Usuário', id);
 *   }
 *   return apiSuccess(user);
 * }
 */
function apiNotFound(resource, id) {
  return {
    success: false,
    error: resource + ' não encontrado',
    errorType: 'NOT_FOUND',
    details: { resource: resource, id: id },
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria resposta de permissão negada
 * 
 * @param {string} action - Ação
 * @param {string} [reason] - Motivo
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function deleteUser(id) {
 *   if (!isAdmin()) {
 *     return apiPermissionDenied('deletar usuário', 'apenas administradores');
 *   }
 * }
 */
function apiPermissionDenied(action, reason) {
  return {
    success: false,
    error: 'Permissão negada: ' + action,
    errorType: 'PERMISSION',
    details: { action: action, reason: reason },
    timestamp: new Date().toISOString()
  };
}

/**
 * Wrapper para funções que retornam resposta estruturada
 * 
 * @param {Function} fn - Função a executar
 * @param {string} [functionName] - Nome da função (para log)
 * @return {Object} Resposta estruturada
 * 
 * @example
 * function getUsers() {
 *   return apiWrapper(function() {
 *     var users = fetchUsers();
 *     return users; // Será envolvido em apiSuccess automaticamente
 *   }, 'getUsers');
 * }
 */
function apiWrapper(fn, functionName) {
  try {
    var result = fn();
    
    // Se já é uma resposta estruturada, retorna direto
    if (result && typeof result === 'object' && 'success' in result) {
      return result;
    }
    
    // Envolve em sucesso
    return apiSuccess(result);
    
  } catch (error) {
    // Log do erro
    try {
      getLogger().error('Erro em ' + (functionName || 'função'), {
        error: error.message,
        stack: error.stack
      });
    } catch (e) {
      Logger.log('Erro em ' + (functionName || 'função') + ': ' + error.message);
    }
    
    // Retorna erro estruturado
    return apiError(error);
  }
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo: Função que retorna sucesso
 */
function exampleSuccessFunction() {
  return apiSuccess({ count: 10, items: [] }, 'Dados carregados');
}

/**
 * Exemplo: Função que retorna erro
 */
function exampleErrorFunction() {
  return apiError('Algo deu errado', 'INTERNAL_ERROR');
}

/**
 * Exemplo: Função com validação
 */
function exampleValidationFunction(data) {
  if (!data || !data.name) {
    return apiValidationError('Dados inválidos', {
      name: 'Nome é obrigatório'
    });
  }
  
  return apiSuccess({ id: 1, name: data.name }, 'Criado com sucesso');
}

/**
 * Exemplo: Função com wrapper
 */
function exampleWrapperFunction() {
  return apiWrapper(function() {
    // Lógica da função
    var data = { result: 'ok' };
    return data; // Será envolvido em apiSuccess
  }, 'exampleWrapperFunction');
}

/**
 * Exemplo: Função com try-catch
 */
function exampleTryCatchFunction(id) {
  try {
    // Validação
    if (!id) {
      return apiValidationError('ID obrigatório', { id: 'Campo obrigatório' });
    }
    
    // Busca dados
    var data = findData(id);
    
    // Não encontrado
    if (!data) {
      return apiNotFound('Registro', id);
    }
    
    // Sucesso
    return apiSuccess(data, 'Registro encontrado');
    
  } catch (error) {
    return apiError(error);
  }
}

/**
 * Função auxiliar para exemplo
 */
function findData(id) {
  // Simulação
  return id === '123' ? { id: '123', name: 'Test' } : null;
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa API Response Helpers
 */
function testAPIResponseHelpers() {
  Logger.log('🧪 Testando API Response Helpers...\n');
  
  // Teste 1: Sucesso
  Logger.log('Teste 1: Sucesso');
  var success = apiSuccess({ count: 10 }, 'Teste');
  Logger.log(JSON.stringify(success, null, 2));
  
  // Teste 2: Erro
  Logger.log('\nTeste 2: Erro');
  var error = apiError('Erro de teste', 'TEST_ERROR');
  Logger.log(JSON.stringify(error, null, 2));
  
  // Teste 3: Validação
  Logger.log('\nTeste 3: Validação');
  var validation = apiValidationError('Dados inválidos', { email: 'obrigatório' });
  Logger.log(JSON.stringify(validation, null, 2));
  
  // Teste 4: Not Found
  Logger.log('\nTeste 4: Not Found');
  var notFound = apiNotFound('Usuário', '123');
  Logger.log(JSON.stringify(notFound, null, 2));
  
  // Teste 5: Permission
  Logger.log('\nTeste 5: Permission');
  var permission = apiPermissionDenied('deletar', 'sem permissão');
  Logger.log(JSON.stringify(permission, null, 2));
  
  // Teste 6: Wrapper
  Logger.log('\nTeste 6: Wrapper');
  var wrapped = apiWrapper(function() {
    return { data: 'test' };
  }, 'testFunction');
  Logger.log(JSON.stringify(wrapped, null, 2));
  
  Logger.log('\n✅ Testes concluídos!');
}
