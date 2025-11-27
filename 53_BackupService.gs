/**
 * @file BackupService.gs
 * @description Serviço de backup automatizado e recuperação
 * @version 1.0.0
 */

var BackupService = (function() {
  
  var BACKUP_FOLDER_NAME = 'TE-DF-Backups';
  
  /**
   * Cria backup completo do sistema
   */
  function createFullBackup() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
      var backupName = 'Backup_' + timestamp;
      
      // Obter ou criar pasta de backups
      var folder = getOrCreateBackupFolder();
      
      // Criar cópia da planilha
      var backup = ss.copy(backupName);
      var backupFile = DriveApp.getFileById(backup.getId());
      
      // Mover para pasta de backups
      backupFile.moveTo(folder);
      
      // Registrar backup
      logBackup(backup.getId(), backupName, timestamp);
      
      // Limpar backups antigos
      cleanOldBackups();
      
      return {
        success: true,
        backupId: backup.getId(),
        backupName: backupName,
        url: backup.getUrl()
      };
      
    } catch (error) {
      Logger.log('[Backup] Erro ao criar backup: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Cria backup incremental (apenas dados modificados)
   */
  function createIncrementalBackup() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var timestamp = new Date();
      var lastBackup = getLastBackupTimestamp();
      
      // Identificar planilhas modificadas
      var modifiedSheets = getModifiedSheets(lastBackup);
      
      if (modifiedSheets.length === 0) {
        return {
          success: true,
          message: 'Nenhuma modificação desde o último backup'
        };
      }
      
      // Criar backup apenas das planilhas modificadas
      var backupData = {
        timestamp: timestamp.toISOString(),
        sheets: {}
      };
      
      modifiedSheets.forEach(function(sheetName) {
        var sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          backupData.sheets[sheetName] = sheet.getDataRange().getValues();
        }
      });
      
      // Salvar no Drive como JSON
      var folder = getOrCreateBackupFolder();
      var fileName = 'Incremental_' + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss') + '.json';
      var file = folder.createFile(fileName, JSON.stringify(backupData), MimeType.PLAIN_TEXT);
      
      return {
        success: true,
        backupId: file.getId(),
        fileName: fileName,
        sheetsBackedUp: modifiedSheets.length
      };
      
    } catch (error) {
      Logger.log('[Backup] Erro ao criar backup incremental: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Restaura backup
   */
  function restoreBackup(backupId) {
    try {
      var backup = SpreadsheetApp.openById(backupId);
      var current = SpreadsheetApp.getActiveSpreadsheet();
      
      // Criar backup de segurança antes de restaurar
      var safetyBackup = createFullBackup();
      
      // Copiar dados do backup para planilha atual
      var backupSheets = backup.getSheets();
      
      backupSheets.forEach(function(backupSheet) {
        var sheetName = backupSheet.getName();
        var currentSheet = current.getSheetByName(sheetName);
        
        if (!currentSheet) {
          currentSheet = current.insertSheet(sheetName);
        }
        
        // Limpar planilha atual
        currentSheet.clear();
        
        // Copiar dados
        var data = backupSheet.getDataRange().getValues();
        if (data.length > 0) {
          currentSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
        }
      });
      
      // Registrar restauração
      logRestore(backupId, safetyBackup.backupId);
      
      return {
        success: true,
        message: 'Backup restaurado com sucesso',
        safetyBackupId: safetyBackup.backupId
      };
      
    } catch (error) {
      Logger.log('[Backup] Erro ao restaurar backup: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Lista backups disponíveis
   */
  function listBackups() {
    try {
      var folder = getOrCreateBackupFolder();
      var files = folder.getFiles();
      var backups = [];
      
      while (files.hasNext()) {
        var file = files.next();
        backups.push({
          id: file.getId(),
          name: file.getName(),
          created: file.getDateCreated(),
          size: file.getSize(),
          url: file.getUrl()
        });
      }
      
      // Ordenar por data (mais recente primeiro)
      backups.sort(function(a, b) {
        return b.created - a.created;
      });
      
      return {
        success: true,
        backups: backups,
        total: backups.length
      };
      
    } catch (error) {
      Logger.log('[Backup] Erro ao listar backups: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Limpa backups antigos
   */
  function cleanOldBackups() {
    try {
      var folder = getOrCreateBackupFolder();
      var files = folder.getFiles();
      var retentionDays = RETENTION_DAYS.BACKUPS || 30;
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      var deletedCount = 0;
      
      while (files.hasNext()) {
        var file = files.next();
        if (file.getDateCreated() < cutoffDate) {
          file.setTrashed(true);
          deletedCount++;
        }
      }
      
      Logger.log('[Backup] Limpeza concluída: ' + deletedCount + ' backups removidos');
      
      return {
        success: true,
        deletedCount: deletedCount
      };
      
    } catch (error) {
      Logger.log('[Backup] Erro ao limpar backups: ' + error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Obtém ou cria pasta de backups
   */
  function getOrCreateBackupFolder() {
    var folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
    
    if (folders.hasNext()) {
      return folders.next();
    }
    
    return DriveApp.createFolder(BACKUP_FOLDER_NAME);
  }
  
  /**
   * Registra backup no log
   */
  function logBackup(backupId, backupName, timestamp) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var logSheet = ss.getSheetByName('Logs');
      
      if (logSheet) {
        logSheet.appendRow([
          new Date(),
          'BACKUP',
          'Sistema',
          'Backup criado: ' + backupName,
          backupId,
          Session.getActiveUser().getEmail()
        ]);
      }
      
      // Atualizar propriedade
      PropertiesService.getScriptProperties().setProperty('LAST_BACKUP_TIMESTAMP', timestamp);
      
    } catch (error) {
      Logger.log('[Backup] Erro ao registrar backup: ' + error.message);
    }
  }
  
  /**
   * Registra restauração no log
   */
  function logRestore(backupId, safetyBackupId) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var logSheet = ss.getSheetByName('Logs');
      
      if (logSheet) {
        logSheet.appendRow([
          new Date(),
          'RESTORE',
          'Sistema',
          'Backup restaurado: ' + backupId,
          'Safety backup: ' + safetyBackupId,
          Session.getActiveUser().getEmail()
        ]);
      }
      
    } catch (error) {
      Logger.log('[Backup] Erro ao registrar restauração: ' + error.message);
    }
  }
  
  /**
   * Obtém timestamp do último backup
   */
  function getLastBackupTimestamp() {
    var timestamp = PropertiesService.getScriptProperties().getProperty('LAST_BACKUP_TIMESTAMP');
    return timestamp ? new Date(timestamp) : new Date(0);
  }
  
  /**
   * Identifica planilhas modificadas
   */
  function getModifiedSheets(since) {
    // Implementação simplificada - pode ser melhorada com tracking de modificações
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    return sheets.map(function(sheet) {
      return sheet.getName();
    });
  }
  
  /**
   * Agenda backup automático
   */
  function scheduleAutoBackup() {
    // Remover triggers existentes
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'autoBackup') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Criar novo trigger (diário às 2h)
    ScriptApp.newTrigger('autoBackup')
      .timeBased()
      .atHour(2)
      .everyDays(1)
      .create();
    
    Logger.log('[Backup] Backup automático agendado');
  }
  
  return {
    createFull: createFullBackup,
    createIncremental: createIncrementalBackup,
    restore: restoreBackup,
    list: listBackups,
    clean: cleanOldBackups,
    scheduleAuto: scheduleAutoBackup
  };
})();

/**
 * Função para trigger automático
 */
function autoBackup() {
  BackupService.createFull();
}
