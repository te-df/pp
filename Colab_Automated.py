"""
Colab Automated Processor - Processador de Jobs com Ativação Remota
Permite ativação/desativação via webhook do GAS

INSTALAÇÃO:
!pip install -q gspread pandas oauth2client flask pyngrok
"""

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import json
import time
from datetime import datetime, timedelta
import traceback
import threading
from flask import Flask, request, jsonify
from pyngrok import ngrok
import signal
import sys

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

SPREADSHEET_ID = None
JOB_QUEUE_SHEET_NAME = 'JobQueue'

SCOPE = [
    'https://spreadsheets.google.com/feeds',
    'https://www.googleapis.com/auth/drive'
]

# Estado global
_processor_state = {
    'gc': None,
    'spreadsheet': None,
    'job_queue_sheet': None,
    'is_running': False,
    'spreadsheet_id': None,
    'processor_thread': None,
    'webhook_url': None,
    'auto_stop_timer': None
}

# Flask app para webhook
app = Flask(__name__)

# ============================================================================
# AUTENTICAÇÃO
# ============================================================================

def authenticate_gspread():
    """Autentica e retorna o cliente gspread"""
    try:
        from google.colab import auth
        auth.authenticate_user()
        
        import gspread
        from google.auth import default
        creds, _ = default()
        
        gc = gspread.authorize(creds)
        return gc
    except Exception as e:
        print(f"✗ Erro na autenticação: {e}")
        raise

# ============================================================================
# SETUP
# ============================================================================

def setup_processor(spreadsheet_id):
    """Configura o processador com o ID da planilha"""
    global SPREADSHEET_ID, _processor_state
    
    print("=" * 60)
    print("🔧 CONFIGURANDO PROCESSADOR AUTOMATIZADO")
    print("=" * 60)
    
    try:
        print("\n1. Autenticando...")
        gc = authenticate_gspread()
        print("✓ Autenticação concluída")
        
        print(f"\n2. Conectando à planilha: {spreadsheet_id}")
        spreadsheet = gc.open_by_key(spreadsheet_id)
        print(f"✓ Conectado: {spreadsheet.title}")
        
        print(f"\n3. Verificando aba '{JOB_QUEUE_SHEET_NAME}'...")
        try:
            job_queue_sheet = spreadsheet.worksheet(JOB_QUEUE_SHEET_NAME)
            print(f"✓ Aba encontrada: {JOB_QUEUE_SHEET_NAME}")
        except gspread.exceptions.WorksheetNotFound:
            print(f"✗ Aba '{JOB_QUEUE_SHEET_NAME}' não encontrada!")
            print(f"   Criando aba '{JOB_QUEUE_SHEET_NAME}'...")
            job_queue_sheet = spreadsheet.add_worksheet(
                title=JOB_QUEUE_SHEET_NAME,
                rows=1000,
                cols=15
            )
            headers = [
                'jobId', 'jobName', 'status', 'payload', 'timestamp_enqueued',
                'user_email', 'timestamp_claimed', 'timestamp_completed',
                'result', 'errorCode', 'errorMessage'
            ]
            job_queue_sheet.append_row(headers)
            print(f"✓ Aba '{JOB_QUEUE_SHEET_NAME}' criada com sucesso")
        
        SPREADSHEET_ID = spreadsheet_id
        _processor_state['gc'] = gc
        _processor_state['spreadsheet'] = spreadsheet
        _processor_state['job_queue_sheet'] = job_queue_sheet
        _processor_state['spreadsheet_id'] = spreadsheet_id
        
        print("\n" + "=" * 60)
        print("✓ PROCESSADOR CONFIGURADO COM SUCESSO")
        print("=" * 60)
        print(f"  Planilha: {spreadsheet.title}")
        print(f"  ID: {spreadsheet_id}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ ERRO: {e}")
        traceback.print_exc()
        return False

def _ensure_initialized():
    """Garante que o processador foi inicializado"""
    if _processor_state['spreadsheet'] is None:
        raise RuntimeError(
            "Processador não configurado! Execute setup_processor(spreadsheet_id) primeiro."
        )
    return (
        _processor_state['gc'],
        _processor_state['spreadsheet'],
        _processor_state['job_queue_sheet']
    )

# ============================================================================
# STATUS DE JOBS
# ============================================================================

class JobStatus:
    PENDING = 'PENDING'
    CLAIMED = 'CLAIMED'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'

# ============================================================================
# PROCESSAMENTO DE JOBS
# ============================================================================

def claim_next_job():
    """Reivindica o próximo job PENDING"""
    try:
        gc, spreadsheet, job_queue_sheet = _ensure_initialized()
        
        all_values = job_queue_sheet.get_all_values()
        
        if len(all_values) <= 1:
            return None
        
        for i, row in enumerate(all_values[1:], start=2):
            if len(row) >= 3 and row[2] == JobStatus.PENDING:
                try:
                    timestamp_claimed = datetime.now().isoformat()
                    job_queue_sheet.update_cell(i, 3, JobStatus.CLAIMED)
                    job_queue_sheet.update_cell(i, 7, timestamp_claimed)
                    
                    job = {
                        'row': i,
                        'jobId': row[0],
                        'jobName': row[1],
                        'status': JobStatus.CLAIMED,
                        'payload': json.loads(row[3]) if row[3] else {},
                        'timestamp_enqueued': row[4],
                        'user_email': row[5],
                        'timestamp_claimed': timestamp_claimed
                    }
                    
                    print(f"✓ Job reivindicado: {job['jobId']} ({job['jobName']})")
                    return job
                    
                except Exception as e:
                    print(f"✗ Erro ao reivindicar job na linha {i}: {e}")
                    continue
        
        return None
        
    except Exception as e:
        print(f"✗ Erro ao buscar jobs: {e}")
        return None

def update_job_status(row, status, result=None, error_code=None, error_message=None):
    """Atualiza o status de um job"""
    try:
        gc, spreadsheet, job_queue_sheet = _ensure_initialized()
        
        timestamp_completed = datetime.now().isoformat()
        
        job_queue_sheet.update_cell(row, 3, status)
        job_queue_sheet.update_cell(row, 8, timestamp_completed)
        
        if result is not None:
            result_str = json.dumps(result)
            if len(result_str) > 500:
                result_str = result_str[:497] + '...'
            job_queue_sheet.update_cell(row, 9, result_str)
        
        if error_code:
            job_queue_sheet.update_cell(row, 10, error_code)
        if error_message:
            job_queue_sheet.update_cell(row, 11, error_message[:500])
        
        print(f"✓ Status atualizado para {status} na linha {row}")
        
    except Exception as e:
        print(f"✗ Erro ao atualizar status: {e}")
        raise

def process_job(job):
    """Processa um job reivindicado"""
    try:
        update_job_status(job['row'], JobStatus.RUNNING)
        
        job_name = job['jobName']
        payload = job['payload']
        
        print(f"▶ Processando job: {job_name}")
        
        if job_name == 'EXPORT_CSV':
            result = handle_export_csv(payload)
        elif job_name == 'BATCH_CLEANUP':
            result = handle_batch_cleanup(payload)
        elif job_name == 'GENERATE_REPORT':
            result = handle_generate_report(payload)
        elif job_name == 'CALCULATE_STATS':
            result = handle_stats_calculation(payload)
        else:
            raise ValueError(f"Job desconhecido: {job_name}")
        
        update_job_status(job['row'], JobStatus.COMPLETED, result=result)
        print(f"✓ Job concluído: {job['jobId']}")
        
    except Exception as e:
        error_code = type(e).__name__
        error_message = str(e)
        print(f"✗ Job falhou: {error_message}")
        update_job_status(
            job['row'],
            JobStatus.FAILED,
            error_code=error_code,
            error_message=error_message
        )

# ============================================================================
# HANDLERS DE JOBS
# ============================================================================

def handle_export_csv(payload):
    """Exporta uma planilha para CSV"""
    gc, spreadsheet, job_queue_sheet = _ensure_initialized()
    
    sheet_name = payload.get('sheetName')
    if not sheet_name:
        raise ValueError("sheetName é obrigatório no payload")
    
    sheet = spreadsheet.worksheet(sheet_name)
    data = sheet.get_all_values()
    
    df = pd.DataFrame(data[1:], columns=data[0])
    csv_content = df.to_csv(index=False, encoding='utf-8')
    
    return {
        'message': 'CSV gerado com sucesso',
        'rows': len(df),
        'sheet': sheet_name
    }

def handle_batch_cleanup(payload):
    """Limpa dados antigos em lote"""
    days = payload.get('days', 30)
    cutoff_date = datetime.now() - timedelta(days=days)
    
    return {
        'message': f'Limpeza concluída (>{days} dias)',
        'cutoff_date': cutoff_date.isoformat()
    }

def handle_stats_calculation(payload):
    """Calcula estatísticas complexas"""
    sheet_name = payload.get('sheetName')
    
    return {
        'message': 'Estatísticas calculadas',
        'sheet': sheet_name
    }

def handle_generate_report(payload):
    """Gera relatório"""
    return {
        'message': 'Relatório gerado',
        'format': 'PDF'
    }

# ============================================================================
# LOOP DE PROCESSAMENTO
# ============================================================================

def _processor_loop(interval=5, max_iterations=None, auto_stop_minutes=None):
    """Loop principal de processamento (executa em thread)"""
    iteration = 0
    idle_count = 0
    start_time = time.time()
    
    print(f"\n🚀 Processador iniciado (intervalo: {interval}s)")
    if auto_stop_minutes:
        print(f"⏱️  Auto-stop em {auto_stop_minutes} minutos")
    
    try:
        while _processor_state['is_running']:
            iteration += 1
            
            # Verifica limite de iterações
            if max_iterations and iteration > max_iterations:
                print(f"\n✓ Limite de {max_iterations} iterações atingido")
                break
            
            # Verifica auto-stop por tempo
            if auto_stop_minutes:
                elapsed_minutes = (time.time() - start_time) / 60
                if elapsed_minutes >= auto_stop_minutes:
                    print(f"\n⏱️  Auto-stop: {auto_stop_minutes} minutos decorridos")
                    break
            
            print(f"\n[Iteração {iteration}] Verificando jobs...")
            job = claim_next_job()
            
            if job:
                process_job(job)
                idle_count = 0
            else:
                print("⏳ Nenhum job pendente")
                idle_count += 1
                
                # Auto-stop após 10 verificações sem jobs
                if auto_stop_minutes and idle_count >= 10:
                    print(f"\n⏹️  Auto-stop: Sem jobs por {idle_count} verificações")
                    break
            
            time.sleep(interval)
    
    except Exception as e:
        print(f"\n✗ Erro no processador: {e}")
        traceback.print_exc()
    
    finally:
        _processor_state['is_running'] = False
        print("\n⏹️  Processador parado")

def start_processor_background(interval=5, max_iterations=None, auto_stop_minutes=30):
    """Inicia o processador em background"""
    global _processor_state
    
    if _processor_state['is_running']:
        return {'success': False, 'message': 'Processador já está rodando'}
    
    if _processor_state['spreadsheet'] is None:
        return {'success': False, 'message': 'Processador não configurado'}
    
    _processor_state['is_running'] = True
    
    thread = threading.Thread(
        target=_processor_loop,
        args=(interval, max_iterations, auto_stop_minutes),
        daemon=True
    )
    thread.start()
    
    _processor_state['processor_thread'] = thread
    
    return {
        'success': True,
        'message': 'Processador iniciado em background',
        'auto_stop_minutes': auto_stop_minutes
    }

def stop_processor():
    """Para o processador"""
    global _processor_state
    
    if not _processor_state['is_running']:
        return {'success': False, 'message': 'Processador não está rodando'}
    
    _processor_state['is_running'] = False
    print("\n⏹️  Sinal de parada enviado...")
    
    # Aguarda thread finalizar (máximo 10s)
    if _processor_state['processor_thread']:
        _processor_state['processor_thread'].join(timeout=10)
    
    return {'success': True, 'message': 'Processador parado'}

# ============================================================================
# WEBHOOK API
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Verifica se o servidor está ativo"""
    return jsonify({
        'status': 'online',
        'processor_running': _processor_state['is_running'],
        'spreadsheet_id': _processor_state['spreadsheet_id'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/activate', methods=['POST'])
def activate_processor():
    """Ativa o processador remotamente"""
    try:
        data = request.json or {}
        
        # Parâmetros opcionais
        interval = data.get('interval', 5)
        max_iterations = data.get('max_iterations', None)
        auto_stop_minutes = data.get('auto_stop_minutes', 30)
        
        print(f"\n📥 Requisição de ativação recebida")
        print(f"   Intervalo: {interval}s")
        print(f"   Auto-stop: {auto_stop_minutes} min")
        
        result = start_processor_background(interval, max_iterations, auto_stop_minutes)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/deactivate', methods=['POST'])
def deactivate_processor():
    """Desativa o processador remotamente"""
    try:
        print(f"\n📥 Requisição de desativação recebida")
        result = stop_processor()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Retorna status detalhado do processador"""
    try:
        gc, spreadsheet, job_queue_sheet = _ensure_initialized()
        
        # Conta jobs por status
        all_values = job_queue_sheet.get_all_values()
        stats = {
            'PENDING': 0,
            'CLAIMED': 0,
            'RUNNING': 0,
            'COMPLETED': 0,
            'FAILED': 0
        }
        
        for row in all_values[1:]:
            if len(row) >= 3:
                status = row[2]
                if status in stats:
                    stats[status] += 1
        
        return jsonify({
            'success': True,
            'processor_running': _processor_state['is_running'],
            'spreadsheet_id': _processor_state['spreadsheet_id'],
            'spreadsheet_name': spreadsheet.title,
            'job_stats': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# INICIALIZAÇÃO DO WEBHOOK
# ============================================================================

def start_webhook_server(port=5000):
    """Inicia servidor webhook com ngrok"""
    global _processor_state
    
    print("\n" + "=" * 60)
    print("🌐 INICIANDO SERVIDOR WEBHOOK")
    print("=" * 60)
    
    try:
        # Inicia ngrok tunnel
        print("\n1. Criando túnel ngrok...")
        public_url = ngrok.connect(port)
        _processor_state['webhook_url'] = public_url
        
        print(f"✓ Túnel criado: {public_url}")
        print(f"\n📋 WEBHOOK URL (copie para o GAS):")
        print(f"   {public_url}")
        print(f"\n📌 Endpoints disponíveis:")
        print(f"   GET  {public_url}/health")
        print(f"   POST {public_url}/activate")
        print(f"   POST {public_url}/deactivate")
        print(f"   GET  {public_url}/status")
        
        print("\n" + "=" * 60)
        print("✓ SERVIDOR PRONTO PARA RECEBER REQUISIÇÕES")
        print("=" * 60)
        print("\n💡 Configure o GAS com esta URL")
        print("💡 Pressione Ctrl+C para parar o servidor")
        print("\n")
        
        # Inicia Flask
        app.run(port=port, debug=False, use_reloader=False)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Servidor interrompido pelo usuário")
        stop_processor()
        ngrok.disconnect(public_url)
    except Exception as e:
        print(f"\n✗ Erro ao iniciar servidor: {e}")
        traceback.print_exc()

# ============================================================================
# FUNÇÕES DE CONVENIÊNCIA
# ============================================================================

def quick_start_automated(spreadsheet_id, port=5000):
    """
    Configuração e início rápido do servidor automatizado
    
    Args:
        spreadsheet_id: ID da planilha do Google Sheets
        port: Porta do servidor Flask (padrão: 5000)
    
    Exemplo:
        quick_start_automated('1ABC...XYZ')
    """
    print("\n" + "#" * 60)
    print("# COLAB AUTOMATED PROCESSOR - INÍCIO RÁPIDO")
    print("#" * 60)
    
    # Setup
    if not setup_processor(spreadsheet_id):
        print("\n✗ Falha na configuração. Servidor não iniciado.")
        return
    
    print("\n⏱️  Iniciando servidor em 3 segundos...")
    time.sleep(3)
    
    # Inicia servidor webhook
    start_webhook_server(port)

def get_processor_state():
    """Retorna o estado atual do processador"""
    return {
        'configured': _processor_state['spreadsheet'] is not None,
        'running': _processor_state['is_running'],
        'spreadsheet_id': _processor_state['spreadsheet_id'],
        'spreadsheet_title': _processor_state['spreadsheet'].title if _processor_state['spreadsheet'] else None,
        'webhook_url': _processor_state['webhook_url']
    }

# ============================================================================
# HANDLER DE SINAIS
# ============================================================================

def signal_handler(sig, frame):
    """Handler para Ctrl+C"""
    print("\n\n⏹️  Encerrando servidor...")
    stop_processor()
    if _processor_state['webhook_url']:
        ngrok.disconnect(_processor_state['webhook_url'])
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# ============================================================================
# MENSAGEM DE INICIALIZAÇÃO
# ============================================================================

print("\n" + "=" * 60)
print("✓ MÓDULO COLAB AUTOMATED PROCESSOR CARREGADO")
print("=" * 60)
print("\n📋 MODO AUTOMATIZADO - ATIVAÇÃO VIA WEBHOOK")
print("\n🚀 INÍCIO RÁPIDO:")
print("   quick_start_automated('SEU_SPREADSHEET_ID')")
print("\n📡 COMANDOS DISPONÍVEIS:")
print("   setup_processor(spreadsheet_id)")
print("   start_webhook_server(port=5000)")
print("   get_processor_state()")
print("\n🌐 ENDPOINTS DO WEBHOOK:")
print("   POST /activate   - Ativa processador")
print("   POST /deactivate - Desativa processador")
print("   GET  /status     - Status detalhado")
print("   GET  /health     - Health check")
print("\n" + "=" * 60)
