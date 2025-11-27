/**
 * @file Utils.gs
 * @description Funções utilitárias organizadas por categoria
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * 
 * IMPORTANTE: Este arquivo centraliza todas as funções utilitárias do sistema,
 * organizadas em categorias: String, Array, Date, Number, Validation, Format
 * Baseado nas melhores práticas identificadas no TE.txt
 */

// ============================================================================
// STRING UTILS - Utilitários para manipulação de strings
// ============================================================================

/**
 * @namespace StringUtils
 * @description Utilitários para manipulação de strings
 */
const StringUtils = (function() {
  return {
    /**
     * Remove espaços em branco do início e fim
     * @param {string} str - String a processar
     * @return {string}
     */
    trim: function(str) {
      return str ? String(str).trim() : '';
    },
    
    /**
     * Capitaliza primeira letra
     * @param {string} str - String a processar
     * @return {string}
     */
    capitalize: function(str) {
      if (!str) return '';
      str = String(str);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    /**
     * Converte para Title Case
     * @param {string} str - String a processar
     * @return {string}
     */
    titleCase: function(str) {
      if (!str) return '';
      return String(str).toLowerCase().split(' ').map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
    },
    
    /**
     * Converte para slug (URL-friendly)
     * @param {string} str - String a processar
     * @return {string}
     */
    slugify: function(str) {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },
    
    /**
     * Trunca string com ellipsis
     * @param {string} str - String a processar
     * @param {number} maxLength - Tamanho máximo
     * @return {string}
     */
    truncate: function(str, maxLength) {
      if (!str) return '';
      str = String(str);
      maxLength = maxLength || 50;
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    },
    
    /**
     * Remove caracteres especiais
     * @param {string} str - String a processar
     * @return {string}
     */
    sanitize: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/[<>\"']/g, '')
        .trim();
    },
    
    /**
     * Verifica se string está vazia
     * @param {string} str - String a verificar
     * @return {boolean}
     */
    isEmpty: function(str) {
      return !str || String(str).trim() === '';
    },
    
    /**
     * Conta palavras
     * @param {string} str - String a processar
     * @return {number}
     */
    wordCount: function(str) {
      if (!str) return 0;
      return String(str).trim().split(/\s+/).length;
    },
    
    /**
     * Gera string aleatória
     * @param {number} length - Tamanho da string
     * @return {string}
     */
    random: function(length) {
      length = length || 10;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  };
})();

// ============================================================================
// ARRAY UTILS - Utilitários para manipulação de arrays
// ============================================================================

/**
 * @namespace ArrayUtils
 * @description Utilitários para manipulação de arrays
 */
const ArrayUtils = (function() {
  return {
    /**
     * Divide array em chunks
     * @param {Array} array - Array a dividir
     * @param {number} size - Tamanho de cada chunk
     * @return {Array}
     */
    chunk: function(array, size) {
      if (!Array.isArray(array)) return [];
      size = size || 10;
      const chunks = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    },
    
    /**
     * Remove duplicatas
     * @param {Array} array - Array a processar
     * @return {Array}
     */
    unique: function(array) {
      if (!Array.isArray(array)) return [];
      const seen = {};
      return array.filter(function(item) {
        const key = JSON.stringify(item);
        return seen.hasOwnProperty(key) ? false : (seen[key] = true);
      });
    },
    
    /**
     * Agrupa por propriedade
     * @param {Array} array - Array a agrupar
     * @param {string} key - Chave para agrupar
     * @return {Object}
     */
    groupBy: function(array, key) {
      if (!Array.isArray(array)) return {};
      return array.reduce(function(result, item) {
        const group = item[key];
        if (!result[group]) {
          result[group] = [];
        }
        result[group].push(item);
        return result;
      }, {});
    },
    
    /**
     * Ordena array de objetos
     * @param {Array} array - Array a ordenar
     * @param {string} key - Chave para ordenar
     * @param {boolean} desc - Ordem descendente
     * @return {Array}
     */
    sortBy: function(array, key, desc) {
      if (!Array.isArray(array)) return [];
      return array.sort(function(a, b) {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return desc ? 1 : -1;
        if (aVal > bVal) return desc ? -1 : 1;
        return 0;
      });
    },
    
    /**
     * Achata array aninhado
     * @param {Array} array - Array a achatar
     * @return {Array}
     */
    flatten: function(array) {
      if (!Array.isArray(array)) return [];
      return array.reduce(function(flat, item) {
        return flat.concat(Array.isArray(item) ? ArrayUtils.flatten(item) : item);
      }, []);
    },
    
    /**
     * Pega primeiros N elementos
     * @param {Array} array - Array
     * @param {number} n - Quantidade
     * @return {Array}
     */
    take: function(array, n) {
      if (!Array.isArray(array)) return [];
      return array.slice(0, n || 1);
    },
    
    /**
     * Pega últimos N elementos
     * @param {Array} array - Array
     * @param {number} n - Quantidade
     * @return {Array}
     */
    takeLast: function(array, n) {
      if (!Array.isArray(array)) return [];
      return array.slice(-(n || 1));
    },
    
    /**
     * Verifica se array está vazio
     * @param {Array} array - Array a verificar
     * @return {boolean}
     */
    isEmpty: function(array) {
      return !Array.isArray(array) || array.length === 0;
    },
    
    /**
     * Soma valores de uma propriedade
     * @param {Array} array - Array de objetos
     * @param {string} key - Propriedade a somar
     * @return {number}
     */
    sumBy: function(array, key) {
      if (!Array.isArray(array)) return 0;
      return array.reduce(function(sum, item) {
        return sum + (Number(item[key]) || 0);
      }, 0);
    },
    
    /**
     * Conta ocorrências
     * @param {Array} array - Array
     * @param {*} value - Valor a contar
     * @return {number}
     */
    count: function(array, value) {
      if (!Array.isArray(array)) return 0;
      return array.filter(function(item) {
        return item === value;
      }).length;
    }
  };
})();

// ============================================================================
// DATE UTILS - Utilitários para manipulação de datas
// ============================================================================

/**
 * @namespace DateUtils
 * @description Utilitários para manipulação de datas
 */
const DateUtils = (function() {
  return {
    /**
     * Formata data
     * @param {Date|string} date - Data a formatar
     * @param {string} format - Formato (DD/MM/YYYY, YYYY-MM-DD, etc)
     * @return {string}
     */
    format: function(date, format) {
      if (!date) return '';
      
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      
      format = format || 'DD/MM/YYYY';
      
      const day = ('0' + d.getDate()).slice(-2);
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const year = d.getFullYear();
      const hours = ('0' + d.getHours()).slice(-2);
      const minutes = ('0' + d.getMinutes()).slice(-2);
      const seconds = ('0' + d.getSeconds()).slice(-2);
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },
    
    /**
     * Adiciona dias
     * @param {Date} date - Data base
     * @param {number} days - Dias a adicionar
     * @return {Date}
     */
    addDays: function(date, days) {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    },
    
    /**
     * Diferença em dias
     * @param {Date} date1 - Data 1
     * @param {Date} date2 - Data 2
     * @return {number}
     */
    diffDays: function(date1, date2) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diff = Math.abs(d1 - d2);
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Verifica se é hoje
     * @param {Date} date - Data a verificar
     * @return {boolean}
     */
    isToday: function(date) {
      const d = new Date(date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    },
    
    /**
     * Verifica se é passado
     * @param {Date} date - Data a verificar
     * @return {boolean}
     */
    isPast: function(date) {
      return new Date(date) < new Date();
    },
    
    /**
     * Verifica se é futuro
     * @param {Date} date - Data a verificar
     * @return {boolean}
     */
    isFuture: function(date) {
      return new Date(date) > new Date();
    }
  };
})();

// ============================================================================
// NUMBER UTILS - Utilitários para manipulação de números
// ============================================================================

/**
 * @namespace NumberUtils
 * @description Utilitários para manipulação de números
 */
const NumberUtils = (function() {
  return {
    /**
     * Formata como moeda
     * @param {number} value - Valor
     * @param {string} currency - Moeda (BRL, USD)
     * @return {string}
     */
    formatCurrency: function(value, currency) {
      currency = currency || 'BRL';
      value = Number(value) || 0;
      
      if (currency === 'BRL') {
        return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
      
      return value.toFixed(2);
    },
    
    /**
     * Formata como porcentagem
     * @param {number} value - Valor (0-1 ou 0-100)
     * @param {number} decimals - Casas decimais
     * @return {string}
     */
    formatPercent: function(value, decimals) {
      value = Number(value) || 0;
      decimals = decimals || 0;
      
      // Se valor entre 0 e 1, multiplica por 100
      if (value <= 1) {
        value = value * 100;
      }
      
      return value.toFixed(decimals) + '%';
    },
    
    /**
     * Arredonda para N casas decimais
     * @param {number} value - Valor
     * @param {number} decimals - Casas decimais
     * @return {number}
     */
    round: function(value, decimals) {
      decimals = decimals || 0;
      const multiplier = Math.pow(10, decimals);
      return Math.round(value * multiplier) / multiplier;
    },
    
    /**
     * Gera número aleatório
     * @param {number} min - Mínimo
     * @param {number} max - Máximo
     * @return {number}
     */
    random: function(min, max) {
      min = min || 0;
      max = max || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Verifica se é número válido
     * @param {*} value - Valor a verificar
     * @return {boolean}
     */
    isValid: function(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    /**
     * Limita valor entre min e max
     * @param {number} value - Valor
     * @param {number} min - Mínimo
     * @param {number} max - Máximo
     * @return {number}
     */
    clamp: function(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  };
})();

// ============================================================================
// VALIDATION UTILS - Utilitários para validação
// ============================================================================

/**
 * @namespace ValidationUtils
 * @description Utilitários para validação de dados
 */
const ValidationUtils = (function() {
  return {
    /**
     * Valida CPF
     * @param {string} cpf - CPF a validar
     * @return {boolean}
     */
    isValidCPF: function(cpf) {
      if (!cpf) return false;
      
      cpf = String(cpf).replace(/[^\d]/g, '');
      
      if (cpf.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cpf)) return false;
      
      var sum = 0;
      for (var i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      var digit1 = 11 - (sum % 11);
      digit1 = digit1 > 9 ? 0 : digit1;
      
      if (parseInt(cpf.charAt(9)) !== digit1) return false;
      
      sum = 0;
      for (var i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      var digit2 = 11 - (sum % 11);
      digit2 = digit2 > 9 ? 0 : digit2;
      
      return parseInt(cpf.charAt(10)) === digit2;
    },
    
    /**
     * Valida email
     * @param {string} email - Email a validar
     * @return {boolean}
     */
    isValidEmail: function(email) {
      if (!email) return false;
      var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(String(email).toLowerCase());
    },
    
    /**
     * Valida telefone brasileiro
     * @param {string} phone - Telefone a validar
     * @return {boolean}
     */
    isValidPhone: function(phone) {
      if (!phone) return false;
      phone = String(phone).replace(/[^\d]/g, '');
      return phone.length === 10 || phone.length === 11;
    },
    
    /**
     * Valida placa de veículo (Mercosul e antiga)
     * @param {string} plate - Placa a validar
     * @return {boolean}
     */
    isValidPlate: function(plate) {
      if (!plate) return false;
      plate = String(plate).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Placa antiga: ABC1234
      var oldFormat = /^[A-Z]{3}[0-9]{4}$/;
      // Placa Mercosul: ABC1D23
      var newFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
      
      return oldFormat.test(plate) || newFormat.test(plate);
    },
    
    /**
     * Valida CEP
     * @param {string} cep - CEP a validar
     * @return {boolean}
     */
    isValidCEP: function(cep) {
      if (!cep) return false;
      cep = String(cep).replace(/[^\d]/g, '');
      return cep.length === 8;
    },
    
    /**
     * Valida URL
     * @param {string} url - URL a validar
     * @return {boolean}
     */
    isValidURL: function(url) {
      if (!url) return false;
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    }
  };
})();

// ============================================================================
// FORMAT UTILS - Utilitários para formatação
// ============================================================================

/**
 * @namespace FormatUtils
 * @description Utilitários para formatação de dados
 */
const FormatUtils = (function() {
  return {
    /**
     * Formata CPF
     * @param {string} cpf - CPF a formatar
     * @return {string}
     */
    formatCPF: function(cpf) {
      if (!cpf) return '';
      cpf = String(cpf).replace(/[^\d]/g, '');
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },
    
    /**
     * Formata telefone
     * @param {string} phone - Telefone a formatar
     * @return {string}
     */
    formatPhone: function(phone) {
      if (!phone) return '';
      phone = String(phone).replace(/[^\d]/g, '');
      
      if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      
      return phone;
    },
    
    /**
     * Formata CEP
     * @param {string} cep - CEP a formatar
     * @return {string}
     */
    formatCEP: function(cep) {
      if (!cep) return '';
      cep = String(cep).replace(/[^\d]/g, '');
      return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    },
    
    /**
     * Formata placa de veículo
     * @param {string} plate - Placa a formatar
     * @return {string}
     */
    formatPlate: function(plate) {
      if (!plate) return '';
      plate = String(plate).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (plate.length === 7) {
        // Verifica se é Mercosul (4º caractere é letra)
        if (/[A-Z]/.test(plate.charAt(4))) {
          return plate.replace(/([A-Z]{3})([0-9])([A-Z])([0-9]{2})/, '$1-$2$3$4');
        } else {
          return plate.replace(/([A-Z]{3})([0-9]{4})/, '$1-$2');
        }
      }
      
      return plate;
    },
    
    /**
     * Formata bytes para tamanho legível
     * @param {number} bytes - Bytes
     * @param {number} decimals - Casas decimais
     * @return {string}
     */
    formatBytes: function(bytes, decimals) {
      if (bytes === 0) return '0 Bytes';
      
      decimals = decimals || 2;
      var k = 1024;
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    },
    
    /**
     * Formata duração em ms para legível
     * @param {number} ms - Milissegundos
     * @return {string}
     */
    formatDuration: function(ms) {
      if (ms < 1000) return ms + 'ms';
      if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
      if (ms < 3600000) return (ms / 60000).toFixed(1) + 'min';
      return (ms / 3600000).toFixed(1) + 'h';
    }
  };
})();

// ============================================================================
// PERFORMANCE UTILS - Utilitários para performance
// ============================================================================

/**
 * @namespace PerformanceUtils
 * @description Utilitários para otimização de performance
 */
const PerformanceUtils = (function() {
  const timers = {};
  
  return {
    /**
     * Debounce - Executa função após delay sem novas chamadas
     * @param {Function} func - Função a executar
     * @param {number} delay - Delay em ms
     * @return {Function}
     */
    debounce: function(func, delay) {
      let timeoutId;
      return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
          func.apply(context, args);
        }, delay);
      };
    },
    
    /**
     * Throttle - Limita execução a uma vez por intervalo
     * @param {Function} func - Função a executar
     * @param {number} limit - Limite em ms
     * @return {Function}
     */
    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(function() {
            inThrottle = false;
          }, limit);
        }
      };
    },
    
    /**
     * Inicia timer
     * @param {string} label - Label do timer
     */
    startTimer: function(label) {
      timers[label] = new Date().getTime();
    },
    
    /**
     * Para timer e retorna duração
     * @param {string} label - Label do timer
     * @return {number} Duração em ms
     */
    endTimer: function(label) {
      if (!timers[label]) return 0;
      const duration = new Date().getTime() - timers[label];
      delete timers[label];
      return duration;
    },
    
    /**
     * Mede tempo de execução de função
     * @param {Function} func - Função a medir
     * @param {string} label - Label opcional
     * @return {Object} { result, duration }
     */
    measureTime: function(func, label) {
      label = label || 'Function';
      const start = new Date().getTime();
      const result = func();
      const duration = new Date().getTime() - start;
      
      Logger.log('[PerformanceUtils] ' + label + ' executou em ' + duration + 'ms');
      
      return {
        result: result,
        duration: duration
      };
    },
    
    /**
     * Executa em lote para evitar timeout
     * @param {Array} items - Items a processar
     * @param {Function} processor - Função de processamento
     * @param {number} batchSize - Tamanho do lote
     * @return {Array} Resultados
     */
    batchProcess: function(items, processor, batchSize) {
      if (!Array.isArray(items)) return [];
      
      batchSize = batchSize || 100;
      let results = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = batch.map(processor);
        results = results.concat(batchResults);
        
        // Pequena pausa entre lotes
        if (i + batchSize < items.length) {
          Utilities.sleep(100);
        }
      }
      
      return results;
    }
  };
})();

// ============================================================================
// OBJECT UTILS - Utilitários para manipulação de objetos
// ============================================================================

/**
 * @namespace ObjectUtils
 * @description Utilitários para manipulação de objetos
 */
const ObjectUtils = (function() {
  return {
    /**
     * Deep clone de objeto
     * @param {Object} obj - Objeto a clonar
     * @return {Object}
     */
    clone: function(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Merge de objetos
     * @param {Object} target - Objeto alvo
     * @param {Object} source - Objeto fonte
     * @return {Object}
     */
    merge: function(target, source) {
      const result = ObjectUtils.clone(target);
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          result[key] = source[key];
        }
      }
      return result;
    },
    
    /**
     * Pega valor por caminho (ex: 'user.address.city')
     * @param {Object} obj - Objeto
     * @param {string} path - Caminho
     * @param {*} defaultValue - Valor padrão
     * @return {*}
     */
    get: function(obj, path, defaultValue) {
      const keys = path.split('.');
      let result = obj;
      
      for (let i = 0; i < keys.length; i++) {
        if (result === null || result === undefined) {
          return defaultValue;
        }
        result = result[keys[i]];
      }
      
      return result !== undefined ? result : defaultValue;
    },
    
    /**
     * Verifica se objeto está vazio
     * @param {Object} obj - Objeto a verificar
     * @return {boolean}
     */
    isEmpty: function(obj) {
      return !obj || Object.keys(obj).length === 0;
    },
    
    /**
     * Pega chaves do objeto
     * @param {Object} obj - Objeto
     * @return {Array}
     */
    keys: function(obj) {
      return Object.keys(obj || {});
    },
    
    /**
     * Pega valores do objeto
     * @param {Object} obj - Objeto
     * @return {Array}
     */
    values: function(obj) {
      return Object.keys(obj || {}).map(function(key) {
        return obj[key];
      });
    },
    
    /**
     * Filtra objeto por função
     * @param {Object} obj - Objeto
     * @param {Function} predicate - Função de filtro
     * @return {Object}
     */
    filter: function(obj, predicate) {
      const result = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && predicate(obj[key], key)) {
          result[key] = obj[key];
        }
      }
      return result;
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Wrapper global para StringUtils
 */
const Str = StringUtils;

/**
 * Wrapper global para ArrayUtils
 */
const Arr = ArrayUtils;

/**
 * Wrapper global para DateUtils
 */
const Dt = DateUtils;

/**
 * Wrapper global para NumberUtils
 */
const Num = NumberUtils;

/**
 * Wrapper global para ValidationUtils
 */
const Val = ValidationUtils;

/**
 * Wrapper global para FormatUtils
 */
const Fmt = FormatUtils;

/**
 * Wrapper global para PerformanceUtils
 */
const Perf = PerformanceUtils;

/**
 * Wrapper global para ObjectUtils
 */
const Obj = ObjectUtils;

// ============================================================================
// FUNÇÕES DE TESTE
// ============================================================================

/**
 * Testa todos os utilitários
 */
function testUtils() {
  Logger.log('🧪 Testando Utils.gs...\n');
  
  // String Utils
  Logger.log('=== STRING UTILS ===');
  Logger.log('capitalize: ' + StringUtils.capitalize('hello world'));
  Logger.log('slugify: ' + StringUtils.slugify('Hello World 123'));
  Logger.log('truncate: ' + StringUtils.truncate('Lorem ipsum dolor sit amet', 10));
  
  // Array Utils
  Logger.log('\n=== ARRAY UTILS ===');
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  Logger.log('chunk: ' + JSON.stringify(ArrayUtils.chunk(arr, 3)));
  Logger.log('unique: ' + JSON.stringify(ArrayUtils.unique([1, 2, 2, 3, 3, 3])));
  
  // Date Utils
  Logger.log('\n=== DATE UTILS ===');
  const now = new Date();
  Logger.log('format: ' + DateUtils.format(now, 'DD/MM/YYYY HH:mm'));
  Logger.log('addDays: ' + DateUtils.format(DateUtils.addDays(now, 7), 'DD/MM/YYYY'));
  
  // Number Utils
  Logger.log('\n=== NUMBER UTILS ===');
  Logger.log('formatCurrency: ' + NumberUtils.formatCurrency(1234.56));
  Logger.log('formatPercent: ' + NumberUtils.formatPercent(0.75));
  
  // Validation Utils
  Logger.log('\n=== VALIDATION UTILS ===');
  Logger.log('isValidCPF: ' + ValidationUtils.isValidCPF('123.456.789-09'));
  Logger.log('isValidEmail: ' + ValidationUtils.isValidEmail('test@example.com'));
  Logger.log('isValidPlate: ' + ValidationUtils.isValidPlate('ABC-1234'));
  
  // Format Utils
  Logger.log('\n=== FORMAT UTILS ===');
  Logger.log('formatCPF: ' + FormatUtils.formatCPF('12345678909'));
  Logger.log('formatPhone: ' + FormatUtils.formatPhone('11987654321'));
  Logger.log('formatBytes: ' + FormatUtils.formatBytes(1234567));
  
  // Performance Utils
  Logger.log('\n=== PERFORMANCE UTILS ===');
  PerformanceUtils.startTimer('test');
  Utilities.sleep(100);
  Logger.log('Timer: ' + PerformanceUtils.endTimer('test') + 'ms');
  
  // Object Utils
  Logger.log('\n=== OBJECT UTILS ===');
  const obj = { a: 1, b: { c: 2 } };
  Logger.log('clone: ' + JSON.stringify(ObjectUtils.clone(obj)));
  Logger.log('get: ' + ObjectUtils.get(obj, 'b.c', 0));
  
  Logger.log('\n✅ Testes concluídos!');
}

/**
 * Exemplo de uso dos utilitários
 */
function exemploUsoUtils() {
  Logger.log('📚 Exemplo de uso dos Utils\n');
  
  // Usando wrappers curtos
  Logger.log('String capitalize: ' + Str.capitalize('hello'));
  Logger.log('Array unique: ' + JSON.stringify(Arr.unique([1, 1, 2, 3])));
  Logger.log('Date format: ' + Dt.format(new Date(), 'DD/MM/YYYY'));
  Logger.log('Number currency: ' + Num.formatCurrency(1000));
  Logger.log('Validate email: ' + Val.isValidEmail('test@test.com'));
  Logger.log('Format CPF: ' + Fmt.formatCPF('12345678909'));
  
  // Performance
  var result = Perf.measureTime(function() {
    var sum = 0;
    for (var i = 0; i < 1000; i++) {
      sum += i;
    }
    return sum;
  }, 'Sum 1000');
  
  Logger.log('Result: ' + result.result + ' em ' + result.duration + 'ms');
}
