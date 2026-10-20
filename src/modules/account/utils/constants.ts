export const ACCOUNT_COPY = {
  title: 'Cuenta y respaldo',
  subtitle: 'Respalda tu progreso sin perder la app local.',
  guestTitle: 'Modo invitado',
  guestDescription:
    'Tu información vive solo en este dispositivo. Vincula una cuenta cuando quieras respaldarla.',
  signedInTitle: 'Cuenta vinculada',
  backupTitle: 'Respaldo personal',
  backupDescription:
    'Desactivado por defecto. Tus datos se envían en segundo plano sin bloquear la app.',
  consentTitle: 'Respaldar disparadores emocionales',
  consentDescription:
    'Incluye emociones y notas en el respaldo. Requiere tu consentimiento explícito.',
  magicLinkTitle: 'Entrar con email',
  magicLinkSent:
    'Revisa tu correo y abre el enlace mágico en este dispositivo para vincular la cuenta.',
  adoptionTitle: '¿Usar los datos de este dispositivo?',
  adoptionDescription:
    'Puedes vincular tu historial local a esta cuenta o empezar con los datos que ya existen en la nube.',
  adoptAction: 'Vincular mis datos',
  startFreshAction: 'Empezar con la nube',
  signOutAction: 'Cerrar sesión',
  signOutDescription:
    'Tus datos locales seguirán disponibles, pero dejarán de respaldarse hasta que vuelvas a iniciar sesión.',
} as const;

export const ACCOUNT_TOASTS = {
  magicLinkSent: 'Enlace enviado',
  signInRequired: 'Inicia sesión para activar el respaldo',
  backupEnabled: 'Respaldo personal activado',
  backupDisabled: 'Respaldo personal desactivado',
  consentEnabled: 'Consentimiento emocional activado',
  consentDisabled: 'Consentimiento emocional desactivado',
  signedOut: 'Sesión cerrada',
} as const;
