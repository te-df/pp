/**
 * @file 00_ConfigValidator.gs
 * @description Validador de configuração do sistema
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2025-11-26
 * 
 * FASE 2 - VALIDAÇÃO DE CONFIGURAÇÃO
 * Valida se todas as chaves obrigatórias existem e têm o tipo correto
 */

/**
 * @class ConfigValidator
 * @description Valida configuração do sistema na inicialização
 */
var ConfigValidator = (function() {
  
  /**
   * Esquema de validação para CONFIG
   */
  var CONFIG_SCHEMA = {
    required: [
      'VERSION',
      'SPREADSHEET_ID',
      'ENVIRONMENT'
    ],
    optional: [
      'COLAB_WEBHOOK_URL',
      'CACHE_DURATION',
      'MAX_RETRIES',
      'RETRY_DELAY',
      'DEBUG_MODE'
    ],
    types: {
      'VERSION': 'string',
      'SPREADSHEET_ID': 'string',
      'ENVIRONMENT': 'string',
      'COLAB_WEBHOOK_URL': 'string',
      'CACHE_DURATION': 'number',
      'MAX_RETRIES': 'number',
      'RETRY_DELAY': 'number',
      'DEBUG_MODE': 'boolean'
    },
    defaults: {
      'CACHE_DURATION': 300,
      'MAX_RETRIES': 3,
      'RETRY_DELAY': 1000,
      'DEBUG_MODE': false,
      'ENVIRONMENT': 'PRODUCTION'
    }
  };
  
  /**
   * Esquema de validação para System
   */
  var SYSTEM_SCHEMA = {
    required: [
      'version',
      'environment'
    ],
    optional: [
      'spreadsheetId',
      'colabWebhookUrl',
      'features',
      'limits'
    ],
    types: {
      'version': 'string',
      'environment': 'string',
      'spreadsheetId': 'string',
      'colabWebhookUrl': 'string'
    }
  };
  
  return {
    /**
     * Valida configuração completa
     * @param {Object} config - Objeto de configuração
     * @param {Object} schema - Esquema de validação
     * @return {Object} {valid: boolean, errors: Array, warnings: Array, config: Object}
     */
    validate: function(config, schema) {
      var errors = [];
      var warnings = [];
      var validatedConfig = {};
      
      // 1. Verifica se config existe
      if (!config || typeof config !== 'object') {
        errors.push({
          field: 'config',
          message: 'Configuração não fornecida ou inválida',
          severity: 'CRITICAL'
        });
        
        return {
          valid: false,
          errors: errors,
          warnings: warnings,
          config: null
        };
      }
      
      // 2. Valida campos obrigatórios
      if (schema.required) {
        for (var i = 0; i < schema.required.length; i++) {
          var field = schema.required[i];
          
          if (!config.hasOwnProperty(field)) {
            errors.push({
              field: field,
              message: `Campo obrigatório ausente: ${field}`,
              severity: 'CRITICAL'
            });
          } else if (config[field] === null || config[field] === undefined || config[field] === '') {
            errors.push({
              field: field,
              message: `Campo obrigatório vazio: ${field}`,
              severity: 'CRITICAL'
            });
          } else {
            validatedConfig[field] = config[field];
          }
        }
      }
      
      // 3. Valida tipos
      if (schema.types) {
        for (var field in schema.types) {
          if (config.hasOwnProperty(field) && config[field] !== null && config[field] !== undefined) {
            var expectedType = schema.types[field];
            var actualType = typeof config[field];
            
            if (actualType !== expectedType) {
              errors.push({
                field: field,
                message: `Campo ${field} deve ser do tipo ${expectedType}, recebido ${actualType}`,
                severity: 'HIGH',
                expected: expectedType,
                actual: actualType
              });
            } else {
              validatedConfig[field] = config[field];
            }
          }
        }
      }
      
      // 4. Aplica valores padrão para campos opcionais
      if (schema.defaults) {
        for (var field in schema.defaults) {
          if (!validatedConfig.hasOwnProperty(field) || validatedConfig[field] === null || validatedConfig[field] === undefined) {
            validatedConfig[field] = schema.defaults[field];
            warnings.push({
              field: field,
              message: `Campo ${field} não configurado, usando valor padrão: ${schema.defaults[field]}`,
              severity: 'LOW'
            });
          }
        }
      }
      
      // 5. Copia campos opcionais que existem
      if (schema.optional) {
        for (var i = 0; i < schema.optional.length; i++) {
          var field = schema.optional[i];
          if (config.hasOwnProperty(field) && !validatedConfig.hasOwnProperty(field)) {
            validatedConfig[field] = config[field];
          }
        }
      }
      
      // 6. Validações específicas
      var specificValidation = this.validateSpecificRules(validatedConfig, errors, warnings);
      
      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        config: validatedConfig
      };
    },
    
    /**
     * Valida regras específicas de negócio
     * @param {Object} config - Configuração validada
     * @param {Array} errors - Array de erros
     * @param {Array} warnings - Array de avisos
     */
    validateSpecificRules: function(config, errors, warnings) {
      // Valida SPREADSHEET_ID
      if (config.SPREADSHEET_ID) {
        if (config.SPREADSHEET_ID.length < 20) {
          errors.push({
            field: 'SPREADSHEET_ID',
            message: 'SPREADSHEET_ID parece inválido (muito curto)',
            severity: 'HIGH'
          });
        }
      }
      
      // Valida VERSION
      if (config.VERSION) {
        var versionPattern = /^\d+\.\d+(\.\d+)?$/;
        if (!versionPattern.test(config.VERSION)) {
          warnings.push({
            field: 'VERSION',
            message: 'VERSION não segue o padrão semântico (ex: 1.0.0)',
            severity: 'LOW'
          });
        }
      }
      
      // Valida ENVIRONMENT
      if (config.ENVIRONMENT) {
        var validEnvironments = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'];
        if (validEnvironments.indexOf(config.ENVIRONMENT) === -1) {
          warnings.push({
            field: 'ENVIRONMENT',
            message: `ENVIRONMENT deve ser um de: ${validEnvironments.join(', ')}`,
            severity: 'MEDIUM'
          });
        }
      }
      
      // Valida COLAB_WEBHOOK_URL
      if (config.COLAB_WEBHOOK_URL) {
        if (!config.COLAB_WEBHOOK_URL.startsWith('http')) {
          errors.push({
            field: 'COLAB_WEBHOOK_URL',
            message: 'COLAB_WEBHOOK_URL deve começar com http:// ou https://',
            severity: 'HIGH'
          });
        }
      } else {
        warnings.push({
          field: 'COLAB_WEBHOOK_URL',
          message: 'COLAB_WEBHOOK_URL não configurado. Integração com Colab não funcionará',
          severity: 'MEDIUM'
        });
      }
      
      // Valida valores numéricos
      if (config.CACHE_DURATION && config.CACHE_DURATION < 0) {
        errors.push({
          field: 'CACHE_DURATION',
          message: 'CACHE_DURATION deve ser maior ou igual a 0',
          severity: 'MEDIUM'
        });
      }
      
      if (config.MAX_RETRIES && config.MAX_RETRIES < 1) {
        errors.push({
          field: 'MAX_RETRIES',
          message: 'MAX_RETRIES deve ser maior ou igual a 1',
          severity: 'MEDIUM'
        });
      }
      
      if (config.RETRY_DELAY && config.RETRY_DELAY < 0) {
        errors.push({
          field: 'RETRY_DELAY',
          message: 'RETRY_DELAY deve ser maior ou igual a 0',
          severity: 'MEDIUM'
        });
      }
    },
    
    /**
     * Valida CONFIG global
     * @return {Object} Resultado da validação
     */
    validateConfig: function() {
      Logger.log('[ConfigValidator] Validando CONFIG...');
      
      // Verifica se CONFIG existe
      if (typeof CONFIG === 'undefined') {
        Logger.log('[ConfigValidator] ❌ CONFIG não está definido!');
        return {
          valid: false,
          errors: [{
            field: 'CONFIG',
            message: 'CONFIG não está definido no escopo global',
            severity: 'CRITICAL'
          }],
          warnings: [],
          config: null
        };
      }
      
      return this.validate(CONFIG, CONFIG_SCHEMA);
    },
    
    /**
     * Valida System global
     * @return {Object} Resultado da validação
     */
    validateSystem: function() {
      Logger.log('[ConfigValidator] Validando System...');
      
      // Verifica se System existe
      if (typeof System === 'undefined') {
        Logger.log('[ConfigValidator] ⚠️  System não está definido!');
        return {
          valid: false,
          errors: [{
            field: 'System',
            message: 'System não está definido no escopo global',
            severity: 'HIGH'
          }],
          warnings: [],
          config: null
        };
      }
      
      return this.validate(System, SYSTEM_SCHEMA);
    },
    
    /**
     * Valida toda a configuração do sistema
     * @param {boolean} abortOnError - Se true, lança erro em caso de falha
     * @return {Object} Resultado da validação
     */
    validateAll: function(abortOnError) {
      Logger.log('='.repeat(80));
      Logger.log('🔍 VALIDAÇÃO DE CONFIGURAÇÃO DO SISTEMA');
      Logger.log('='.repeat(80));
      Logger.log('');
      
      var results = {
        config: this.validateConfig(),
        system: this.validateSystem()
      };
      
      var totalErrors = results.config.errors.length + results.system.errors.length;
      var totalWarnings = results.config.warnings.length + results.system.warnings.length;
      
      // Imprime resultados
      this.printValidationResults('CONFIG', results.config);
      Logger.log('');
      this.printValidationResults('System', results.system);
      
      Logger.log('');
      Logger.log('='.repeat(80));
      Logger.log('📊 RESUMO DA VALIDAÇÃO');
      Logger.log('='.repeat(80));
      Logger.log(`Total de erros: ${totalErrors}`);
      Logger.log(`Total de avisos: ${totalWarnings}`);
      Logger.log('');
      
      var allValid = results.config.valid && results.system.valid;
      
      if (allValid) {
        Logger.log('✅ CONFIGURAÇÃO VÁLIDA - Sistema pronto para inicializar');
      } else {
        Logger.log('❌ CONFIGURAÇÃO INVÁLIDA - Corrija os erros antes de continuar');
        
        if (abortOnError) {
          throw new Error('Configuração inválida. Sistema não pode inicializar.');
        }
      }
      
      Logger.log('='.repeat(80));
      
      return {
        valid: allValid,
        totalErrors: totalErrors,
        totalWarnings: totalWarnings,
        results: results
      };
    },
    
    /**
     * Imprime resultados da validação
     * @param {string} name - Nome da configuração
     * @param {Object} result - Resultado da validação
     */
    printValidationResults: function(name, result) {
      Logger.log(`📋 Validação de ${name}:`);
      Logger.log('-'.repeat(80));
      
      if (result.valid) {
        Logger.log(`✅ ${name} válido`);
      } else {
        Logger.log(`❌ ${name} inválido`);
      }
      
      if (result.errors.length > 0) {
        Logger.log('');
        Logger.log('Erros:');
        for (var i = 0; i < result.errors.length; i++) {
          var error = result.errors[i];
          Logger.log(`  ❌ [${error.severity}] ${error.field}: ${error.message}`);
        }
      }
      
      if (result.warnings.length > 0) {
        Logger.log('');
        Logger.log('Avisos:');
        for (var i = 0; i < result.warnings.length; i++) {
          var warning = result.warnings[i];
          Logger.log(`  ⚠️  [${warning.severity}] ${warning.field}: ${warning.message}`);
        }
      }
    },
    
    /**
     * Obtém esquema de validação para CONFIG
     * @return {Object} Esquema
     */
    getConfigSchema: function() {
      return CONFIG_SCHEMA;
    },
    
    /**
     * Obtém esquema de validação para System
     * @return {Object} Esquema
     */
    getSystemSchema: function() {
      return SYSTEM_SCHEMA;
    }
  };
})();

/**
 * Função helper para validar configuração na inicialização
 * Execute esta função antes de inicializar o sistema
 */
function validateSystemConfiguration() {
  return ConfigValidator.validateAll(false);
}

/**
 * Função helper para validar e abortar se inválido
 * Use esta função em produção para garantir configuração válida
 */
function validateSystemConfigurationStrict() {
  return ConfigValidator.validateAll(true);
}
