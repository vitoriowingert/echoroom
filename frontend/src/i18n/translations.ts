export type Language = 'en' | 'pt' | 'es' | 'fr';

export interface Translations {
  // Auth
  auth: {
    welcome: string;
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    username: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    createAccount: string;
  };

  // Chat
  chat: {
    selectRoom: string;
    noMessages: string;
    startConversation: string;
    typeMessage: string;
    selectRoomToStart: string;
    welcome: string;
    selectOrCreateRoom: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirmDelete: string;
    send: string;
    markAllAsRead: string;
  };

  // Servers
  servers: {
    createServer: string;
    serverName: string;
    serverDescription: string;
    iconUrl: string;
    creating: string;
    loading: string;
    selectServer: string;
    noServers: string;
    discoverServers: string;
    noServersFound: string;
    joining: string;
    joined: string;
    join: string;
  };

  // Rooms
  rooms: {
    title: string;
    createRoom: string;
    noRooms: string;
    createOne: string;
    roomName: string;
    roomDescription: string;
    create: string;
    creating: string;
    loading: string;
    findOrStartConversation: string;
    directMessages: string;
    friends: string;
    textChannels: string;
    uncategorized: string;
  };

  // Members
  members: {
    onlineMembers: string;
    noMembersOnline: string;
    you: string;
  };

  // Profile
  profile: {
    userSettings: string;
    myAccount: string;
    preferences: string;
    avatarUrl: string;
    enterAvatarUrl: string;
    emailCannotChange: string;
    theme: string;
    language: string;
    timezone: string;
    enableNotifications: string;
    notificationsDescription: string;
    soundEffects: string;
    soundDescription: string;
    showOnlineStatus: string;
    onlineStatusDescription: string;
    saveChanges: string;
    saving: string;
    profileUpdated: string;
    cancel: string;
    requestNotificationPermission: string;
    notificationsBlocked: string;
  };

  // Search
  search: {
    searchMessages: string;
    searching: string;
    noResults: string;
    resultsFound: string;
    result: string;
    typeToSearch: string;
  };

  // Common
  common: {
    loading: string;
    error: string;
    online: string;
    offline: string;
    now: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };

  // Notifications
  notifications: {
    notifications: string;
    empty: string;
  };
  searchButton: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    auth: {
      welcome: 'Welcome back!',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      alreadyHaveAccount: 'Already have an account? Sign in',
      dontHaveAccount: "Don't have an account? Sign up",
      createAccount: 'Create your account',
    },
    chat: {
      selectRoom: 'Select a room',
      noMessages: 'No messages yet',
      startConversation: 'Start the conversation!',
      typeMessage: 'Type a message...',
      selectRoomToStart: 'Select a room to start chatting...',
      welcome: 'Welcome to EchoRoom!',
      selectOrCreateRoom: 'Select a room from the sidebar or create a new one to start chatting.',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Are you sure you want to delete this message?',
      send: 'Send',
      markAllAsRead: 'Mark all as read',
    },
    servers: {
      createServer: 'Create Server',
      serverName: 'Server Name',
      serverDescription: 'Description (optional)',
      iconUrl: 'Icon URL (optional)',
      creating: 'Creating...',
      loading: 'Loading servers...',
      selectServer: 'Select a server',
      noServers: 'No servers yet. Create one to get started!',
      discoverServers: 'Discover Servers',
      noServersFound: 'No servers found',
      joining: 'Joining...',
      joined: 'Joined',
      join: 'Join Server',
    },
    rooms: {
      title: 'Rooms',
      createRoom: 'Create Room',
      noRooms: 'No rooms yet. Create one to get started!',
      createOne: 'Create one to get started!',
      roomName: 'Room Name',
      roomDescription: 'Description (optional)',
      create: 'Create',
      creating: 'Creating...',
      loading: 'Loading rooms...',
      findOrStartConversation: 'Find or start a conversation',
      directMessages: 'Direct Messages',
      friends: 'Friends',
      textChannels: 'Text Channels',
      uncategorized: 'Uncategorized',
    },
    members: {
      onlineMembers: 'Online Members',
      noMembersOnline: 'No members online',
      you: '(you)',
    },
    profile: {
      userSettings: 'User Settings',
      myAccount: 'My Account',
      preferences: 'Preferences',
      avatarUrl: 'Avatar URL',
      enterAvatarUrl: 'Enter a URL to your avatar image',
      emailCannotChange: 'Email cannot be changed',
      theme: 'Theme',
      language: 'Language',
      timezone: 'Timezone',
      enableNotifications: 'Enable Notifications',
      notificationsDescription: 'Receive notifications for new messages',
      soundEffects: 'Sound Effects',
      soundDescription: 'Play sounds for new messages',
      showOnlineStatus: 'Show Online Status',
      onlineStatusDescription: "Let others see when you're online",
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      profileUpdated: 'Profile updated successfully!',
      cancel: 'Cancel',
      requestNotificationPermission: 'Request Notification Permission',
      notificationsBlocked: 'Notifications are blocked. Please enable them in your browser settings.',
    },
    search: {
      searchMessages: 'Search Messages',
      searching: 'Searching...',
      noResults: 'No messages found matching',
      resultsFound: 'results found',
      result: 'result',
      typeToSearch: 'Type to search messages in this room',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      online: 'Online',
      offline: 'Offline',
      now: 'now',
      minutesAgo: 'm ago',
      hoursAgo: 'h ago',
      daysAgo: 'd ago',
    },
    notifications: {
      notifications: 'Notifications',
      empty: 'No notifications',
    },
    searchButton: 'Search',
  },
  pt: {
    auth: {
      welcome: 'Bem-vindo de volta!',
      signIn: 'Entrar',
      signUp: 'Cadastrar',
      signOut: 'Sair',
      email: 'E-mail',
      password: 'Senha',
      username: 'Nome de usuário',
      alreadyHaveAccount: 'Já tem uma conta? Entre',
      dontHaveAccount: 'Não tem uma conta? Cadastre-se',
      createAccount: 'Crie sua conta',
    },
    chat: {
      selectRoom: 'Selecione uma sala',
      noMessages: 'Nenhuma mensagem ainda',
      startConversation: 'Inicie a conversa!',
      typeMessage: 'Digite uma mensagem...',
      selectRoomToStart: 'Selecione uma sala para começar a conversar...',
      welcome: 'Bem-vindo ao EchoRoom!',
      selectOrCreateRoom: 'Selecione uma sala na barra lateral ou crie uma nova para começar a conversar.',
      edit: 'Editar',
      delete: 'Excluir',
      save: 'Salvar',
      cancel: 'Cancelar',
      confirmDelete: 'Tem certeza que deseja excluir esta mensagem?',
      send: 'Enviar',
      markAllAsRead: 'Marcar todas como lidas',
    },
    servers: {
      createServer: 'Criar Servidor',
      serverName: 'Nome do Servidor',
      serverDescription: 'Descrição (opcional)',
      iconUrl: 'URL do Ícone (opcional)',
      creating: 'Criando...',
      loading: 'Carregando servidores...',
      selectServer: 'Selecione um servidor',
      noServers: 'Nenhum servidor ainda. Crie um para começar!',
      discoverServers: 'Descobrir Servidores',
      noServersFound: 'Nenhum servidor encontrado',
      joining: 'Entrando...',
      joined: 'Entrou',
      join: 'Entrar no Servidor',
    },
    rooms: {
      title: 'Salas',
      createRoom: 'Criar Sala',
      noRooms: 'Nenhuma sala ainda. Crie uma para começar!',
      createOne: 'Crie uma para começar!',
      roomName: 'Nome da Sala',
      roomDescription: 'Descrição (opcional)',
      create: 'Criar',
      creating: 'Criando...',
      loading: 'Carregando salas...',
      findOrStartConversation: 'Encontre ou comece uma conversa',
      directMessages: 'Mensagens diretas',
      friends: 'Amigos',
      textChannels: 'Canais de Texto',
      uncategorized: 'Sem Categoria',
    },
    members: {
      onlineMembers: 'Membros Online',
      noMembersOnline: 'Nenhum membro online',
      you: '(você)',
    },
    profile: {
      userSettings: 'Configurações do Usuário',
      myAccount: 'Minha Conta',
      preferences: 'Preferências',
      avatarUrl: 'URL do Avatar',
      enterAvatarUrl: 'Digite uma URL para sua imagem de avatar',
      emailCannotChange: 'E-mail não pode ser alterado',
      theme: 'Tema',
      language: 'Idioma',
      timezone: 'Fuso Horário',
      enableNotifications: 'Ativar Notificações',
      notificationsDescription: 'Receber notificações para novas mensagens',
      soundEffects: 'Efeitos Sonoros',
      soundDescription: 'Reproduzir sons para novas mensagens',
      showOnlineStatus: 'Mostrar Status Online',
      onlineStatusDescription: 'Deixar outros verem quando você está online',
      saveChanges: 'Salvar Alterações',
      saving: 'Salvando...',
      profileUpdated: 'Perfil atualizado com sucesso!',
      cancel: 'Cancelar',
      requestNotificationPermission: 'Solicitar Permissão de Notificação',
      notificationsBlocked: 'Notificações estão bloqueadas. Por favor, habilite-as nas configurações do navegador.',
    },
    search: {
      searchMessages: 'Buscar Mensagens',
      searching: 'Buscando...',
      noResults: 'Nenhuma mensagem encontrada correspondendo a',
      resultsFound: 'resultados encontrados',
      result: 'resultado',
      typeToSearch: 'Digite para buscar mensagens nesta sala',
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      online: 'Online',
      offline: 'Offline',
      now: 'agora',
      minutesAgo: 'min atrás',
      hoursAgo: 'h atrás',
      daysAgo: 'd atrás',
    },
    notifications: {
      notifications: 'Notificações',
      empty: 'Nenhuma notificação',
    },
    searchButton: 'Buscar',
  },
  es: {
    auth: {
      welcome: '¡Bienvenido de nuevo!',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      username: 'Nombre de Usuario',
      alreadyHaveAccount: '¿Ya tienes una cuenta? Inicia sesión',
      dontHaveAccount: '¿No tienes una cuenta? Regístrate',
      createAccount: 'Crea tu cuenta',
    },
    chat: {
      selectRoom: 'Selecciona una sala',
      noMessages: 'Aún no hay mensajes',
      startConversation: '¡Inicia la conversación!',
      typeMessage: 'Escribe un mensaje...',
      selectRoomToStart: 'Selecciona una sala para comenzar a chatear...',
      welcome: '¡Bienvenido a EchoRoom!',
      selectOrCreateRoom: 'Selecciona una sala de la barra lateral o crea una nueva para comenzar a chatear.',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirmDelete: '¿Estás seguro de que deseas eliminar este mensaje?',
      send: 'Enviar',
      markAllAsRead: 'Marcar todo como leído',
    },
    servers: {
      createServer: 'Crear Servidor',
      serverName: 'Nombre del Servidor',
      serverDescription: 'Descripción (opcional)',
      iconUrl: 'URL del Ícono (opcional)',
      creating: 'Creando...',
      loading: 'Cargando servidores...',
      selectServer: 'Selecciona un servidor',
      noServers: 'Aún no hay servidores. ¡Crea uno para comenzar!',
      discoverServers: 'Descubrir Servidores',
      noServersFound: 'No se encontraron servidores',
      joining: 'Uniéndose...',
      joined: 'Unido',
      join: 'Unirse al Servidor',
    },
    rooms: {
      title: 'Salas',
      createRoom: 'Crear Sala',
      noRooms: 'Aún no hay salas. ¡Crea una para comenzar!',
      createOne: '¡Crea una para comenzar!',
      roomName: 'Nombre de la Sala',
      roomDescription: 'Descripción (opcional)',
      create: 'Crear',
      creating: 'Creando...',
      loading: 'Cargando salas...',
      findOrStartConversation: 'Encuentra o inicia una conversación',
      directMessages: 'Mensajes Directos',
      friends: 'Amigos',
      textChannels: 'Canales de Texto',
      uncategorized: 'Sin Categoría',
    },
    members: {
      onlineMembers: 'Miembros En Línea',
      noMembersOnline: 'No hay miembros en línea',
      you: '(tú)',
    },
    profile: {
      userSettings: 'Configuración de Usuario',
      myAccount: 'Mi Cuenta',
      preferences: 'Preferencias',
      avatarUrl: 'URL del Avatar',
      enterAvatarUrl: 'Ingresa una URL para tu imagen de avatar',
      emailCannotChange: 'El correo electrónico no se puede cambiar',
      theme: 'Tema',
      language: 'Idioma',
      timezone: 'Zona Horaria',
      enableNotifications: 'Activar Notificaciones',
      notificationsDescription: 'Recibir notificaciones para nuevos mensajes',
      soundEffects: 'Efectos de Sonido',
      soundDescription: 'Reproducir sonidos para nuevos mensajes',
      showOnlineStatus: 'Mostrar Estado En Línea',
      onlineStatusDescription: 'Permitir que otros vean cuando estás en línea',
      saveChanges: 'Guardar Cambios',
      saving: 'Guardando...',
      profileUpdated: '¡Perfil actualizado con éxito!',
      cancel: 'Cancelar',
      requestNotificationPermission: 'Solicitar Permiso de Notificación',
      notificationsBlocked: 'Las notificaciones están bloqueadas. Por favor, habilítelas en la configuración de su navegador.',
    },
    search: {
      searchMessages: 'Buscar Mensajes',
      searching: 'Buscando...',
      noResults: 'No se encontraron mensajes que coincidan con',
      resultsFound: 'resultados encontrados',
      result: 'resultado',
      typeToSearch: 'Escribe para buscar mensajes en esta sala',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      online: 'En Línea',
      offline: 'Desconectado',
      now: 'ahora',
      minutesAgo: 'min hace',
      hoursAgo: 'h hace',
      daysAgo: 'd hace',
    },
    notifications: {
      notifications: 'Notificaciones',
      empty: 'No hay notificaciones',
    },
    searchButton: 'Buscar',
  },
  fr: {
    auth: {
      welcome: 'Bon retour !',
      signIn: 'Se Connecter',
      signUp: "S'Inscrire",
      signOut: 'Se Déconnecter',
      email: 'E-mail',
      password: 'Mot de Passe',
      username: "Nom d'Utilisateur",
      alreadyHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
      dontHaveAccount: "Vous n'avez pas de compte ? Inscrivez-vous",
      createAccount: 'Créez votre compte',
    },
    chat: {
      selectRoom: 'Sélectionnez une salle',
      noMessages: 'Aucun message pour le moment',
      startConversation: 'Commencez la conversation !',
      typeMessage: 'Tapez un message...',
      selectRoomToStart: 'Sélectionnez une salle pour commencer à discuter...',
      welcome: 'Bienvenue sur EchoRoom !',
      selectOrCreateRoom: 'Sélectionnez une salle dans la barre latérale ou créez-en une nouvelle pour commencer à discuter.',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce message ?',
      send: 'Envoyer',
      markAllAsRead: 'Tout marquer comme lu',
    },
    servers: {
      createServer: 'Créer un Serveur',
      serverName: 'Nom du Serveur',
      serverDescription: 'Description (optionnel)',
      iconUrl: 'URL de l\'Icône (optionnel)',
      creating: 'Création...',
      loading: 'Chargement des serveurs...',
      selectServer: 'Sélectionnez un serveur',
      noServers: 'Aucun serveur pour le moment. Créez-en un pour commencer !',
      discoverServers: 'Découvrir les Serveurs',
      noServersFound: 'Aucun serveur trouvé',
      joining: 'Rejoindre...',
      joined: 'Rejoint',
      join: 'Rejoindre le Serveur',
    },
    rooms: {
      title: 'Salles',
      createRoom: 'Créer une Salle',
      noRooms: 'Aucune salle pour le moment. Créez-en une pour commencer !',
      createOne: 'Créez-en une pour commencer !',
      roomName: 'Nom de la Salle',
      roomDescription: 'Description (optionnel)',
      create: 'Créer',
      creating: 'Création...',
      loading: 'Chargement des salles...',
      findOrStartConversation: 'Trouver ou démarrer une conversation',
      directMessages: 'Messages Directs',
      friends: 'Amis',
      textChannels: 'Canaux Textuels',
      uncategorized: 'Sans Catégorie',
    },
    members: {
      onlineMembers: 'Membres En Ligne',
      noMembersOnline: 'Aucun membre en ligne',
      you: '(vous)',
    },
    profile: {
      userSettings: 'Paramètres Utilisateur',
      myAccount: 'Mon Compte',
      preferences: 'Préférences',
      avatarUrl: 'URL de l\'Avatar',
      enterAvatarUrl: 'Entrez une URL pour votre image d\'avatar',
      emailCannotChange: 'L\'e-mail ne peut pas être modifié',
      theme: 'Thème',
      language: 'Langue',
      timezone: 'Fuseau Horaire',
      enableNotifications: 'Activer les Notifications',
      notificationsDescription: 'Recevoir des notifications pour les nouveaux messages',
      soundEffects: 'Effets Sonores',
      soundDescription: 'Jouer des sons pour les nouveaux messages',
      showOnlineStatus: 'Afficher le Statut En Ligne',
      onlineStatusDescription: 'Permettre aux autres de voir quand vous êtes en ligne',
      saveChanges: 'Enregistrer les Modifications',
      saving: 'Enregistrement...',
      profileUpdated: 'Profil mis à jour avec succès !',
      cancel: 'Annuler',
      requestNotificationPermission: 'Demander l\'Autorisation de Notification',
      notificationsBlocked: 'Les notifications sont bloquées. Veuillez les activer dans les paramètres de votre navigateur.',
    },
    search: {
      searchMessages: 'Rechercher des Messages',
      searching: 'Recherche...',
      noResults: 'Aucun message trouvé correspondant à',
      resultsFound: 'résultats trouvés',
      result: 'résultat',
      typeToSearch: 'Tapez pour rechercher des messages dans cette salle',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      online: 'En Ligne',
      offline: 'Hors Ligne',
      now: 'maintenant',
      minutesAgo: 'min il y a',
      hoursAgo: 'h il y a',
      daysAgo: 'j il y a',
    },
    notifications: {
      notifications: 'Notifications',
      empty: 'Aucune notification',
    },
    searchButton: 'Rechercher',
  },
};

