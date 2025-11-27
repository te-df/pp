/**
 * JobQueueHelpers - Funções auxiliares para gerenciamento de jobs
 */

/**
 * Cria a aba JobQueue se não existir
 */
function createJobQueueSheet() {
  try {
    const ss = SpreadsheetProvider.getInstance();
    let sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
    
    if (!sheet) {
      sheet = ss.insertSheet(JOB_QUEUE_SHEET);
      sheet.appendRow([
        'jobId',
        'jobName',
        'status',
        'payload',
        'timestamp_enqueued',
        'user_email',
        'timestamp_claimed',
        'timestamp_completed',
        'result',
        'errorCode',
        'errorMessage'
      ]);
      
      // Formata cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      
      // Congela primeira linha
      sheet.setFrozenRows(1);
      
      Logger.log('JobQueue sheet created successfully');
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error creating JobQueue sheet: ' + error.message);
    throw error;
  }
}

/**
 * Limpa jobs antigos (mais de 30 dias)
 */
function cleanupOldJobs() {
  try {
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const rowsToDelete = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = new Date(data[i][4]);
      if (timestamp < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Deleta em ordem reversa para não afetar índices
    rowsToDelete.forEach(row => {
      sheet.deleteRow(row);
    });
    
    Logger.log('Cleaned up ' + rowsToDelete.length + ' old jobs');
  } catch (error) {
    Logger.log('Error cleaning up old jobs: ' + error.message);
  }
}
