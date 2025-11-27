/**
 * ============================================================================
 * EVENT SERVICE - Gestão de Eventos Escolares
 * ============================================================================
 * 
 * Gerencia 3 tipos de eventos do calendário escolar:
 * 1. DIA_MOVEL - Feriados e pontos facultativos
 * 2. REPOSICAO - Reposição de aulas
 * 3. EXTRACURRICULAR - Atividades extracurriculares
 * 
 * Inspirado em Events.txt
 * Versão: 1.0
 * Data: 2025-10-21
 * ============================================================================
 */

const EVENTOS_SHEET_NAME = 'Eventos';

/**
 * Serviço para gerenciar eventos escolares
 */
const EventService = {

  /**
   * Cria um novo evento na planilha
   * @param {Object} eventData - Dados do evento
   * @returns {Object} Resultado da operação
   */
  createEvent(eventData) {
    try {
      // Validação dos dados
      const validation = this.validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const sheet = ss.getSheetByName(EVENTOS_SHEET_NAME);
      
      if (!sheet) {
        throw new Error(`Planilha "${EVENTOS_SHEET_NAME}" não encontrada`);
      }

      // Gera ID único
      const newId = `EVT-${Date.now()}`;
      const timestamp = new Date();
      const userEmail = Session.getActiveUser().getEmail() || 'sistema';

      // Prepara dados adicionais como JSON
      const dadosAdicionais = this.prepareDadosAdicionais(eventData);

      // Monta linha de dados
      const newRow = [
        newId,
        eventData.eventType || eventData.Tipo_Evento,
        eventData.title || eventData.Titulo || `Evento - ${eventData.eventType}`,
        eventData.description || eventData.Descricao || '',
        new Date(eventData.startDate || eventData.Data_Inicio),
        eventData.endDate ? new Date(eventData.endDate) : new Date(eventData.startDate || eventData.Data_Inicio),
        eventData.schoolName || eventData.Escola || 'TODAS',
        eventData.status || eventData.Status || 'Agendado',
        JSON.stringify(dadosAdicionais),
        userEmail,
        timestamp,
        timestamp
      ];

      sheet.appendRow(newRow);

      // Log de auditoria
      this.logEventAction('CREATE', newId, `Evento criado: ${eventData.title || newId}`);

      Logger.log(`✓ Evento criado com sucesso: ${newId} - ${eventData.title}`);
      
      return { 
        success: true, 
        message: 'Evento registrado com sucesso!', 
        eventId: newId,
        data: {
          id: newId,
          tipo: eventData.eventType,
          titulo: eventData.title
        }
      };

    } catch (error) {
      Logger.log(`✗ Erro em EventService.createEvent: ${error.message}`);
      return { 
        success: false, 
        error: `Falha ao criar evento: ${error.message}` 
      };
    }
  },

  /**
   * Prepara dados adicionais específicos do tipo de evento
   * @param {Object} eventData - Dados do evento
   * @returns {Object} Dados adicionais formatados
   */
  prepareDadosAdicionais(eventData) {
    const dadosAdicionais = {};
    
    switch(eventData.eventType) {
      case 'REPOSICAO':
        if (eventData.originalDate) dadosAdicionais.originalDate = eventData.originalDate;
        if (eventData.time) dadosAdicionais.time = eventData.time;
        if (eventData.reason) dadosAdicionais.reason = eventData.reason;
        break;
        
      case 'EXTRACURRICULAR':
        if (eventData.activityType) dadosAdicionais.activityType = eventData.activityType;
        if (eventData.activityTime) dadosAdicionais.activityTime = eventData.activityTime;
        if (eventData.activityTitle) dadosAdicionais.activityTitle = eventData.activityTitle;
        break;
        
      case 'DIA_MOVEL':
        // Dia móvel geralmente não tem dados adicionais específicos
        break;
    }
    
    return dadosAdicionais;
  },

  /**
   * Valida os dados de um evento
   * @param {Object} data - Dados do evento
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateEventData(data) {
    const errors = [];
    
    if (!data) {
      return { isValid: false, errors: ['Dados do evento não fornecidos'] };
    }
    
    // Validações gerais
    if (!data.eventType && !data.Tipo_Evento) {
      errors.push('O tipo de evento é obrigatório');
    }
    if (!data.startDate && !data.Data_Inicio) {
      errors.push('A data de início é obrigatória');
    }
    if (!data.schoolName && !data.Escola) {
      errors.push('A escola é obrigatória');
    }

    // Validações específicas por tipo
    const eventType = data.eventType || data.Tipo_Evento;
    
    switch (eventType) {
      case 'DIA_MOVEL':
        if (!data.description && !data.Descricao) {
          errors.push('A descrição é obrigatória para Dia Móvel');
        }
        break;
        
      case 'REPOSICAO':
        if (!data.originalDate) {
          errors.push('A data original da aula é obrigatória para reposição');
        }
        if (!data.reason) {
          errors.push('O motivo da reposição é obrigatório');
        }
        break;
        
      case 'EXTRACURRICULAR':
        if (!data.activityTitle && !data.title && !data.Titulo) {
          errors.push('O título da atividade é obrigatório');
        }
        if (!data.activityType) {
          errors.push('O tipo da atividade é obrigatório');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Obtém todos os eventos registrados
   * @param {Object} filters - Filtros opcionais
   * @returns {Object} Lista de eventos
   */
  getEvents(filters = {}) {
    try {
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const sheet = ss.getSheetByName(EVENTOS_SHEET_NAME);
      
      if (!sheet) {
        return { success: true, data: [] };
      }

      const data = sheet.getDataRange().getValues();
      if (data.length < 2) {
        return { success: true, data: [] };
      }

      const headers = data.shift();
      const events = data.map(row => {
        const event = {};
        headers.forEach((header, index) => {
          event[header] = row[index];
        });
        return event;
      });

      // Aplica filtros se houver
      let filteredEvents = events;
      if (filters.tipo) {
        filteredEvents = filteredEvents.filter(e => e.Tipo_Evento === filters.tipo);
      }
      if (filters.escola) {
        filteredEvents = filteredEvents.filter(e => e.Escola === filters.escola);
      }
      if (filters.status) {
        filteredEvents = filteredEvents.filter(e => e.Status === filters.status);
      }

      return { success: true, data: filteredEvents };

    } catch (error) {
      Logger.log(`✗ Erro em EventService.getEvents: ${error.message}`);
      return { 
        success: false, 
        error: `Falha ao carregar eventos: ${error.message}` 
      };
    }
  },

  /**
   * Obtém estatísticas de eventos (para dashboard)
   * @returns {Object} Estatísticas
   */
  getEventStats() {
    try {
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const sheet = ss.getSheetByName(EVENTOS_SHEET_NAME);
      
      if (!sheet) {
        return {
          success: true,
          data: { diasMoveis: 0, reposicoes: 0, atividadesExtra: 0, total: 0 }
        };
      }

      const data = sheet.getDataRange().getValues();
      if (data.length < 2) {
        return {
          success: true,
          data: { diasMoveis: 0, reposicoes: 0, atividadesExtra: 0, total: 0 }
        };
      }

      const headers = data[0];
      const typeIndex = headers.indexOf('Tipo_Evento');

      if (typeIndex === -1) {
        return {
          success: true,
          data: { diasMoveis: 0, reposicoes: 0, atividadesExtra: 0, total: 0 }
        };
      }

      let diasMoveis = 0;
      let reposicoes = 0;
      let atividadesExtra = 0;

      for (let i = 1; i < data.length; i++) {
        const eventType = data[i][typeIndex];
        if (eventType === 'DIA_MOVEL') diasMoveis++;
        else if (eventType === 'REPOSICAO') reposicoes++;
        else if (eventType === 'EXTRACURRICULAR') atividadesExtra++;
      }

      return {
        success: true,
        data: { 
          diasMoveis, 
          reposicoes, 
          atividadesExtra,
          total: diasMoveis + reposicoes + atividadesExtra
        }
      };

    } catch (error) {
      Logger.log(`✗ Erro em EventService.getEventStats: ${error.message}`);
      return {
        success: false,
        error: `Falha ao carregar estatísticas: ${error.message}`,
        data: { diasMoveis: 0, reposicoes: 0, atividadesExtra: 0, total: 0 }
      };
    }
  },

  /**
   * Obtém lista de escolas para dropdown
   * @returns {Object} Lista de escolas
   */
  getSchools() {
    try {
      // Extrai escolas únicas da planilha Alunos
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const alunosSheet = ss.getSheetByName('Alunos');
      
      if (!alunosSheet) {
        // Retorna lista padrão se planilha não existir
        return {
          success: true,
          data: [
            'Escola Central',
            'Escola Sul',
            'Colégio Norte',
            'CEF 01 Planaltina',
            'CED 03 Sobradinho'
          ]
        };
      }

      const data = alunosSheet.getDataRange().getValues();
      if (data.length < 2) {
        return { success: true, data: [] };
      }

      // Tenta encontrar coluna de escola/rota
      const headers = data[0];
      let escolaIndex = -1;
      
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toString().toLowerCase();
        if (header.includes('escola') || header.includes('destino')) {
          escolaIndex = i;
          break;
        }
      }

      const schools = new Set();
      if (escolaIndex !== -1) {
        for (let i = 1; i < data.length; i++) {
          const escola = data[i][escolaIndex];
          if (escola && escola.toString().trim()) {
            schools.add(escola.toString().trim());
          }
        }
      }

      // Se não encontrou escolas, usa dados da planilha Rotas
      if (schools.size === 0) {
        const rotasSheet = ss.getSheetByName('Rotas');
        if (rotasSheet) {
          const rotasData = rotasSheet.getDataRange().getValues();
          if (rotasData.length > 1) {
            const rotasHeaders = rotasData[0];
            const destinoIndex = rotasHeaders.findIndex(h => 
              h.toString().toLowerCase().includes('destino') || 
              h.toString().toLowerCase().includes('escola')
            );
            
            if (destinoIndex !== -1) {
              for (let i = 1; i < rotasData.length; i++) {
                const destino = rotasData[i][destinoIndex];
                if (destino && destino.toString().trim()) {
                  schools.add(destino.toString().trim());
                }
              }
            }
          }
        }
      }

      const schoolsList = Array.from(schools).sort();
      
      return { 
        success: true, 
        data: schoolsList.length > 0 ? schoolsList : [
          'Escola Central',
          'Escola Sul',
          'Colégio Norte'
        ]
      };

    } catch (error) {
      Logger.log(`✗ Erro em EventService.getSchools: ${error.message}`);
      // Retorna lista padrão em caso de erro
      return {
        success: true,
        data: [
          'Escola Central',
          'Escola Sul',
          'Colégio Norte'
        ]
      };
    }
  },

  /**
   * Atualiza um evento existente
   * @param {string} eventId - ID do evento
   * @param {Object} eventData - Novos dados do evento
   * @returns {Object} Resultado da operação
   */
  updateEvent(eventId, eventData) {
    try {
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const sheet = ss.getSheetByName(EVENTOS_SHEET_NAME);
      
      if (!sheet) {
        throw new Error(`Planilha "${EVENTOS_SHEET_NAME}" não encontrada`);
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('ID');

      if (idIndex === -1) {
        throw new Error('Coluna ID não encontrada');
      }

      // Encontra a linha do evento
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === eventId) {
          rowIndex = i + 1; // +1 porque sheet rows são 1-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Evento ${eventId} não encontrado`);
      }

      // Atualiza campos específicos
      const updateIndex = headers.indexOf('Atualizado_Em');
      if (updateIndex !== -1) {
        sheet.getRange(rowIndex, updateIndex + 1).setValue(new Date());
      }

      // Atualiza outros campos se fornecidos
      if (eventData.Status) {
        const statusIndex = headers.indexOf('Status');
        if (statusIndex !== -1) {
          sheet.getRange(rowIndex, statusIndex + 1).setValue(eventData.Status);
        }
      }

      this.logEventAction('UPDATE', eventId, `Evento atualizado: ${eventId}`);

      return { success: true, message: 'Evento atualizado com sucesso!' };

    } catch (error) {
      Logger.log(`✗ Erro em EventService.updateEvent: ${error.message}`);
      return { 
        success: false, 
        error: `Falha ao atualizar evento: ${error.message}` 
      };
    }
  },

  /**
   * Remove um evento
   * @param {string} eventId - ID do evento
   * @returns {Object} Resultado da operação
   */
  deleteEvent(eventId) {
    try {
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const sheet = ss.getSheetByName(EVENTOS_SHEET_NAME);
      
      if (!sheet) {
        throw new Error(`Planilha "${EVENTOS_SHEET_NAME}" não encontrada`);
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('ID');

      if (idIndex === -1) {
        throw new Error('Coluna ID não encontrada');
      }

      // Encontra a linha do evento
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === eventId) {
          sheet.deleteRow(i + 1);
          this.logEventAction('DELETE', eventId, `Evento removido: ${eventId}`);
          return { success: true, message: 'Evento removido com sucesso!' };
        }
      }

      throw new Error(`Evento ${eventId} não encontrado`);

    } catch (error) {
      Logger.log(`✗ Erro em EventService.deleteEvent: ${error.message}`);
      return { 
        success: false, 
        error: `Falha ao remover evento: ${error.message}` 
      };
    }
  },

  /**
   * Registra ação em log
   * @param {string} action - Tipo de ação
   * @param {string} eventId - ID do evento
   * @param {string} details - Detalhes da ação
   */
  logEventAction(action, eventId, details) {
    try {
      const ss = getSpreadsheet(); // ✅ Usa função centralizada
      const logsSheet = ss.getSheetByName('Logs');
      
      if (!logsSheet) return;

      const logId = `LOG-${Date.now()}`;
      const timestamp = new Date();
      const user = Session.getActiveUser().getEmail() || 'sistema';

      logsSheet.appendRow([
        logId,
        timestamp,
        user,
        `Evento ${action}`,
        details,
        'Sucesso'
      ]);

    } catch (error) {
      Logger.log(`⚠️ Erro ao registrar log: ${error.message}`);
      // Não propaga erro de log
    }
  }
};

// ============================================================================
// FUNÇÕES GLOBAIS EXPOSTAS PARA FRONTEND
// ============================================================================

/**
 * Cria um novo evento
 * @param {Object} eventData - Dados do evento
 * @returns {Object} Resultado da operação
 */
function createEvent(eventData) {
  return EventService.createEvent(eventData);
}

/**
 * Obtém todos os eventos
 * @param {Object} filters - Filtros opcionais
 * @returns {Object} Lista de eventos
 */
function getEvents(filters) {
  return EventService.getEvents(filters || {});
}

/**
 * Obtém estatísticas de eventos
 * @returns {Object} Estatísticas
 */
function getEventStats() {
  return EventService.getEventStats();
}

/**
 * Obtém lista de escolas
 * @returns {Object} Lista de escolas
 */
function getSchools() {
  return EventService.getSchools();
}

/**
 * Atualiza um evento
 * @param {string} eventId - ID do evento
 * @param {Object} eventData - Novos dados
 * @returns {Object} Resultado
 */
function updateEvent(eventId, eventData) {
  return EventService.updateEvent(eventId, eventData);
}

/**
 * Remove um evento
 * @param {string} eventId - ID do evento
 * @returns {Object} Resultado
 */
function deleteEvent(eventId) {
  return EventService.deleteEvent(eventId);
}
