/**
 * @file DataMaskingService.gs
 * @description Serviço de Mascaramento de Dados Sensíveis - Conformidade LGPD
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-23
 * 
 * Implementa mascaramento de dados pessoais conforme LGPD (Lei 13.709/2018)
 * Baseado nas melhores práticas de pseudonimização e minimização de dados
 */

// ============================================================================
// DATA MASKING SERVICE - MASCARAMENTO DE DADOS SENSÍVEIS
// ============================================================================

/**
 * @class DataMaskingService
 * @description Serviço centralizado para mascaramento de dados pessoais
 * 
 * Regras LGPD implementadas:
 * - Pseudonimização de CPF (mantém apenas dígitos centrais)
 * - Minimização de nomes (apenas iniciais)
 * - Mascaramento de emails (mantém domínio)
 * - Mascaramento de telefones (mantém DDD)
 */
var DataMaskingService = (function() {
  
  /**
   * Configurações de mascaramento
   */
  var MASK_CONFIG = {
    CPF: {
      SHOW_MIDDLE_DIGITS: true,
      MASK_CHAR: '*',
      FORMAT: '***.XXX.XXX-**'
    },
    NOME: {
      SHOW_INITIALS: true,
      SEPARATOR: '. '
    },
    EMAIL: {
      SHOW_DOMAIN: true,
      MASK_CHAR: '*',
      MIN_VISIBLE_CHARS: 2
    },
    TELEFONE: {
      SHOW_DDD: true,
      MASK_CHAR: '*'
    }
  };
  
  return {
    /**
     * Mascara um CPF mantendo apenas os dígitos centrais
     * 
     * @memberof DataMaskingService
     * @param {string} cpf - CPF a ser mascarado
     * @return {string} CPF mascarado
     * 
     * @example
     * DataMaskingService.maskCPF('123.456.789-10')
     * // Retorna: '***.456.789-**'
     * 
     * @example
     * DataMaskingService.maskCPF('12345678910')
     * // Retorna: '***.456.789-**'
     * 
     * @since 1.0.0
     */
    maskCPF: function(cpf) {
      try {
        // Valida entrada
        if (!cpf || cpf === null || cpf === undefined) {
          return '***.***.***-**';
        }
        
        // Remove formatação
        var cpfStr = cpf.toString().replace(/\D/g, '');
        
        // Valida tamanho
        if (cpfStr.length !== 11) {
          return '***.***.***-**';
        }
        
        // Extrai dígitos do meio (posições 3-8)
        var meio = cpfStr.substring(3, 9);
        
        // Formata: ***.XXX.XXX-**
        return '***.' + meio.substring(0, 3) + '.' + meio.substring(3, 6) + '-**';
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar CPF: ' + error.message);
        return '***.***.***-**';
      }
    },
    
    /**
     * Mascara um nome mantendo apenas as iniciais
     * 
     * @memberof DataMaskingService
     * @param {string} nome - Nome completo a ser mascarado
     * @return {string} Nome mascarado com iniciais
     * 
     * @example
     * DataMaskingService.maskNome('João Silva Santos')
     * // Retorna: 'J. S. S.'
     * 
     * @example
     * DataMaskingService.maskNome('Maria')
     * // Retorna: 'M.'
     * 
     * @since 1.0.0
     */
    maskNome: function(nome) {
      try {
        // Valida entrada
        if (!nome || !nome.toString().trim()) {
          return '';
        }
        
        // Normaliza espaços
        var nomeStr = nome.toString().trim().replace(/\s+/g, ' ');
        
        // Divide em palavras
        var palavras = nomeStr.split(' ');
        
        // Extrai iniciais
        var iniciais = palavras
          .filter(function(p) { return p.length > 0; })
          .map(function(p) { return p.charAt(0).toUpperCase() + '.'; });
        
        return iniciais.join(' ');
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar nome: ' + error.message);
        return '';
      }
    },
    
    /**
     * Mascara um email mantendo o domínio
     * 
     * @memberof DataMaskingService
     * @param {string} email - Email a ser mascarado
     * @return {string} Email mascarado
     * 
     * @example
     * DataMaskingService.maskEmail('joao.silva@exemplo.com')
     * // Retorna: 'jo***@exemplo.com'
     * 
     * @since 1.0.0
     */
    maskEmail: function(email) {
      try {
        // Valida entrada
        if (!email || !email.toString().includes('@')) {
          return '***@***.***';
        }
        
        var emailStr = email.toString().trim();
        var partes = emailStr.split('@');
        
        if (partes.length !== 2) {
          return '***@***.***';
        }
        
        var usuario = partes[0];
        var dominio = partes[1];
        
        // Mantém primeiros 2 caracteres do usuário
        var visivel = usuario.substring(0, Math.min(2, usuario.length));
        var mascarado = visivel + '***';
        
        return mascarado + '@' + dominio;
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar email: ' + error.message);
        return '***@***.***';
      }
    },
    
    /**
     * Mascara um telefone mantendo o DDD
     * 
     * @memberof DataMaskingService
     * @param {string} telefone - Telefone a ser mascarado
     * @return {string} Telefone mascarado
     * 
     * @example
     * DataMaskingService.maskTelefone('(61) 98765-4321')
     * // Retorna: '(61) *****-****'
     * 
     * @since 1.0.0
     */
    maskTelefone: function(telefone) {
      try {
        // Valida entrada
        if (!telefone) {
          return '(**) *****-****';
        }
        
        var telStr = telefone.toString().replace(/\D/g, '');
        
        // Valida tamanho (10 ou 11 dígitos)
        if (telStr.length < 10 || telStr.length > 11) {
          return '(**) *****-****';
        }
        
        // Extrai DDD
        var ddd = telStr.substring(0, 2);
        
        // Formata com DDD visível
        if (telStr.length === 11) {
          return '(' + ddd + ') *****-****';
        } else {
          return '(' + ddd + ') ****-****';
        }
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar telefone: ' + error.message);
        return '(**) *****-****';
      }
    },
    
    /**
     * Mascara um objeto completo aplicando regras para cada campo
     * 
     * @memberof DataMaskingService
     * @param {Object} data - Objeto com dados a serem mascarados
     * @param {Array<string>} fields - Campos a mascarar (opcional)
     * @return {Object} Objeto com dados mascarados
     * 
     * @example
     * var dados = {
     *   nome: 'João Silva',
     *   cpf: '123.456.789-10',
     *   email: 'joao@exemplo.com'
     * };
     * var mascarado = DataMaskingService.maskObject(dados);
     * // Retorna: { nome: 'J. S.', cpf: '***.456.789-**', email: 'jo***@exemplo.com' }
     * 
     * @since 1.0.0
     */
    maskObject: function(data, fields) {
      try {
        if (!data || typeof data !== 'object') {
          return {};
        }
        
        var masked = {};
        var fieldsToMask = fields || Object.keys(data);
        
        for (var key in data) {
          if (!data.hasOwnProperty(key)) continue;
          
          var value = data[key];
          var lowerKey = key.toLowerCase();
          
          // Aplica mascaramento baseado no nome do campo
          if (lowerKey.includes('cpf')) {
            masked[key] = this.maskCPF(value);
          } else if (lowerKey.includes('nome') || lowerKey.includes('name')) {
            masked[key] = this.maskNome(value);
          } else if (lowerKey.includes('email') || lowerKey.includes('mail')) {
            masked[key] = this.maskEmail(value);
          } else if (lowerKey.includes('telefone') || lowerKey.includes('phone') || lowerKey.includes('celular')) {
            masked[key] = this.maskTelefone(value);
          } else {
            // Mantém valor original para campos não sensíveis
            masked[key] = value;
          }
        }
        
        return masked;
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar objeto: ' + error.message);
        return data;
      }
    },
    
    /**
     * Mascara um array de objetos
     * 
     * @memberof DataMaskingService
     * @param {Array<Object>} dataArray - Array de objetos a serem mascarados
     * @return {Array<Object>} Array com objetos mascarados
     * 
     * @since 1.0.0
     */
    maskArray: function(dataArray) {
      try {
        if (!Array.isArray(dataArray)) {
          return [];
        }
        
        var self = this;
        return dataArray.map(function(item) {
          return self.maskObject(item);
        });
        
      } catch (error) {
        Logger.log('[DataMaskingService] Erro ao mascarar array: ' + error.message);
        return dataArray;
      }
    },
    
    /**
     * Verifica se um valor é sensível e precisa ser mascarado
     * 
     * @memberof DataMaskingService
     * @param {string} fieldName - Nome do campo
     * @return {boolean} true se o campo é sensível
     * 
     * @since 1.0.0
     */
    isSensitiveField: function(fieldName) {
      if (!fieldName) return false;
      
      var lowerName = fieldName.toLowerCase();
      var sensitiveKeywords = ['cpf', 'nome', 'name', 'email', 'mail', 'telefone', 'phone', 'celular', 'senha', 'password'];
      
      return sensitiveKeywords.some(function(keyword) {
        return lowerName.includes(keyword);
      });
    },
    
    /**
     * Obtém configurações de mascaramento
     * 
     * @memberof DataMaskingService
     * @return {Object} Configurações atuais
     * 
     * @since 1.0.0
     */
    getConfig: function() {
      return MASK_CONFIG;
    },
    
    /**
     * Valida se um CPF está mascarado
     * 
     * @memberof DataMaskingService
     * @param {string} cpf - CPF a verificar
     * @return {boolean} true se está mascarado
     * 
     * @since 1.0.0
     */
    isMasked: function(cpf) {
      if (!cpf) return false;
      return cpf.toString().includes('*');
    }
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS (WRAPPERS)
// ============================================================================

/**
 * Mascara CPF (wrapper global)
 * @param {string} cpf - CPF a ser mascarado
 * @return {string} CPF mascarado
 */
function maskCPF(cpf) {
  return DataMaskingService.maskCPF(cpf);
}

/**
 * Mascara nome (wrapper global)
 * @param {string} nome - Nome a ser mascarado
 * @return {string} Nome mascarado
 */
function maskNome(nome) {
  return DataMaskingService.maskNome(nome);
}

/**
 * Mascara email (wrapper global)
 * @param {string} email - Email a ser mascarado
 * @return {string} Email mascarado
 */
function maskEmail(email) {
  return DataMaskingService.maskEmail(email);
}

/**
 * Mascara telefone (wrapper global)
 * @param {string} telefone - Telefone a ser mascarado
 * @return {string} Telefone mascarado
 */
function maskTelefone(telefone) {
  return DataMaskingService.maskTelefone(telefone);
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa o serviço de mascaramento
 */
function testDataMaskingService() {
  Logger.log('🧪 Testando DataMaskingService...\n');
  
  // Teste 1: CPF
  Logger.log('Teste 1: Mascaramento de CPF');
  var cpfTestes = [
    '123.456.789-10',
    '12345678910',
    '986.246.433-49',
    '',
    null
  ];
  
  cpfTestes.forEach(function(cpf) {
    var masked = DataMaskingService.maskCPF(cpf);
    Logger.log('  • ' + (cpf || 'null') + ' → ' + masked);
  });
  
  // Teste 2: Nome
  Logger.log('\nTeste 2: Mascaramento de Nome');
  var nomeTestes = [
    'João Silva Santos',
    'Maria',
    'Helio Pessoa',
    '',
    null
  ];
  
  nomeTestes.forEach(function(nome) {
    var masked = DataMaskingService.maskNome(nome);
    Logger.log('  • ' + (nome || 'null') + ' → ' + masked);
  });
  
  // Teste 3: Email
  Logger.log('\nTeste 3: Mascaramento de Email');
  var emailTestes = [
    'joao.silva@exemplo.com',
    'maria@teste.com.br',
    'a@b.c',
    ''
  ];
  
  emailTestes.forEach(function(email) {
    var masked = DataMaskingService.maskEmail(email);
    Logger.log('  • ' + (email || 'null') + ' → ' + masked);
  });
  
  // Teste 4: Telefone
  Logger.log('\nTeste 4: Mascaramento de Telefone');
  var telTestes = [
    '(61) 98765-4321',
    '61987654321',
    '(11) 3456-7890',
    ''
  ];
  
  telTestes.forEach(function(tel) {
    var masked = DataMaskingService.maskTelefone(tel);
    Logger.log('  • ' + (tel || 'null') + ' → ' + masked);
  });
  
  // Teste 5: Objeto completo
  Logger.log('\nTeste 5: Mascaramento de Objeto');
  var obj = {
    nome: 'João Silva',
    cpf: '123.456.789-10',
    email: 'joao@exemplo.com',
    telefone: '(61) 98765-4321',
    cargo: 'Motorista'
  };
  
  Logger.log('  Original:');
  Logger.log('  ' + JSON.stringify(obj, null, 2));
  
  var masked = DataMaskingService.maskObject(obj);
  Logger.log('  Mascarado:');
  Logger.log('  ' + JSON.stringify(masked, null, 2));
  
  Logger.log('\n✅ Testes concluídos!');
}
