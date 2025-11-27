/**
 * Script para criar abas ausentes na planilha de produção
 * Executar a função: createMissingProductionSheets()
 */

function createMissingProductionSheets() {
  // ID hardcoded como fallback (pode ser usado para configuração inicial)
  const HARDCODED_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  
  try {
    // Tenta usar SpreadsheetProvider primeiro
    const ss = SpreadsheetProvider.getInstance();
    Logger.log('Iniciando verificação de abas na planilha: ' + ss.getName());
    
    return createSheetsInSpreadsheet(ss);
    
  } catch (error) {
    Logger.log('⚠️ SpreadsheetProvider falhou: ' + error.message);
    Logger.log('💡 Usando ID hardcoded como fallback...');
    
    try {
      const ss = SpreadsheetApp.openById(HARDCODED_SPREADSHEET_ID);
      Logger.log('Iniciando verificação de abas na planilha: ' + ss.getName());
      
      // Se funcionou com ID hardcoded, sugere configurar
      Logger.log('\n💡 DICA: Configure o sistema executando:');
      Logger.log('   autoSetupFromHardcodedId()');
      Logger.log('   em System.gs');
      
      return createSheetsInSpreadsheet(ss);
      
    } catch (fallbackError) {
      Logger.log('❌ Falha ao acessar spreadsheet: ' + fallbackError.message);
      throw new Error('Não foi possível acessar a planilha. Execute System.setup() em System.gs');
    }
  }
}

/**
 * Cria as sheets necessárias em um spreadsheet específico
 * @param {Spreadsheet} ss - Instância do spreadsheet
 */
function createSheetsInSpreadsheet(ss) {
  // Definição das abas e suas colunas (Baseado na análise dos arquivos HTML)
  const sheetsToCreate = {
    'Alunos': [
      'ID', 'Nome_Completo', 'RA_Aluno', 'Data_Nascimento', 'Serie_Ano', 
      'Turno', 'ID_Rota', 'Status_Ativo', 'Timestamp'
    ],
    'Rotas': [
      'ID', 'Nome_Rota', 'Origem', 'Destino', 'Turno', 
      'Status', 'Capacidade', 'Alunos_Ativos', 'Timestamp'
    ],
    'Veiculos': [
      'ID', 'Placa', 'Modelo', 'Capacidade', 'Motorista_Atual', 
      'Status', 'Ultima_Manutencao', 'Kilometragem', 'Ano', 'Marca'
    ],
    'Frequencia': [
      'ID', 'Data', 'ID_Aluno', 'ID_Rota', 'Status_Presenca', 
      'Observacoes', 'Timestamp'
    ],
    'Pessoal': [
      'ID', 'Nome_Completo', 'CPF', 'Funcao', 'Email', 
      'Telefone', 'Status', 'Data_Admissao', 'ID_Rota_Associada'
    ],
    'Usuarios': [
      'ID', 'Username', 'Email', 'Password_Hash', 'Role', 
      'Status', 'Criado_Em'
    ],
    'Eventos': [
      'ID', 'Tipo_Evento', 'Titulo', 'Descricao', 'Data_Inicio', 
      'Data_Fim', 'Escola', 'Status', 'Dados_Adicionais', 
      'Criado_Por', 'Criado_Em', 'Atualizado_Em'
    ],
    'Incidentes': [
      'ID', 'Data_Hora', 'Tipo', 'Descricao', 'Gravidade', 
      'Status', 'Responsavel', 'Timestamp'
    ],
    'Logs': [
      'ID', 'Timestamp', 'Usuario', 'Acao', 'Detalhes', 'Status'
    ],
    'Config': [
      'Key', 'Value', 'Description', 'Type', 'Group', 'Last_Updated'
    ],
    'JobQueue': [
      'jobId', 'jobName', 'status', 'payload', 'timestamp_enqueued', 
      'user_email', 'timestamp_claimed', 'timestamp_completed', 
      'result', 'errorCode', 'errorMessage'
    ],
    'Processos_Pendentes': [
      'ID_Validacao', 'Data_Validacao', 'Mes_Referencia', 'Contrato', 
      'Empresa', 'Total_Documentos', 'Docs_Presentes', 'Docs_Ausentes', 
      'Percentual_Conformidade', 'Status_Validacao', 'Observacoes', 
      'Detalhes_Faltantes'
    ],
    'Alertas_Processuais': [
      'Numero_SEI', 'Tipo_Solicitacao', 'Unidade_Escolar', 'Data_Entrada_UNIAE',
      'Status_Atual', 'Dias_Tramitacao', 'Responsavel_Atual', 'Pendencias',
      'Prazo_SLA', 'Dentro_Prazo', 'Proxima_Acao', 'Observacoes'
    ],
    'Sessoes': [
      'Token', 'RefreshToken', 'UserID', 'Email', 'Role', 
      'CreatedAt', 'ExpiresAt', 'LastActivity', 'Status'
    ]
  };
  
  const createdSheets = [];
  const existingSheets = [];
  
  // Itera sobre as abas necessárias
  for (const [sheetName, headers] of Object.entries(sheetsToCreate)) {
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log(`Criando aba ausente: ${sheetName}`);
      try {
        sheet = ss.insertSheet(sheetName);
        
        // Adiciona cabeçalhos
        if (headers.length > 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          
          // Formatação básica
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
          sheet.setFrozenRows(1);
        }
        
        createdSheets.push(sheetName);
      } catch (e) {
        Logger.log(`Erro ao criar aba ${sheetName}: ${e.message}`);
      }
    } else {
      Logger.log(`Aba já existe: ${sheetName}`);
      
      // Opcional: Verificar se os cabeçalhos batem e atualizar se necessário
      // Por segurança, não vamos sobrescrever dados existentes automaticamente
      
      existingSheets.push(sheetName);
    }
  }
  
  Logger.log('--- RESUMO ---');
  Logger.log('Abas criadas: ' + (createdSheets.length > 0 ? createdSheets.join(', ') : 'Nenhuma'));
  Logger.log('Abas já existentes: ' + existingSheets.join(', '));
  
  return {
    created: createdSheets,
    existing: existingSheets
  };
}
