/**
 * JobQueueService - Gerenciamento de fila de jobs assíncronos
 * Responsável pela comunicação entre GAS e Colab
 */

const JOB_QUEUE_SHEET = SHEET_NAMES.JOB_QUEUE;

const JobStatus = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

/**
 * Enfileira um novo job para processamento assíncrono
 * @param {string} jobName - Nome do job a ser executado
 * @param {Object} payload - Dados do job
 * @returns {string} jobId - UUID do job criado
 */
function enqueueJob(jobName, payload) {
  try {
    const jobId = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    const userEmail = Session.getActiveUser().getEmail();
    
    // Usa SpreadsheetProvider para acesso consistente
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
    
    if (!sheet) {
      Logger.log('JobQueue sheet not found, creating...');
      createJobQueueSheet();
    }
    
    const finalSheet = sheet || ss.getSheetByName(JOB_QUEUE_SHEET);
    
    finalSheet.appendRow([
      jobId,
      jobName,
      'PENDING',
      JSON.stringify(payload),
      timestamp,
      userEmail,
      '', // timestamp_claimed
      '', // timestamp_completed
      '', // result
      '', // errorCode
      ''  // errorMessage
    ]);
    
    Logger.log(`Job enqueued: ${jobId} (${jobName})`);
    return jobId;
  } catch (error) {
    Logger.log('Error enqueuing job: ' + error.message);
    throw error;
  }
}

/**
 * Verifica o status de um job
 * @param {string} jobId - UUID do job
 * @returns {Object} Status do job
 */
function checkJobStatus(jobId) {
  try {
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
    if (!sheet) {
      return { error: 'JobQueue sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jobId) {
        return {
          jobId: data[i][0],
          jobName: data[i][1],
          status: data[i][2],
          payload: data[i][3],
          timestamp_enqueued: data[i][4],
          user_email: data[i][5],
          timestamp_claimed: data[i][6],
          timestamp_completed: data[i][7],
          result: data[i][8],
          errorCode: data[i][9],
          errorMessage: data[i][10]
        };
      }
    }
    
    return { error: 'Job not found' };
  } catch (error) {
    Logger.log('Error checking job status: ' + error.message);
    return { error: error.message };
  }
}

/**
 * Retorna todos os jobs pendentes
 * @returns {Array} Lista de jobs pendentes
 */
function getAllPendingJobs() {
  try {
    const ss = SpreadsheetProvider.getInstance();
    const sheet = ss.getSheetByName(JOB_QUEUE_SHEET);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const pendingJobs = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === 'PENDING') {
        pendingJobs.push({
          jobId: data[i][0],
          jobName: data[i][1],
          status: data[i][2],
          payload: data[i][3],
          timestamp_enqueued: data[i][4],
          user_email: data[i][5]
        });
      }
    }
    
    return pendingJobs;
  } catch (error) {
    Logger.log('Error getting pending jobs: ' + error.message);
    return [];
  }
}
