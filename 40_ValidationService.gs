/**
 * @file ValidationService.gs
 * @description Sistema centralizado de validação de dados
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Este arquivo implementa validações centralizadas para todos os dados do sistema.
 */

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

/**
 * @class ValidationService
 * @description Serviço de validação de dados
 */
var ValidationService = (function() {
  
  function ValidationService() {
    this.errors = [];
  }
  
  /**
   * Valida email
   * 
   * @param {string} email - Email para validar
   * @return {boolean} Válido
   */
  ValidationService.prototype.validateEmail = function(email) {
    if (!email) return false;
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  /**
   * Valida CPF
   * 
   * @param {string} cpf - CPF para validar
   * @return {boolean} Válido
   */
  ValidationService.prototype.validateCPF = function(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    var sum = 0;
    var remainder;
    
    for (var i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (var i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };
  
  /**
   * Valida telefone
   * 
   * @param {string} phone - Telefone para validar
   * @return {boolean} Válido
   */
  ValidationService.prototype.validatePhone = function(phone) {
    if (!phone) return false;
    
    // Remove caracteres não numéricos
    phone = phone.replace(/[^\d]/g, '');
    
    // Aceita 10 ou 11 dígitos (com ou sem 9 no celular)
    return phone.length === 10 || phone.length === 11;
  };
  
  /**
   * Valida data
   * 
   * @param {*} date - Data para validar
   * @return {boolean} Válido
   */
  ValidationService.prototype.validateDate = function(date) {
    if (!date) return false;
    
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    // Tenta converter string para data
    var parsed = new Date(date);
    return !isNaN(parsed.getTime());
  };
  
  /**
   * Valida campo obrigatório
   * 
   * @param {*} value - Valor para validar
   * @return {boolean} Válido
   */
  ValidationService.prototype.validateRequired = function(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  };
  
  /**
   * Valida dados contra schema
   * 
   * @param {string} sheetName - Nome da planilha
   * @param {Object} data - Dados para validar
   * @return {Object} Resultado da validação
   */
  ValidationService.prototype.validate = function(sheetName, data) {
    this.errors = [];
    
    try {
      var schemaService = getSchemaService();
      var schema = schemaService.getSchema(sheetName);
      
      if (!schema) {
        this.errors.push('Schema não encontrado para: ' + sheetName);
        return { valid: false, errors: this.errors };
      }
      
      // Valida cada coluna
      schema.columns.forEach(function(col) {
        var value = data[col.name];
        
        // Required
        if (col.required && !this.validateRequired(value)) {
          this.errors.push(col.name + ' é obrigatório');
        }
        
        // Type validation
        if (value !== null && value !== undefined && value !== '') {
          if (col.type === 'date' && !this.validateDate(value)) {
            this.errors.push(col.name + ' deve ser uma data válida');
          } else if (col.type === 'number' && typeof value !== 'number') {
            this.errors.push(col.name + ' deve ser um número');
          } else if (col.type === 'string' && typeof value !== 'string') {
            this.errors.push(col.name + ' deve ser texto');
          }
        }
        
        // Validator
        if (value && col.validator) {
          switch (col.validator) {
            case 'email':
              if (!this.validateEmail(value)) {
                this.errors.push(col.name + ' deve ser um email válido');
              }
              break;
            case 'cpf':
              if (!this.validateCPF(value)) {
                this.errors.push(col.name + ' deve ser um CPF válido');
              }
              break;
            case 'phone':
              if (!this.validatePhone(value)) {
                this.errors.push(col.name + ' deve ser um telefone válido');
              }
              break;
          }
        }
        
        // Enum
        if (col.enum && value && col.enum.indexOf(value) === -1) {
          this.errors.push(col.name + ' deve ser um dos valores: ' + col.enum.join(', '));
        }
      }.bind(this));
      
      return {
        valid: this.errors.length === 0,
        errors: this.errors
      };
      
    } catch (error) {
      this.errors.push('Erro ao validar: ' + error.message);
      return { valid: false, errors: this.errors };
    }
  };
  
  return ValidationService;
})();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém instância global
 * 
 * @return {ValidationService}
 */
function getValidationService() {
  if (typeof globalThis._validationService === 'undefined') {
    globalThis._validationService = new ValidationService();
  }
  return globalThis._validationService;
}

/**
 * Valida dados (wrapper)
 * 
 * @param {string} sheetName - Nome da planilha
 * @param {Object} data - Dados
 * @return {Object} Resultado
 */
function validateData(sheetName, data) {
  return getValidationService().validate(sheetName, data);
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa ValidationService
 */
function testValidationService() {
  Logger.log('🧪 Testando Validation Service...\n');
  
  var validator = new ValidationService();
  
  // Teste 1: Email
  Logger.log('=== Teste 1: Email ===');
  Logger.log('✓ Email válido: ' + validator.validateEmail('teste@email.com'));
  Logger.log('✓ Email inválido: ' + !validator.validateEmail('teste@'));
  
  // Teste 2: CPF
  Logger.log('\n=== Teste 2: CPF ===');
  Logger.log('✓ CPF válido: ' + validator.validateCPF('111.222.333-44'));
  Logger.log('✓ CPF inválido: ' + !validator.validateCPF('123.456.789-00'));
  
  // Teste 3: Telefone
  Logger.log('\n=== Teste 3: Telefone ===');
  Logger.log('✓ Telefone válido: ' + validator.validatePhone('(61) 99999-9999'));
  Logger.log('✓ Telefone inválido: ' + !validator.validatePhone('123'));
  
  // Teste 4: Data
  Logger.log('\n=== Teste 4: Data ===');
  Logger.log('✓ Data válida: ' + validator.validateDate(new Date()));
  Logger.log('✓ Data inválida: ' + !validator.validateDate('data inválida'));
  
  // Teste 5: Validação completa
  Logger.log('\n=== Teste 5: Validação Completa ===');
  var testData = {
    ID: 'USR001',
    Username: 'admin',
    Email: 'admin@teste.com',
    Password_Hash: 'hash123',
    Role: 'Admin',
    Status: 'Ativo',
    Criado_Em: new Date()
  };
  
  var result = validator.validate('Usuarios', testData);
  Logger.log('✓ Válido: ' + result.valid);
  if (!result.valid) {
    Logger.log('Erros: ' + result.errors.join(', '));
  }
  
  Logger.log('\n✅ Testes concluídos!');
}
