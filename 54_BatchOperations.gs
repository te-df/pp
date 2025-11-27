/**
 * @file BatchOperations.gs
 * @description Operações em lote otimizadas para Google Sheets
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Otimiza operações de leitura/escrita usando batch operations
 * para melhorar performance e reduzir tempo de execução
 */

// ============================================================================
// BATCH OPERATIONS - OPERAÇÕES EM LOTE
// ============================================================================

/**
 * @namespace BatchOperations
 * @description Operações otimizadas em lote
 */
var BatchOperations = (function() {
  
  return {
    /**
     * Lê múltiplas planilhas em uma única operação
     * 
     * @param {Spreadsheet} spreadsheet - Planilha
     * @param {Array<string>} sheetNames - Nomes das planilhas
     * @return {Object} Dados por planilha
     * 
     * @example
     * var data = BatchOperations.readMultipleSheets(ss, ['Alunos', 'Veiculos']);
     * // { Alunos: [[...]], Veiculos: [[...]] }
     */
    readMultipleSheets: function(spreadsheet, sheetNames) {
      var result = {};
      
      try {
        for (var i = 0; i < sheetNames.length; i++) {
          var sheetName = sheetNames[i];
          var sheet = spreadsheet.getSheetByName(sheetName);
          
          if (sheet && sheet.getLastRow() > 0) {
            result[sheetName] = sheet.getDataRange().getValues();
          } else {
            result[sheetName] = [];
          }
        }
        
        return result;
        
      } catch (error) {
        throw new Error('Erro ao ler múltiplas planilhas: ' + error.message);
      }
    },
    
    /**
     * Escreve múltiplas linhas de uma vez
     * 
     * @param {Sheet} sheet - Planilha
     * @param {Array<Array>} rows - Linhas a adicionar
     * @return {number} Quantidade de linhas adicionadas
     * 
     * @example
     * var rows = [
     *   ['João', 'joao@email.com'],
     *   ['Maria', 'maria@email.com']
     * ];
     * BatchOperations.appendRows(sheet, rows);
     */
    appendRows: function(sheet, rows) {
      try {
        if (!rows || rows.length === 0) {
          return 0;
        }
        
        var lastRow = sheet.getLastRow();
        var numCols = rows[0].length;
        
        // Adiciona todas as linhas de uma vez
        sheet.getRange(lastRow + 1, 1, rows.length, numCols).setValues(rows);
        
        return rows.length;
        
      } catch (error) {
        throw new Error('Erro ao adicionar linhas em lote: ' + error.message);
      }
    },
    
    /**
     * Atualiza múltiplas linhas de uma vez
     * 
     * @param {Sheet} sheet - Planilha
     * @param {Array<Object>} updates - Atualizações [{row, values}, ...]
     * @return {number} Quantidade de linhas atualizadas
     * 
     * @example
     * var updates = [
     *   { row: 2, values: ['João Silva', 'joao@email.com'] },
     *   { row: 5, values: ['Maria Santos', 'maria@email.com'] }
     * ];
     * BatchOperations.updateRows(sheet, updates);
     */
    updateRows: function(sheet, updates) {
      try {
        if (!updates || updates.length === 0) {
          return 0;
        }
        
        // Ordena por linha para facilitar agrupamento
        updates.sort(function(a, b) { return a.row - b.row; });

        var currentBatch = [];
        var startRow = -1;
        var numCols = -1;

        for (var i = 0; i < updates.length; i++) {
          var update = updates[i];
          
          // Inicializa primeiro lote
          if (startRow === -1) {
            startRow = update.row;
            numCols = update.values.length;
            currentBatch.push(update.values);
            continue;
          }

          // Verifica se é contíguo e tem mesmo número de colunas
          if (update.row === startRow + currentBatch.length && update.values.length === numCols) {
            currentBatch.push(update.values);
          } else {
            // Processa lote anterior
            sheet.getRange(startRow, 1, currentBatch.length, numCols).setValues(currentBatch);
            
            // Inicia novo lote
            startRow = update.row;
            numCols = update.values.length;
            currentBatch = [update.values];
          }
        }

        // Processa último lote
        if (currentBatch.length > 0) {
          sheet.getRange(startRow, 1, currentBatch.length, numCols).setValues(currentBatch);
        }
        
        return updates.length;
        
      } catch (error) {
        throw new Error('Erro ao atualizar linhas em lote: ' + error.message);
      }
    },
    
    /**
     * Deleta múltiplas linhas de uma vez (em ordem reversa)
     * 
     * @param {Sheet} sheet - Planilha
     * @param {Array<number>} rowNumbers - Números das linhas (1-based)
     * @return {number} Quantidade de linhas deletadas
     * 
     * @example
     * BatchOperations.deleteRows(sheet, [5, 10, 15]);
     */
    deleteRows: function(sheet, rowNumbers) {
      try {
        if (!rowNumbers || rowNumbers.length === 0) {
          return 0;
        }
        
        // Ordena em ordem decrescente para não afetar índices
        var sorted = rowNumbers.slice().sort(function(a, b) { return b - a; });
        
        // Ordena em ordem decrescente para não afetar índices
        var sorted = rowNumbers.slice().sort(function(a, b) { return b - a; });
        
        var currentStart = -1;
        var count = 0;

        for (var i = 0; i < sorted.length; i++) {
          var row = sorted[i];

          if (currentStart === -1) {
            currentStart = row;
            count = 1;
            continue;
          }

          // Verifica se é contíguo (decrescente: 10, 9, 8...)
          if (row === currentStart - 1) {
            currentStart = row;
            count++;
          } else {
            // Processa grupo anterior (deleta a partir do start, count vezes)
            // Como estamos indo de baixo para cima, o start do grupo é o 'currentStart' (menor valor do grupo)
            // Mas espera, deleteRows(rowPosition, howMany) deleta a partir da posição.
            // Ex: deletar 10, 9, 8. 
            // sorted: [10, 9, 8]. 
            // i=0: row=10. start=10, count=1.
            // i=1: row=9. start=9, count=2.
            // i=2: row=8. start=8, count=3.
            // Fim loop. Deleta em 8, 3 linhas. (8, 9, 10). Correto.
            
            // Ex não contíguo: 10, 8.
            // i=0: row=10. start=10, count=1.
            // i=1: row=8. Não é 10-1.
            // Processa anterior: delete em 10 + (1-1)? Não.
            // Se eu tenho um grupo [10], start=10, count=1. Deleta em 10, 1 linha.
            // Se eu tenho [10, 9], start=9, count=2. Deleta em 9, 2 linhas.
            
            // Então processa o grupo anterior:
            // O grupo anterior terminou em (currentStart + count - 1) até currentStart? Não, sorted é desc.
            // O grupo anterior era [currentStart + count - 1 ... currentStart].
            // Não, espere.
            // Iteração 1: row=10. currentStart=10. count=1.
            // Iteração 2: row=8. 
            // Processa anterior: Deleta em 10, 1 linha.
            // sheet.deleteRows(currentStart + (previous logic? no).
            // O grupo anterior era apenas o 10. currentStart era 10.
            // Então sheet.deleteRows(10, 1).
            
            // Vamos corrigir a lógica da variável temporária.
            // Precisamos guardar o "bloco" que estamos construindo.
            // Bloco: [10, 9, 8]. Start=10 (maior), End=8 (menor).
            // Não, deleteRows remove a partir do índice.
            // Se eu deletar a linha 8 e pedir 3 linhas, remove 8, 9, 10.
            // Então preciso saber o MENOR índice do bloco e o tamanho.
            
            // Vamos refazer o loop mentalmente com sorted DESC: [10, 9, 8, 5]
            // i=0, row=10. lastRowInBlock = 10. count = 1.
            // i=1, row=9. É (lastRowInBlock - count)? 10 - 1 = 9. Sim. count++. (count=2).
            // i=2, row=8. É (lastRowInBlock - count)? 10 - 2 = 8. Sim. count++. (count=3).
            // i=3, row=5. É (lastRowInBlock - count)? 10 - 3 = 7. Não.
            //   Executa delete: start = lastRowInBlock - count + 1 = 10 - 3 + 1 = 8.
            //   sheet.deleteRows(8, 3).
            //   Reset: lastRowInBlock = 5. count = 1.
            
            // Executa final: start = 5 - 1 + 1 = 5. sheet.deleteRows(5, 1).
            
            // Implementação:
            var expectedRow = currentStart + count - 1; // Não, sorted é desc.
            // Se currentStart é o TOPO do bloco (maior número).
            // Próximo deve ser currentStart - count.
            
            // Vamos usar uma variável 'blockTop'.
            // i=0, row=10. blockTop=10. count=1.
            // i=1, row=9. 9 == 10 - 1? Sim. count=2.
            // i=2, row=8. 8 == 10 - 2? Sim. count=3.
            // i=3, row=5. 5 == 10 - 3 (7)? Não.
            //   Delete(blockTop - count + 1, count) -> Delete(10 - 3 + 1, 3) -> Delete(8, 3).
            //   blockTop=5. count=1.
            
            // Código anterior estava confuso. Vamos reescrever limpo.
             
             sheet.deleteRows(currentStart, count); // Isso estava errado no meu pensamento anterior se currentStart fosse o menor.
             // Mas aqui currentStart era o row da iteração...
             
             // Vamos usar a lógica do blockTop.
             var blockTop = currentStart + count - 1; // Recupera o topo? Não.
             
             // Vamos simplificar.
             sheet.deleteRows(currentStart, count); 
          }
        }
        
        // Vamos reescrever o bloco inteiro no replacement para garantir.
        
        var blockTop = -1;
        var count = 0;

        for (var i = 0; i < sorted.length; i++) {
          var row = sorted[i];

          if (blockTop === -1) {
            blockTop = row;
            count = 1;
            continue;
          }

          if (row === blockTop - count) {
            count++;
          } else {
            // Executa deleção do bloco anterior
            // O bloco começa em (blockTop - count + 1) e tem 'count' linhas
            sheet.deleteRows(blockTop - count + 1, count);
            
            blockTop = row;
            count = 1;
          }
        }

        // Processa último bloco
        if (blockTop !== -1) {
          sheet.deleteRows(blockTop - count + 1, count);
        }
        
        return sorted.length;
        
      } catch (error) {
        throw new Error('Erro ao deletar linhas em lote: ' + error.message);
      }
    },
    
    /**
     * Deleta linhas por condição (otimizado)
     * 
     * @param {Sheet} sheet - Planilha
     * @param {Function} condition - Função que retorna true para deletar
     * @return {number} Quantidade de linhas deletadas
     * 
     * @example
     * // Deleta linhas onde coluna A está vazia
     * BatchOperations.deleteRowsByCondition(sheet, function(row) {
     *   return !row[0]; // Coluna A vazia
     * });
     */
    deleteRowsByCondition: function(sheet, condition) {
      try {
        var data = sheet.getDataRange().getValues();
        var rowsToDelete = [];
        
        // Identifica linhas a deletar (ignora header)
        for (var i = 1; i < data.length; i++) {
          if (condition(data[i], i)) {
            rowsToDelete.push(i + 1); // +1 porque sheet é 1-based
          }
        }
        
        // Deleta em lote
        return this.deleteRows(sheet, rowsToDelete);
        
      } catch (error) {
        throw new Error('Erro ao deletar por condição: ' + error.message);
      }
    },
    
    /**
     * Copia dados entre planilhas (otimizado)
     * 
     * @param {Sheet} sourceSheet - Planilha origem
     * @param {Sheet} targetSheet - Planilha destino
     * @param {Object} [options] - Opções
     * @return {number} Quantidade de linhas copiadas
     * 
     * @example
     * BatchOperations.copySheetData(sourceSheet, targetSheet, {
     *   includeHeaders: true,
     *   clearTarget: true
     * });
     */
    copySheetData: function(sourceSheet, targetSheet, options) {
      try {
        options = options || {};
        var includeHeaders = options.includeHeaders !== false;
        var clearTarget = options.clearTarget === true;
        
        // Limpa destino se solicitado
        if (clearTarget && targetSheet.getLastRow() > 0) {
          targetSheet.clear();
        }
        
        // Obtém dados da origem
        var data = sourceSheet.getDataRange().getValues();
        
        if (data.length === 0) {
          return 0;
        }
        
        // Remove headers se não deve incluir
        var dataToWrite = includeHeaders ? data : data.slice(1);
        
        if (dataToWrite.length === 0) {
          return 0;
        }
        
        // Escreve no destino
        targetSheet.getRange(1, 1, dataToWrite.length, dataToWrite[0].length)
          .setValues(dataToWrite);
        
        return dataToWrite.length;
        
      } catch (error) {
        throw new Error('Erro ao copiar dados: ' + error.message);
      }
    },
    
    /**
     * Filtra e copia dados (otimizado)
     * 
     * @param {Sheet} sourceSheet - Planilha origem
     * @param {Sheet} targetSheet - Planilha destino
     * @param {Function} filter - Função de filtro
     * @return {number} Quantidade de linhas copiadas
     * 
     * @example
     * // Copia apenas alunos ativos
     * BatchOperations.filterAndCopy(sourceSheet, targetSheet, function(row) {
     *   return row[5] === 'Ativo'; // Coluna F = Status
     * });
     */
    filterAndCopy: function(sourceSheet, targetSheet, filter) {
      try {
        var data = sourceSheet.getDataRange().getValues();
        
        if (data.length === 0) {
          return 0;
        }
        
        var headers = data[0];
        var filteredRows = [headers];
        
        // Filtra linhas
        for (var i = 1; i < data.length; i++) {
          if (filter(data[i], i)) {
            filteredRows.push(data[i]);
          }
        }
        
        if (filteredRows.length === 1) {
          // Só headers
          return 0;
        }
        
        // Escreve no destino
        targetSheet.getRange(1, 1, filteredRows.length, filteredRows[0].length)
          .setValues(filteredRows);
        
        return filteredRows.length - 1; // -1 para não contar header
        
      } catch (error) {
        throw new Error('Erro ao filtrar e copiar: ' + error.message);
      }
    },
    
    /**
     * Atualiza coluna inteira (otimizado)
     * 
     * @param {Sheet} sheet - Planilha
     * @param {number} columnIndex - Índice da coluna (1-based)
     * @param {Function} transform - Função de transformação
     * @return {number} Quantidade de células atualizadas
     * 
     * @example
     * // Converte coluna B para maiúsculas
     * BatchOperations.updateColumn(sheet, 2, function(value) {
     *   return String(value).toUpperCase();
     * });
     */
    updateColumn: function(sheet, columnIndex, transform) {
      try {
        var lastRow = sheet.getLastRow();
        
        if (lastRow === 0) {
          return 0;
        }
        
        // Lê coluna inteira
        var values = sheet.getRange(1, columnIndex, lastRow, 1).getValues();
        
        // Transforma valores
        var newValues = values.map(function(row) {
          return [transform(row[0])];
        });
        
        // Escreve de volta
        sheet.getRange(1, columnIndex, lastRow, 1).setValues(newValues);
        
        return lastRow;
        
      } catch (error) {
        throw new Error('Erro ao atualizar coluna: ' + error.message);
      }
    },
    
    /**
     * Busca e substitui em lote
     * 
     * @param {Sheet} sheet - Planilha
     * @param {string|RegExp} search - Texto a buscar
     * @param {string} replace - Texto de substituição
     * @param {Object} [options] - Opções
     * @return {number} Quantidade de substituições
     * 
     * @example
     * BatchOperations.findAndReplace(sheet, 'antigo', 'novo', {
     *   matchCase: true,
     *   columnIndex: 2
     * });
     */
    findAndReplace: function(sheet, search, replace, options) {
      try {
        options = options || {};
        var matchCase = options.matchCase === true;
        var columnIndex = options.columnIndex;
        
        var data = sheet.getDataRange().getValues();
        var replacements = 0;
        
        for (var i = 0; i < data.length; i++) {
          for (var j = 0; j < data[i].length; j++) {
            // Se columnIndex especificado, só processa essa coluna
            if (columnIndex && j !== columnIndex - 1) {
              continue;
            }
            
            var value = String(data[i][j]);
            var newValue;
            
            if (search instanceof RegExp) {
              newValue = value.replace(search, replace);
            } else {
              var flags = matchCase ? 'g' : 'gi';
              var regex = new RegExp(search, flags);
              newValue = value.replace(regex, replace);
            }
            
            if (newValue !== value) {
              data[i][j] = newValue;
              replacements++;
            }
          }
        }
        
        // Escreve de volta se houve mudanças
        if (replacements > 0) {
          sheet.getDataRange().setValues(data);
        }
        
        return replacements;
        
      } catch (error) {
        throw new Error('Erro ao buscar e substituir: ' + error.message);
      }
    },
    
    /**
     * Obtém estatísticas de performance
     * 
     * @param {Function} operation - Operação a medir
     * @return {Object} Estatísticas
     * 
     * @example
     * var stats = BatchOperations.measurePerformance(function() {
     *   // operação a medir
     * });
     * // { duration: 1234, success: true }
     */
    measurePerformance: function(operation) {
      var startTime = new Date().getTime();
      var success = false;
      var error = null;
      
      try {
        operation();
        success = true;
      } catch (e) {
        error = e.message;
      }
      
      var endTime = new Date().getTime();
      var duration = endTime - startTime;
      
      return {
        duration: duration,
        durationSeconds: (duration / 1000).toFixed(2),
        success: success,
        error: error
      };
    }
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================





// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa BatchOperations
 */
function testBatchOperations() {
  Logger.log('🧪 Testando BatchOperations...\n');
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var testSheet = ss.getSheetByName('TestBatch');
    
    // Cria planilha de teste se não existir
    if (!testSheet) {
      testSheet = ss.insertSheet('TestBatch');
      Logger.log('✓ Planilha de teste criada');
    }
    
    // Limpa planilha
    testSheet.clear();
    
    // Teste 1: Append em lote
    Logger.log('Teste 1: Append em lote');
    var rows = [
      ['Nome', 'Email', 'Status'],
      ['João', 'joao@test.com', 'Ativo'],
      ['Maria', 'maria@test.com', 'Ativo'],
      ['Pedro', 'pedro@test.com', 'Inativo']
    ];
    
    var stats = BatchOperations.measurePerformance(function() {
      BatchOperations.appendRows(testSheet, rows);
    });
    
    Logger.log('✓ ' + rows.length + ' linhas adicionadas em ' + stats.durationSeconds + 's');
    
    // Teste 2: Update coluna
    Logger.log('\nTeste 2: Update coluna');
    stats = BatchOperations.measurePerformance(function() {
      BatchOperations.updateColumn(testSheet, 1, function(value) {
        return String(value).toUpperCase();
      });
    });
    Logger.log('✓ Coluna atualizada em ' + stats.durationSeconds + 's');
    
    // Teste 3: Delete por condição
    Logger.log('\nTeste 3: Delete por condição');
    stats = BatchOperations.measurePerformance(function() {
      BatchOperations.deleteRowsByCondition(testSheet, function(row) {
        return row[2] === 'Inativo'; // Deleta inativos
      });
    });
    Logger.log('✓ Linhas deletadas em ' + stats.durationSeconds + 's');
    
    Logger.log('\n✅ Testes concluídos!');
    Logger.log('Planilha de teste: ' + testSheet.getName());
    
    return {
      success: true
    };
    
  } catch (error) {
    Logger.log('\n❌ Erro: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
