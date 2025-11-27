/**
 * 2_Data_Services_Part2
 * Serviços de dados, planilhas e arquivamento (Parte 2)
 * 
 * Consolidado em: 2025-10-21 01:14:28
 * Total de arquivos: 7
 * Total de linhas: 1536
 */


////////////////////////////////////////////////////////////////////////////////
// ARQUIVO: CleanupScript.gs
////////////////////////////////////////////////////////////////////////////////


/**
 * SCRIPT DE LIMPEZA AUTOMÁTICA - SIG-TE
 * Gerado automaticamente por cleanup_data.py
 * 
 * EXECUTE NO GOOGLE APPS SCRIPT EDITOR
 * Função: cleanupOldData()
 */

function cleanupOldData() {
  const ss = getSpreadsheet(); // ✅ Usa função centralizada
  const stats = {
    deleted: {},
    errors: []
  };
  
  Logger.log('🧹 INICIANDO LIMPEZA DE DADOS...');
  Logger.log('='.repeat(80));
  
  // 1. LOGS - Mantém últimos 30 dias
  try {
    const logsSheet = ss.getSheetByName('Logs');
    if (logsSheet) {
      const deleted = cleanupByDate(logsSheet, 'Timestamp', 30);
      stats.deleted['Logs'] = deleted;
      Logger.log(`✓ Logs: ${deleted} registros removidos`);
    }
  } catch (e) {
    stats.errors.push(`Logs: ${e.message}`);
    Logger.log(`✗ Erro em Logs: ${e.message}`);
  }
  
  // 2. AUDITORIA - Mantém últimos 60 dias
  try {
    const auditSheet = ss.getSheetByName('Auditoria');
    if (auditSheet) {
      const deleted = cleanupByDate(auditSheet, 'Timestamp', 60);
      stats.deleted['Auditoria'] = deleted;
      Logger.log(`✓ Auditoria: ${deleted} registros removidos`);
    }
  } catch (e) {
    stats.errors.push(`Auditoria: ${e.message}`);
    Logger.log(`✗ Erro em Auditoria: ${e.message}`);
  }
  
  // 3. TELEMETRY - Mantém últimos 15 dias
  try {
    const telemetrySheet = ss.getSheetByName('Telemetry');
    if (telemetrySheet) {
      const deleted = cleanupByDate(telemetrySheet, 'Timestamp', 15);
      stats.deleted['Telemetry'] = deleted;
      Logger.log(`✓ Telemetry: ${deleted} registros removidos`);
    }
  } catch (e) {
    stats.errors.push(`Telemetry: ${e.message}`);
    Logger.log(`✗ Erro em Telemetry: ${e.message}`);
  }
  
  // 4. ENGAGEMENT - Mantém últimos 90 dias
  try {
    const engagementSheet = ss.getSheetByName('Engagement');
    if (engagementSheet) {
      const deleted = cleanupByDate(engagementSheet, 'Data', 90);
      stats.deleted['Engagement'] = deleted;
      Logger.log(`✓ Engagement: ${deleted} registros removidos`);
    }
  } catch (e) {
    stats.errors.push(`Engagement: ${e.message}`);
    Logger.log(`✗ Erro em Engagement: ${e.message}`);
  }
  
  // 5. DADOS DE TESTE - Remove registros com "Teste", "Test", "E2E", "Batch"
  try {
    const dadosSheet = ss.getSheetByName('Dados');
    if (dadosSheet) {
      const deleted = cleanupTestData(dadosSheet, 'Descrição', ['Teste', 'Test', 'E2E', 'Batch', 'Temporário']);
      stats.deleted['Dados'] = deleted;
      Logger.log(`✓ Dados: ${deleted} registros de teste removidos`);
    }
  } catch (e) {
    stats.errors.push(`Dados: ${e.message}`);
    Logger.log(`✗ Erro em Dados: ${e.message}`);
  }
  
  // 6. TRACKING - Mantém últimos 30 dias
  try {
    const trackingSheet = ss.getSheetByName('Tracking');
    if (trackingSheet) {
      const deleted = cleanupByDate(trackingSheet, 'Data', 30);
      stats.deleted['Tracking'] = deleted;
      Logger.log(`✓ Tracking: ${deleted} registros removidos`);
    }
  } catch (e) {
    stats.errors.push(`Tracking: ${e.message}`);
    Logger.log(`✗ Erro em Tracking: ${e.message}`);
  }
  
  // RELATÓRIO FINAL
  Logger.log('='.repeat(80));
  Logger.log('🎯 RELATÓRIO DE LIMPEZA');
  Logger.log('='.repeat(80));
  
  let totalDeleted = 0;
  for (const sheet in stats.deleted) {
    totalDeleted += stats.deleted[sheet];
    Logger.log(`${sheet}: ${stats.deleted[sheet]} registros removidos`);
  }
  
  Logger.log('');
  Logger.log(`TOTAL: ${totalDeleted} registros removidos`);
  
  if (stats.errors.length > 0) {
    Logger.log('');
    Logger.log('⚠️ ERROS:');
    stats.errors.forEach(err => Logger.log(`  • ${err}`));
  }
  
  Logger.log('='.repeat(80));
  Logger.log('✅ LIMPEZA CONCLUÍDA!');
  
  return stats;
}

/**
 * Remove registros anteriores a X dias
 */
function cleanupByDate(sheet, timestampColumn, retentionDays) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const timestampIndex = headers.indexOf(timestampColumn);
  
  if (timestampIndex === -1) {
    Logger.log(`⚠️ Coluna ${timestampColumn} não encontrada em ${sheet.getName()}`);
    return 0;
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const rowsToDelete = [];
  
  // Identifica linhas a deletar (ignora header)
  for (let i = 1; i < data.length; i++) {
    const timestamp = data[i][timestampIndex];
    
    if (timestamp && timestamp instanceof Date) {
      if (timestamp < cutoffDate) {
        rowsToDelete.push(i + 1); // +1 porque sheet é 1-indexed
      }
    }
  }
  
  // Deleta em ordem reversa para não afetar índices
  rowsToDelete.reverse().forEach(rowIndex => {
    sheet.deleteRow(rowIndex);
  });
  
  return rowsToDelete.length;
}

/**
 * Remove registros de teste por palavras-chave
 */
function cleanupTestData(sheet, textColumn, keywords) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const textIndex = headers.indexOf(textColumn);
  
  if (textIndex === -1) {
    Logger.log(`⚠️ Coluna ${textColumn} não encontrada em ${sheet.getName()}`);
    return 0;
  }
  
  const rowsToDelete = [];
  
  // Identifica linhas a deletar (ignora header)
  for (let i = 1; i < data.length; i++) {
    const text = String(data[i][textIndex] || '');
    
    // Verifica se contém alguma palavra-chave de teste
    const isTestData = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isTestData) {
      rowsToDelete.push(i + 1);
    }
  }
  
  // Deleta em ordem reversa
  rowsToDelete.reverse().forEach(rowIndex => {
    sheet.deleteRow(rowIndex);
  });
  
  return rowsToDelete.length;
}



/**
 * Agenda limpeza automática semanal
 */
function setupAutomaticCleanup() {
  // Remove triggers antigos
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'cleanupOldData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Cria novo trigger (toda segunda-feira às 3h)
  ScriptApp.newTrigger('cleanupOldData')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
  
  Logger.log('✓ Limpeza automática agendada para toda segunda-feira às 3h');
}



////////////////////////////////////////////////////////////////////////////////
// ARQUIVO: CreateMissingSheets.gs
////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================================
 * SISTEMA SIMPLIFICADO - APENAS 6 PLANILHAS ESSENCIAIS
 * ============================================================================
 *
 * Refatoração RADICAL do sistema TE-DF-PP
 * De 34 planilhas → 6 planilhas essenciais
 *
 * PLANILHAS:
 * 1. Usuarios
 * 2. Alunos
 * 3. Rotas
 * 4. Frequencia
 * 5. Incidentes
 * 6. Logs
 *
 * Versão: 4.0 - SIMPLIFICADA
 * Data: 2025-10-20
 * ============================================================================
 */

// ============================================================================
// CONFIGURAÇÃO DAS 6 PLANILHAS ESSENCIAIS
// ============================================================================

var SHEET_CONFIG = SHEET_CONFIG || {
  'Usuarios': {
    sectionId: 'usuarios',
    title: 'Gestão de Usuários',
    headers: ['ID', 'Username', 'Email', 'Password_Hash', 'Role', 'Status', 'Criado_Em'],
    demoData: [
      ['USR001', 'admin', 'admin@sigte.df.gov.br', 'hash123', 'Admin', 'Ativo', new Date()],
      ['USR002', 'operador', 'operador@sigte.df.gov.br', 'hash456', 'Operador', 'Ativo', new Date()],
      ['USR003', 'visualizador', 'view@sigte.df.gov.br', 'hash789', 'Visualizador', 'Ativo', new Date()]
    ]
  },

  'Alunos': {
    sectionId: 'alunos',
    title: 'Gestão de Alunos',
    headers: ['ID', 'Nome_Completo', 'RA_Aluno', 'Data_Nascimento', 'Serie_Ano', 'Turno', 'ID_Rota', 'Status_Ativo', 'Timestamp'],
    demoData: [
      ['ALU001', 'João Silva', 'RA001', '2010-05-15', '5º Ano', 'Matutino', 'RT001', 'Ativo', new Date()],
      ['ALU002', 'Maria Santos', 'RA002', '2011-08-20', '4º Ano', 'Matutino', 'RT001', 'Ativo', new Date()],
      ['ALU003', 'Pedro Costa', 'RA003', '2009-03-10', '6º Ano', 'Vespertino', 'RT002', 'Ativo', new Date()],
      ['ALU004', 'Ana Oliveira', 'RA004', '2010-11-25', '5º Ano', 'Vespertino', 'RT002', 'Ativo', new Date()],
      ['ALU005', 'Lucas Pereira', 'RA005', '2011-02-14', '4º Ano', 'Matutino', 'RT001', 'Ativo', new Date()]
    ]
  },

  'Rotas': {
    sectionId: 'rotas',
    title: 'Gestão de Rotas',
    headers: ['ID', 'Nome_Rota', 'Origem', 'Destino', 'Turno', 'Status', 'Capacidade', 'Alunos_Ativos', 'Timestamp'],
    demoData: [
      ['RT001', 'Rota 01 - Taguatinga', 'Terminal Taguatinga', 'Escola Central', 'Matutino', 'Ativa', 45, 3, new Date()],
      ['RT002', 'Rota 02 - Ceilândia', 'Terminal Ceilândia', 'Escola Sul', 'Vespertino', 'Ativa', 50, 2, new Date()],
      ['RT003', 'Rota 03 - Samambaia', 'Terminal Samambaia', 'Colégio Norte', 'Matutino', 'Ativa', 40, 0, new Date()]
    ]
  },

  'Frequencia': {
    sectionId: 'frequencia',
    title: 'Registro de Frequência',
    headers: ['ID', 'Data', 'ID_Aluno', 'ID_Rota', 'Status_Presenca', 'Observacoes', 'Timestamp'],
    demoData: [
      ['FRQ001', new Date(), 'ALU001', 'RT001', 'Presente', '', new Date()],
      ['FRQ002', new Date(), 'ALU002', 'RT001', 'Presente', '', new Date()],
      ['FRQ003', new Date(), 'ALU003', 'RT002', 'Ausente', 'Não justificado', new Date()],
      ['FRQ004', new Date(), 'ALU004', 'RT002', 'Presente', '', new Date()],
      ['FRQ005', new Date(), 'ALU005', 'RT001', 'Presente', '', new Date()]
    ]
  },

  'Incidentes': {
    sectionId: 'incidentes',
    title: 'Registro de Incidentes',
    headers: ['ID', 'Data_Hora', 'Tipo', 'Descricao', 'Gravidade', 'Status', 'Responsavel', 'Timestamp'],
    demoData: [
      ['INC001', new Date(), 'Segurança', 'Aluno com mal-estar durante trajeto', 'Média', 'Resolvido', 'operador', new Date()],
      ['INC002', new Date(), 'Operacional', 'Atraso de 15 minutos na rota RT001', 'Baixa', 'Resolvido', 'operador', new Date()],
      ['INC003', new Date(), 'Manutenção', 'Verificar pneu dianteiro', 'Baixa', 'Pendente', 'admin', new Date()]
    ]
  },

  'Logs': {
    sectionId: 'logs',
    title: 'Logs do Sistema',
    headers: ['ID', 'Timestamp', 'Usuario', 'Acao', 'Detalhes', 'Status'],
    demoData: [
      ['LOG001', new Date(), 'admin', 'Sistema Iniciado', 'Simplificação RADICAL aplicada - 6 planilhas', 'Sucesso'],
      ['LOG002', new Date(), 'operador', 'Frequencia Registrada', 'FRQ001 criada', 'Sucesso'],
      ['LOG003', new Date(), 'admin', 'Aluno Cadastrado', 'ALU001 criado', 'Sucesso']
    ]
  }
};

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

function createMissingSheets() {
  const ss = getSpreadsheet(); // ✅ Usa função centralizada
  Logger.log('='.repeat(80));
  Logger.log('SISTEMA SIMPLIFICADO - Criando 6 planilhas essenciais');
  Logger.log('='.repeat(80));

  // Remove sheets indesejadas
  const unwantedPatterns = ['Página', 'Sheet', 'Planilha'];
  const allSheets = ss.getSheets();
  
  allSheets.forEach(sheet => {
    const name = sheet.getName();
    const isUnwanted = unwantedPatterns.some(pattern => 
      name.startsWith(pattern) && /\d+$/.test(name)
    );
    if (isUnwanted) {
      Logger.log(`Removendo sheet indesejada: ${name}`);
      ss.deleteSheet(sheet);
    }
  });

  let createdSheets = 0;
  let updatedSheets = 0;
  let totalDataRows = 0;

  // Ordem de criação das 6 planilhas
  const sheetOrder = ['Usuarios', 'Alunos', 'Rotas', 'Frequencia', 'Incidentes', 'Logs'];

  sheetOrder.forEach(sheetName => {
    try {
      const config = SHEET_CONFIG[sheetName];
      
      if (!config) {
        Logger.log(`ERRO: Configuração não encontrada para '${sheetName}'`);
        return;
      }

      let sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        Logger.log(`✓ Planilha '${sheetName}' criada`);
        createdSheets++;
      } else {
        Logger.log(`✓ Planilha '${sheetName}' já existe - atualizando`);
        updatedSheets++;
      }

      // Configurar cabeçalhos
      const headers = config.headers;
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Formatar cabeçalhos
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1a73e8');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      // Limpar dados existentes (exceto cabeçalhos)
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
      }

      // Inserir dados demo
      const demoData = config.demoData;
      if (demoData && demoData.length > 0) {
        sheet.getRange(2, 1, demoData.length, demoData[0].length).setValues(demoData);
        totalDataRows += demoData.length;
        Logger.log(`  → ${demoData.length} linhas de dados inseridas`);
      }

      // Auto-resize colunas
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }

      // Congelar primeira linha
      sheet.setFrozenRows(1);

    } catch (error) {
      Logger.log(`ERRO ao processar '${sheetName}': ${error.message}`);
    }
  });

  Logger.log('='.repeat(80));
  Logger.log(`RESUMO:`);
  Logger.log(`  • Planilhas criadas: ${createdSheets}`);
  Logger.log(`  • Planilhas atualizadas: ${updatedSheets}`);
  Logger.log(`  • Total de planilhas: ${sheetOrder.length}`);
  Logger.log(`  • Linhas de dados: ${totalDataRows}`);
  Logger.log('='.repeat(80));

  return {
    success: true,
    created: createdSheets,
    updated: updatedSheets,
    total: sheetOrder.length,
    dataRows: totalDataRows,
    message: `Sistema simplificado: ${sheetOrder.length} planilhas configuradas`
  };
}

/**
 * Wrapper para compatibilidade com frontend
 */
function CreateMissingSheets() {
  try {
    const result = createMissingSheets();
    result.message = "Estrutura simplificada verificada: 6 planilhas essenciais";
    return result;
  } catch (e) {
    Logger.log(`Erro fatal: ${e.message}`);
    return { success: false, error: e.message, stack: e.stack };
  }
}







////////////////////////////////////////////////////////////////////////////////
// ARQUIVO: EventService.gs
////////////////////////////////////////////////////////////////////////////////

/**
 * @file EventService.gs
 * @description Gerencia a lógica de negócios para eventos (Dias Móveis, Reposições, etc.).
 * Suporta formulários especializados e CRUD Universal.
 */

////////////////////////////////////////////////////////////////////////////////
// ARQUIVO: ReportScript.gs
////////////////////////////////////////////////////////////////////////////////


/**
 * RELATÓRIO DE TAMANHOS - SIG-TE
 * Analisa tamanho de cada planilha e identifica problemas
 */
function generateSizeReport() {
  const ss = getSpreadsheet(); // ✅ Usa função centralizada
  const sheets = ss.getSheets();
  
  const report = {
    timestamp: new Date().toISOString(),
    sheets: [],
    totals: {
      records: 0,
      cells: 0,
      estimatedSizeMB: 0
    },
    warnings: []
  };
  
  Logger.log('📊 RELATÓRIO DE TAMANHOS');
  Logger.log('='.repeat(80));
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const records = lastRow > 1 ? lastRow - 1 : 0;
    const cells = lastRow * lastCol;
    
    // Estima tamanho (100 bytes por célula em média)
    const estimatedSizeMB = (cells * 100) / (1024 * 1024);
    
    const sheetData = {
      name: name,
      records: records,
      columns: lastCol,
      cells: cells,
      estimatedSizeMB: estimatedSizeMB.toFixed(2)
    };
    
    report.sheets.push(sheetData);
    report.totals.records += records;
    report.totals.cells += cells;
    report.totals.estimatedSizeMB += estimatedSizeMB;
    
    // Warnings
    if (records > 1000) {
      report.warnings.push(`⚠️ ${name}: ${records} registros (considere limpar)`);
    }
    if (estimatedSizeMB > 5) {
      report.warnings.push(`⚠️ ${name}: ${estimatedSizeMB.toFixed(2)}MB (muito grande)`);
    }
    
    Logger.log(`${name}: ${records} registros, ${lastCol} colunas, ~${estimatedSizeMB.toFixed(2)}MB`);
  });
  
  // Ordena por tamanho
  report.sheets.sort((a, b) => b.estimatedSizeMB - a.estimatedSizeMB);
  
  Logger.log('='.repeat(80));
  Logger.log(`TOTAL: ${report.totals.records} registros, ${report.totals.cells} células`);
  Logger.log(`TAMANHO ESTIMADO: ${report.totals.estimatedSizeMB.toFixed(2)}MB`);
  
  if (report.totals.estimatedSizeMB > 30) {
    Logger.log('');
    Logger.log('🔴 CRÍTICO: Dataset muito grande! Execute cleanupOldData() URGENTE!');
  } else if (report.totals.estimatedSizeMB > 20) {
    Logger.log('');
    Logger.log('⚠️ ATENÇÃO: Dataset grande. Considere limpeza em breve.');
  } else {
    Logger.log('');
    Logger.log('✅ Tamanho OK');
  }
  
  if (report.warnings.length > 0) {
    Logger.log('');
    Logger.log('⚠️ AVISOS:');
    report.warnings.forEach(w => Logger.log(`  ${w}`));
  }
  
  Logger.log('='.repeat(80));
  
  return report;
}
















