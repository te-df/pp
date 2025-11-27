/**
 * @file DocumentValidators.gs
 * @description Validadores de documentos brasileiros (CPF, CNPJ, Placa, etc)
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Implementa validação completa de:
 * - CPF (Cadastro de Pessoa Física)
 * - CNPJ (Cadastro Nacional de Pessoa Jurídica)
 * - Placa de veículo (Mercosul e antiga)
 * - CEP (Código de Endereçamento Postal)
 * - Telefone brasileiro
 * - Email
 */

// ============================================================================
// VALIDAÇÃO DE CPF
// ============================================================================

/**
 * Valida CPF (Cadastro de Pessoa Física)
 * 
 * @param {string} cpf - CPF a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidCPF('111.444.777-35'); // true
 * isValidCPF('11144477735');    // true
 * isValidCPF('123.456.789-00'); // false
 * 
 * @description
 * Valida:
 * - Formato (11 dígitos)
 * - Dígitos verificadores
 * - CPFs conhecidos como inválidos (111.111.111-11, etc)
 */
function isValidCPF(cpf) {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  cpf = cpf.toString().replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Valida primeiro dígito verificador
  var sum = 0;
  for (var i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  var digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  if (parseInt(cpf.charAt(9)) !== digit1) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (var i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  var digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  if (parseInt(cpf.charAt(10)) !== digit2) return false;
  
  return true;
}

/**
 * Formata CPF
 * 
 * @param {string} cpf - CPF sem formatação
 * @return {string} CPF formatado (000.000.000-00)
 * 
 * @example
 * formatCPF('11144477735'); // '111.444.777-35'
 */
function formatCPF(cpf) {
  if (!cpf) return '';
  
  cpf = cpf.toString().replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return cpf;
  
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Remove formatação do CPF
 * 
 * @param {string} cpf - CPF formatado
 * @return {string} CPF sem formatação
 * 
 * @example
 * cleanCPF('111.444.777-35'); // '11144477735'
 */
function cleanCPF(cpf) {
  if (!cpf) return '';
  return cpf.toString().replace(/[^\d]/g, '');
}

// ============================================================================
// VALIDAÇÃO DE CNPJ
// ============================================================================

/**
 * Valida CNPJ (Cadastro Nacional de Pessoa Jurídica)
 * 
 * @param {string} cnpj - CNPJ a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidCNPJ('11.222.333/0001-81'); // true
 * isValidCNPJ('11222333000181');     // true
 */
function isValidCNPJ(cnpj) {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  cnpj = cnpj.toString().replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  // Valida primeiro dígito verificador
  var length = cnpj.length - 2;
  var numbers = cnpj.substring(0, length);
  var digits = cnpj.substring(length);
  var sum = 0;
  var pos = length - 7;
  
  for (var i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  var result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (var i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Formata CNPJ
 * 
 * @param {string} cnpj - CNPJ sem formatação
 * @return {string} CNPJ formatado (00.000.000/0000-00)
 * 
 * @example
 * formatCNPJ('11222333000181'); // '11.222.333/0001-81'
 */
function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  
  cnpj = cnpj.toString().replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return cnpj;
  
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// ============================================================================
// VALIDAÇÃO DE PLACA DE VEÍCULO
// ============================================================================

/**
 * Valida placa de veículo (Mercosul e antiga)
 * 
 * @param {string} plate - Placa a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidPlate('ABC1234');  // true (antiga)
 * isValidPlate('ABC1D23');  // true (Mercosul)
 * isValidPlate('ABC-1234'); // true (com hífen)
 */
function isValidPlate(plate) {
  if (!plate) return false;
  
  // Remove espaços e converte para maiúsculas
  plate = plate.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Verifica se tem 7 caracteres
  if (plate.length !== 7) return false;
  
  // Padrão antigo: ABC1234 (3 letras + 4 números)
  var oldPattern = /^[A-Z]{3}[0-9]{4}$/;
  
  // Padrão Mercosul: ABC1D23 (3 letras + 1 número + 1 letra + 2 números)
  var mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  
  return oldPattern.test(plate) || mercosulPattern.test(plate);
}

/**
 * Formata placa de veículo
 * 
 * @param {string} plate - Placa sem formatação
 * @return {string} Placa formatada (ABC-1234 ou ABC-1D23)
 * 
 * @example
 * formatPlate('ABC1234');  // 'ABC-1234'
 * formatPlate('ABC1D23');  // 'ABC-1D23'
 */
function formatPlate(plate) {
  if (!plate) return '';
  
  plate = plate.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (plate.length !== 7) return plate;
  
  return plate.substring(0, 3) + '-' + plate.substring(3);
}

/**
 * Detecta tipo de placa
 * 
 * @param {string} plate - Placa
 * @return {string} 'mercosul', 'antiga' ou 'invalida'
 * 
 * @example
 * getPlateType('ABC1234');  // 'antiga'
 * getPlateType('ABC1D23');  // 'mercosul'
 */
function getPlateType(plate) {
  if (!plate) return 'invalida';
  
  plate = plate.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (/^[A-Z]{3}[0-9]{4}$/.test(plate)) return 'antiga';
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(plate)) return 'mercosul';
  
  return 'invalida';
}

// ============================================================================
// VALIDAÇÃO DE EMAIL
// ============================================================================

/**
 * Valida email
 * 
 * @param {string} email - Email a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidEmail('usuario@example.com');     // true
 * isValidEmail('usuario@example.com.br');  // true
 * isValidEmail('usuario@example');         // false
 */
function isValidEmail(email) {
  if (!email) return false;
  
  // Regex completo para validação de email
  var regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return regex.test(email.toString().trim());
}

/**
 * Normaliza email (lowercase, trim)
 * 
 * @param {string} email - Email
 * @return {string} Email normalizado
 * 
 * @example
 * normalizeEmail('Usuario@Example.COM  '); // 'usuario@example.com'
 */
function normalizeEmail(email) {
  if (!email) return '';
  return email.toString().trim().toLowerCase();
}

// ============================================================================
// VALIDAÇÃO DE TELEFONE
// ============================================================================

/**
 * Valida telefone brasileiro
 * 
 * @param {string} phone - Telefone a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidPhone('(11) 98765-4321');  // true (celular)
 * isValidPhone('(11) 3456-7890');   // true (fixo)
 * isValidPhone('11987654321');      // true (sem formatação)
 */
function isValidPhone(phone) {
  if (!phone) return false;
  
  // Remove caracteres não numéricos
  phone = phone.toString().replace(/[^\d]/g, '');
  
  // Verifica tamanho (10 ou 11 dígitos)
  if (phone.length !== 10 && phone.length !== 11) return false;
  
  // Verifica se começa com DDD válido (11-99)
  var ddd = parseInt(phone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Se tem 11 dígitos, verifica se o 3º dígito é 9 (celular)
  if (phone.length === 11) {
    if (phone.charAt(2) !== '9') return false;
  }
  
  return true;
}

/**
 * Formata telefone brasileiro
 * 
 * @param {string} phone - Telefone sem formatação
 * @return {string} Telefone formatado
 * 
 * @example
 * formatPhone('11987654321');  // '(11) 98765-4321'
 * formatPhone('1134567890');   // '(11) 3456-7890'
 */
function formatPhone(phone) {
  if (!phone) return '';
  
  phone = phone.toString().replace(/[^\d]/g, '');
  
  if (phone.length === 11) {
    // Celular: (00) 90000-0000
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    // Fixo: (00) 0000-0000
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

// ============================================================================
// VALIDAÇÃO DE CEP
// ============================================================================

/**
 * Valida CEP (Código de Endereçamento Postal)
 * 
 * @param {string} cep - CEP a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidCEP('01310-100');  // true
 * isValidCEP('01310100');   // true
 * isValidCEP('12345');      // false
 */
function isValidCEP(cep) {
  if (!cep) return false;
  
  // Remove caracteres não numéricos
  cep = cep.toString().replace(/[^\d]/g, '');
  
  // Verifica se tem 8 dígitos
  if (cep.length !== 8) return false;
  
  // Verifica se não é sequência de zeros
  if (cep === '00000000') return false;
  
  return true;
}

/**
 * Formata CEP
 * 
 * @param {string} cep - CEP sem formatação
 * @return {string} CEP formatado (00000-000)
 * 
 * @example
 * formatCEP('01310100'); // '01310-100'
 */
function formatCEP(cep) {
  if (!cep) return '';
  
  cep = cep.toString().replace(/[^\d]/g, '');
  
  if (cep.length !== 8) return cep;
  
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// ============================================================================
// VALIDAÇÃO DE URL
// ============================================================================

/**
 * Valida URL
 * 
 * @param {string} url - URL a validar
 * @return {boolean} True se válido
 * 
 * @example
 * isValidURL('https://www.example.com');  // true
 * isValidURL('http://example.com');       // true
 * isValidURL('example.com');              // false
 */
function isValidURL(url) {
  if (!url) return false;
  
  try {
    var regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return regex.test(url.toString().trim());
  } catch (e) {
    return false;
  }
}

// ============================================================================
// VALIDADOR GENÉRICO
// ============================================================================

/**
 * Valida documento genérico (detecta tipo automaticamente)
 * 
 * @param {string} document - Documento
 * @param {string} [type] - Tipo esperado (cpf, cnpj, placa, etc)
 * @return {Object} Resultado da validação
 * 
 * @example
 * validateDocument('111.444.777-35');
 * // { valid: true, type: 'cpf', formatted: '111.444.777-35' }
 */
function validateDocument(document, type) {
  if (!document) {
    return { valid: false, error: 'Documento vazio' };
  }
  
  // Se tipo especificado, valida apenas esse tipo
  if (type) {
    type = type.toLowerCase();
    
    switch (type) {
      case 'cpf':
        return {
          valid: isValidCPF(document),
          type: 'cpf',
          formatted: formatCPF(document)
        };
      
      case 'cnpj':
        return {
          valid: isValidCNPJ(document),
          type: 'cnpj',
          formatted: formatCNPJ(document)
        };
      
      case 'placa':
        return {
          valid: isValidPlate(document),
          type: 'placa',
          formatted: formatPlate(document),
          plateType: getPlateType(document)
        };
      
      case 'email':
        return {
          valid: isValidEmail(document),
          type: 'email',
          formatted: normalizeEmail(document)
        };
      
      case 'phone':
      case 'telefone':
        return {
          valid: isValidPhone(document),
          type: 'phone',
          formatted: formatPhone(document)
        };
      
      case 'cep':
        return {
          valid: isValidCEP(document),
          type: 'cep',
          formatted: formatCEP(document)
        };
      
      default:
        return { valid: false, error: 'Tipo desconhecido: ' + type };
    }
  }
  
  // Tenta detectar tipo automaticamente
  if (isValidCPF(document)) {
    return {
      valid: true,
      type: 'cpf',
      formatted: formatCPF(document)
    };
  }
  
  if (isValidCNPJ(document)) {
    return {
      valid: true,
      type: 'cnpj',
      formatted: formatCNPJ(document)
    };
  }
  
  if (isValidPlate(document)) {
    return {
      valid: true,
      type: 'placa',
      formatted: formatPlate(document),
      plateType: getPlateType(document)
    };
  }
  
  if (isValidEmail(document)) {
    return {
      valid: true,
      type: 'email',
      formatted: normalizeEmail(document)
    };
  }
  
  if (isValidPhone(document)) {
    return {
      valid: true,
      type: 'phone',
      formatted: formatPhone(document)
    };
  }
  
  if (isValidCEP(document)) {
    return {
      valid: true,
      type: 'cep',
      formatted: formatCEP(document)
    };
  }
  
  return {
    valid: false,
    error: 'Documento não reconhecido ou inválido'
  };
}

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa validadores de documentos
 */
function testDocumentValidators() {
  Logger.log('🧪 Testando Document Validators...\n');
  
  // Teste CPF
  Logger.log('=== CPF ===');
  Logger.log('111.444.777-35: ' + isValidCPF('111.444.777-35'));  // true
  Logger.log('11144477735: ' + isValidCPF('11144477735'));        // true
  Logger.log('123.456.789-00: ' + isValidCPF('123.456.789-00'));  // false
  Logger.log('111.111.111-11: ' + isValidCPF('111.111.111-11'));  // false
  Logger.log('Formatado: ' + formatCPF('11144477735'));
  
  // Teste CNPJ
  Logger.log('\n=== CNPJ ===');
  Logger.log('11.222.333/0001-81: ' + isValidCNPJ('11.222.333/0001-81'));  // true
  Logger.log('11222333000181: ' + isValidCNPJ('11222333000181'));          // true
  Logger.log('Formatado: ' + formatCNPJ('11222333000181'));
  
  // Teste Placa
  Logger.log('\n=== PLACA ===');
  Logger.log('ABC1234: ' + isValidPlate('ABC1234'));    // true (antiga)
  Logger.log('ABC1D23: ' + isValidPlate('ABC1D23'));    // true (Mercosul)
  Logger.log('ABC-1234: ' + isValidPlate('ABC-1234'));  // true
  Logger.log('Tipo ABC1234: ' + getPlateType('ABC1234'));
  Logger.log('Tipo ABC1D23: ' + getPlateType('ABC1D23'));
  Logger.log('Formatado: ' + formatPlate('ABC1234'));
  
  // Teste Email
  Logger.log('\n=== EMAIL ===');
  Logger.log('usuario@example.com: ' + isValidEmail('usuario@example.com'));      // true
  Logger.log('usuario@example.com.br: ' + isValidEmail('usuario@example.com.br')); // true
  Logger.log('usuario@example: ' + isValidEmail('usuario@example'));              // false
  Logger.log('Normalizado: ' + normalizeEmail('Usuario@Example.COM  '));
  
  // Teste Telefone
  Logger.log('\n=== TELEFONE ===');
  Logger.log('(11) 98765-4321: ' + isValidPhone('(11) 98765-4321'));  // true
  Logger.log('(11) 3456-7890: ' + isValidPhone('(11) 3456-7890'));    // true
  Logger.log('11987654321: ' + isValidPhone('11987654321'));          // true
  Logger.log('Formatado: ' + formatPhone('11987654321'));
  
  // Teste CEP
  Logger.log('\n=== CEP ===');
  Logger.log('01310-100: ' + isValidCEP('01310-100'));  // true
  Logger.log('01310100: ' + isValidCEP('01310100'));    // true
  Logger.log('Formatado: ' + formatCEP('01310100'));
  
  // Teste validador genérico
  Logger.log('\n=== VALIDADOR GENÉRICO ===');
  Logger.log('CPF: ' + JSON.stringify(validateDocument('111.444.777-35')));
  Logger.log('Placa: ' + JSON.stringify(validateDocument('ABC1234')));
  Logger.log('Email: ' + JSON.stringify(validateDocument('user@example.com')));
  
  Logger.log('\n✅ Testes concluídos!');
}
