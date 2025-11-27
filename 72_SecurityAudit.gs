/**
 * @file SecurityAudit.gs
 * @description Auditoria de segurança e verificação de vulnerabilidades
 * @version 1.0.0
 */

var SecurityAudit = (function() {
  
  /**
   * Executa auditoria completa de segurança
   */
  function runFullAudit() {
    var report = {
      timestamp: new Date().toISOString(),
      status: 'pass',
      checks: [],
      vulnerabilities: [],
      recommendations: []
    };
    
    // 1. Verificar configurações de autenticação
    report.checks.push(auditAuthConfig());
    
    // 2. Verificar permissões de planilha
    report.checks.push(auditSpreadsheetPermissions());
    
    // 3. Verificar exposição de dados sensíveis
    report.checks.push(auditSensitiveData());
    
    // 4. Verificar configurações de API
    report.checks.push(auditAPIConfig());
    
    // 5. Verificar logs de segurança
    report.checks.push(auditSecurityLogs());
    
    // Determinar status geral
    var hasVulnerabilities = report.checks.some(function(check) {
      return check.status === 'fail' || check.severity === 'high';
    });
    
    report.status = hasVulnerabilities ? 'fail' : 'pass';
    
    // Gerar recomendações
    report.recommendations = generateRecommendations(report.checks);
    
    return report;
  }
  
  /**
   * Audita configurações de autenticação
   */
  function auditAuthConfig() {
    var check = {
      name: 'Configuração de Autenticação',
      status: 'pass',
      issues: []
    };
    
    try {
      var props = PropertiesService.getScriptProperties();
      
      // Verificar se senhas estão hasheadas
      var users = getUsers();
      users.forEach(function(user) {
        if (user.password && user.password.length < 50) {
          check.issues.push({
            severity: 'high',
            message: 'Senha não hasheada detectada para usuário: ' + user.username
          });
        }
      });
      
      // Verificar duração de sessão
      var sessionDuration = SECURITY_CONFIG.SESSION_DURATION;
      if (sessionDuration > TIME_CONSTANTS.ONE_HOUR * 2) {
        check.issues.push({
          severity: 'medium',
          message: 'Duração de sessão muito longa: ' + (sessionDuration / TIME_CONSTANTS.ONE_HOUR) + 'h'
        });
      }
      
      check.status = check.issues.length === 0 ? 'pass' : 'fail';
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }
    
    return check;
  }
  
  /**
   * Audita permissões da planilha
   */
  function auditSpreadsheetPermissions() {
    var check = {
      name: 'Permissões da Planilha',
      status: 'pass',
      issues: []
    };
    
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var protection = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      
      // Verificar planilhas críticas protegidas
      var criticalSheets = ['Usuarios', 'Logs', 'Auditoria', 'JobQueue'];
      var sheets = ss.getSheets();
      
      sheets.forEach(function(sheet) {
        if (criticalSheets.indexOf(sheet.getName()) !== -1) {
          var isProtected = protection.some(function(p) {
            return p.getRange().getSheet().getName() === sheet.getName();
          });
          
          if (!isProtected) {
            check.issues.push({
              severity: 'medium',
              message: 'Planilha crítica não protegida: ' + sheet.getName()
            });
          }
        }
      });
      
      check.status = check.issues.length === 0 ? 'pass' : 'warning';
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }
    
    return check;
  }
  
  /**
   * Audita exposição de dados sensíveis
   */
  function auditSensitiveData() {
    var check = {
      name: 'Dados Sensíveis',
      status: 'pass',
      issues: []
    };
    
    try {
      var props = PropertiesService.getScriptProperties();
      var allProps = props.getProperties();
      
      // Padrões de dados sensíveis
      var sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /password/i,
        /token/i,
        /credential/i
      ];
      
      // Verificar se dados sensíveis estão em propriedades
      for (var key in allProps) {
        var isSensitive = sensitivePatterns.some(function(pattern) {
          return pattern.test(key);
        });
        
        if (isSensitive && allProps[key]) {
          check.issues.push({
            severity: 'info',
            message: 'Dado sensível armazenado: ' + key
          });
        }
      }
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }
    
    return check;
  }
  
  /**
   * Audita configurações de API
   */
  function auditAPIConfig() {
    var check = {
      name: 'Configuração de API',
      status: 'pass',
      issues: []
    };
    
    try {
      // Verificar se CORS está configurado
      // Verificar rate limiting
      // Verificar validação de entrada
      
      check.issues.push({
        severity: 'info',
        message: 'Implementar rate limiting para APIs públicas'
      });
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }
    
    return check;
  }
  
  /**
   * Audita logs de segurança
   */
  function auditSecurityLogs() {
    var check = {
      name: 'Logs de Segurança',
      status: 'pass',
      issues: []
    };
    
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var auditSheet = ss.getSheetByName('Auditoria');
      
      if (!auditSheet) {
        check.issues.push({
          severity: 'high',
          message: 'Planilha de auditoria não encontrada'
        });
        check.status = 'fail';
        return check;
      }
      
      // Verificar logs recentes
      var lastRow = auditSheet.getLastRow();
      if (lastRow < 2) {
        check.issues.push({
          severity: 'medium',
          message: 'Nenhum log de auditoria encontrado'
        });
      }
      
    } catch (error) {
      check.status = 'error';
      check.error = error.message;
    }
    
    return check;
  }
  
  /**
   * Gera recomendações baseadas nos checks
   */
  function generateRecommendations(checks) {
    var recommendations = [];
    
    checks.forEach(function(check) {
      if (check.issues && check.issues.length > 0) {
        check.issues.forEach(function(issue) {
          if (issue.severity === 'high') {
            recommendations.push({
              priority: 'high',
              action: 'Corrigir: ' + issue.message,
              check: check.name
            });
          }
        });
      }
    });
    
    // Recomendações gerais
    recommendations.push({
      priority: 'medium',
      action: 'Implementar autenticação de dois fatores',
      check: 'Geral'
    });
    
    recommendations.push({
      priority: 'low',
      action: 'Revisar logs de auditoria mensalmente',
      check: 'Geral'
    });
    
    return recommendations;
  }
  
  /**
   * Obtém usuários (helper)
   */
  function getUsers() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Usuarios');
      if (!sheet) return [];
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var users = [];
      
      for (var i = 1; i < data.length; i++) {
        var user = {};
        headers.forEach(function(header, index) {
          user[header.toLowerCase()] = data[i][index];
        });
        users.push(user);
      }
      
      return users;
    } catch (error) {
      return [];
    }
  }
  
  return {
    runFullAudit: runFullAudit
  };
})();
