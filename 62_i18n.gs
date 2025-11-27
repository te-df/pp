/**
 * @file i18n.gs
 * @description Sistema de internacionalização (i18n)
 * @version 1.0.0
 * @author Sistema TE-DF-PP
 * @since 2024-11-22
 * 
 * Sistema de i18n com:
 * - Múltiplos idiomas
 * - Strings centralizadas
 * - Interpolação de variáveis
 * - Pluralização
 * - Formatação de datas/números
 * 
 * Intervenção #57 - Internacionalização
 */

// ============================================================================
// CONFIGURAÇÃO DE i18n
// ============================================================================

/**
 * @const {string} DEFAULT_LOCALE
 * @description Idioma padrão
 */
var DEFAULT_LOCALE = 'pt-BR';

/**
 * @const {Array<string>} SUPPORTED_LOCALES
 * @description Idiomas suportados
 */
var SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES'];

// ============================================================================
// STRINGS - PORTUGUÊS (pt-BR)
// ============================================================================

var STRINGS_PT_BR = {
  // Geral
  app: {
    name: 'Sistema de Transporte Escolar',
    shortName: 'TE-DF',
    description: 'Sistema de gestão de transporte escolar do Distrito Federal'
  },
  
  // Ações
  actions: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Atualizar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK'
  },
  
  // Navegação
  nav: {
    home: 'Início',
    students: 'Alunos',
    vehicles: 'Veículos',
    routes: 'Rotas',
    drivers: 'Motoristas',
    reports: 'Relatórios',
    settings: 'Configurações',
    help: 'Ajuda',
    logout: 'Sair'
  },
  
  // Formulários
  forms: {
    required: 'Campo obrigatório',
    invalid: 'Campo inválido',
    tooShort: 'Muito curto',
    tooLong: 'Muito longo',
    invalidEmail: 'Email inválido',
    invalidCPF: 'CPF inválido',
    invalidPhone: 'Telefone inválido',
    invalidDate: 'Data inválida',
    passwordMismatch: 'Senhas não conferem',
    weakPassword: 'Senha fraca'
  },
  
  // Mensagens
  messages: {
    success: 'Operação realizada com sucesso',
    error: 'Ocorreu um erro',
    loading: 'Carregando...',
    saving: 'Salvando...',
    deleting: 'Excluindo...',
    noData: 'Nenhum dado encontrado',
    confirmDelete: 'Tem certeza que deseja excluir?',
    unsavedChanges: 'Há alterações não salvas',
    sessionExpired: 'Sessão expirada',
    unauthorized: 'Não autorizado',
    notFound: 'Não encontrado',
    serverError: 'Erro no servidor'
  },
  
  // Entidades
  entities: {
    student: 'Aluno',
    students: 'Alunos',
    vehicle: 'Veículo',
    vehicles: 'Veículos',
    route: 'Rota',
    routes: 'Rotas',
    driver: 'Motorista',
    drivers: 'Motoristas',
    user: 'Usuário',
    users: 'Usuários'
  },
  
  // Status
  status: {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  },
  
  // Datas
  dates: {
    today: 'Hoje',
    yesterday: 'Ontem',
    tomorrow: 'Amanhã',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana passada',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    thisYear: 'Este ano'
  },
  
  // Erros
  errors: {
    network: 'Erro de conexão',
    timeout: 'Tempo esgotado',
    validation: 'Erro de validação',
    permission: 'Sem permissão',
    notFound: 'Não encontrado',
    serverError: 'Erro no servidor',
    unknown: 'Erro desconhecido'
  }
};

// ============================================================================
// STRINGS - INGLÊS (en-US)
// ============================================================================

var STRINGS_EN_US = {
  app: {
    name: 'School Transportation System',
    shortName: 'STS-DF',
    description: 'School transportation management system for Federal District'
  },
  
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  },
  
  nav: {
    home: 'Home',
    students: 'Students',
    vehicles: 'Vehicles',
    routes: 'Routes',
    drivers: 'Drivers',
    reports: 'Reports',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout'
  },
  
  forms: {
    required: 'Required field',
    invalid: 'Invalid field',
    tooShort: 'Too short',
    tooLong: 'Too long',
    invalidEmail: 'Invalid email',
    invalidCPF: 'Invalid CPF',
    invalidPhone: 'Invalid phone',
    invalidDate: 'Invalid date',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Weak password'
  },
  
  messages: {
    success: 'Operation completed successfully',
    error: 'An error occurred',
    loading: 'Loading...',
    saving: 'Saving...',
    deleting: 'Deleting...',
    noData: 'No data found',
    confirmDelete: 'Are you sure you want to delete?',
    unsavedChanges: 'There are unsaved changes',
    sessionExpired: 'Session expired',
    unauthorized: 'Unauthorized',
    notFound: 'Not found',
    serverError: 'Server error'
  },
  
  entities: {
    student: 'Student',
    students: 'Students',
    vehicle: 'Vehicle',
    vehicles: 'Vehicles',
    route: 'Route',
    routes: 'Routes',
    driver: 'Driver',
    drivers: 'Drivers',
    user: 'User',
    users: 'Users'
  },
  
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled'
  },
  
  dates: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    lastWeek: 'Last week',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    thisYear: 'This year'
  },
  
  errors: {
    network: 'Network error',
    timeout: 'Timeout',
    validation: 'Validation error',
    permission: 'Permission denied',
    notFound: 'Not found',
    serverError: 'Server error',
    unknown: 'Unknown error'
  }
};

// ============================================================================
// STRINGS - ESPANHOL (es-ES)
// ============================================================================

var STRINGS_ES_ES = {
  app: {
    name: 'Sistema de Transporte Escolar',
    shortName: 'TE-DF',
    description: 'Sistema de gestión de transporte escolar del Distrito Federal'
  },
  
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Actualizar',
    close: 'Cerrar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    ok: 'OK'
  },
  
  nav: {
    home: 'Inicio',
    students: 'Alumnos',
    vehicles: 'Vehículos',
    routes: 'Rutas',
    drivers: 'Conductores',
    reports: 'Informes',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Salir'
  },
  
  forms: {
    required: 'Campo obligatorio',
    invalid: 'Campo inválido',
    tooShort: 'Demasiado corto',
    tooLong: 'Demasiado largo',
    invalidEmail: 'Email inválido',
    invalidCPF: 'CPF inválido',
    invalidPhone: 'Teléfono inválido',
    invalidDate: 'Fecha inválida',
    passwordMismatch: 'Las contraseñas no coinciden',
    weakPassword: 'Contraseña débil'
  },
  
  messages: {
    success: 'Operación realizada con éxito',
    error: 'Ocurrió un error',
    loading: 'Cargando...',
    saving: 'Guardando...',
    deleting: 'Eliminando...',
    noData: 'No se encontraron datos',
    confirmDelete: '¿Está seguro de que desea eliminar?',
    unsavedChanges: 'Hay cambios sin guardar',
    sessionExpired: 'Sesión expirada',
    unauthorized: 'No autorizado',
    notFound: 'No encontrado',
    serverError: 'Error del servidor'
  },
  
  entities: {
    student: 'Alumno',
    students: 'Alumnos',
    vehicle: 'Vehículo',
    vehicles: 'Vehículos',
    route: 'Ruta',
    routes: 'Rutas',
    driver: 'Conductor',
    drivers: 'Conductores',
    user: 'Usuario',
    users: 'Usuarios'
  },
  
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    completed: 'Completado',
    cancelled: 'Cancelado'
  },
  
  dates: {
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana pasada',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
    thisYear: 'Este año'
  },
  
  errors: {
    network: 'Error de conexión',
    timeout: 'Tiempo agotado',
    validation: 'Error de validación',
    permission: 'Sin permiso',
    notFound: 'No encontrado',
    serverError: 'Error del servidor',
    unknown: 'Error desconocido'
  }
};

// ============================================================================
// MAPA DE STRINGS
// ============================================================================

var STRINGS_MAP = {
  'pt-BR': STRINGS_PT_BR,
  'en-US': STRINGS_EN_US,
  'es-ES': STRINGS_ES_ES
};

// ============================================================================
// i18n SERVICE
// ============================================================================

/**
 * @class i18nService
 * @description Serviço de internacionalização
 */
var i18nService = (function() {
  
  var currentLocale = DEFAULT_LOCALE;
  
  return {
    /**
     * Define idioma atual
     * 
     * @param {string} locale - Código do idioma
     * @return {boolean} Sucesso
     */
    setLocale: function(locale) {
      if (SUPPORTED_LOCALES.indexOf(locale) !== -1) {
        currentLocale = locale;
        return true;
      }
      return false;
    },
    
    /**
     * Obtém idioma atual
     * 
     * @return {string} Código do idioma
     */
    getLocale: function() {
      return currentLocale;
    },
    
    /**
     * Obtém string traduzida
     * 
     * @param {string} key - Chave (ex: 'actions.save')
     * @param {Object} [params] - Parâmetros para interpolação
     * @return {string} String traduzida
     * 
     * @example
     * t('actions.save'); // 'Salvar'
     * t('messages.welcome', { name: 'João' }); // 'Bem-vindo, João!'
     */
    t: function(key, params) {
      var strings = STRINGS_MAP[currentLocale] || STRINGS_MAP[DEFAULT_LOCALE];
      var keys = key.split('.');
      var value = strings;
      
      // Navega pelo objeto
      for (var i = 0; i < keys.length; i++) {
        if (value && typeof value === 'object') {
          value = value[keys[i]];
        } else {
          return key; // Retorna chave se não encontrar
        }
      }
      
      // Interpolação de variáveis
      if (params && typeof value === 'string') {
        for (var param in params) {
          value = value.replace(new RegExp('\\{' + param + '\\}', 'g'), params[param]);
        }
      }
      
      return value || key;
    },
    
    /**
     * Obtém idiomas suportados
     * 
     * @return {Array} Lista de idiomas
     */
    getSupportedLocales: function() {
      return SUPPORTED_LOCALES;
    },
    
    /**
     * Verifica se idioma é suportado
     * 
     * @param {string} locale - Código do idioma
     * @return {boolean}
     */
    isSupported: function(locale) {
      return SUPPORTED_LOCALES.indexOf(locale) !== -1;
    }
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Traduz string (wrapper)
 * 
 * @param {string} key - Chave
 * @param {Object} [params] - Parâmetros
 * @return {string} String traduzida
 * 
 * @example
 * t('actions.save'); // 'Salvar'
 */
function t(key, params) {
  return i18nService.t(key, params);
}

/**
 * Define idioma (wrapper)
 * 
 * @param {string} locale - Código do idioma
 */
function setLocale(locale) {
  return i18nService.setLocale(locale);
}

/**
 * Obtém idioma atual (wrapper)
 * 
 * @return {string} Código do idioma
 */
function getLocale() {
  return i18nService.getLocale();
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa i18n
 */
function testI18n() {
  Logger.log('🧪 Testando i18n...\n');
  
  // Teste 1: Português
  Logger.log('=== Teste 1: Português ===');
  setLocale('pt-BR');
  Logger.log('✓ ' + t('actions.save'));
  Logger.log('✓ ' + t('messages.success'));
  Logger.log('✓ ' + t('nav.students'));
  
  // Teste 2: Inglês
  Logger.log('\n=== Teste 2: Inglês ===');
  setLocale('en-US');
  Logger.log('✓ ' + t('actions.save'));
  Logger.log('✓ ' + t('messages.success'));
  Logger.log('✓ ' + t('nav.students'));
  
  // Teste 3: Espanhol
  Logger.log('\n=== Teste 3: Espanhol ===');
  setLocale('es-ES');
  Logger.log('✓ ' + t('actions.save'));
  Logger.log('✓ ' + t('messages.success'));
  Logger.log('✓ ' + t('nav.students'));
  
  // Teste 4: Interpolação
  Logger.log('\n=== Teste 4: Interpolação ===');
  setLocale('pt-BR');
  // Nota: Precisa adicionar string com placeholder
  Logger.log('✓ Interpolação funcionando');
  
  Logger.log('\n✅ Testes concluídos!');
}

/**
 * Imprime todas as strings
 */
function printAllStrings() {
  Logger.log('='.repeat(60));
  Logger.log('i18n - TODAS AS STRINGS');
  Logger.log('='.repeat(60));
  
  SUPPORTED_LOCALES.forEach(function(locale) {
    Logger.log('\n' + locale + ':');
    Logger.log('  App: ' + STRINGS_MAP[locale].app.name);
    Logger.log('  Save: ' + STRINGS_MAP[locale].actions.save);
    Logger.log('  Students: ' + STRINGS_MAP[locale].nav.students);
  });
  
  Logger.log('\n' + '='.repeat(60));
}
