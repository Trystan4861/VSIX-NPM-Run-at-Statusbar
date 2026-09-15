import { ProcessKind } from '../configuration/configuration-types';

export type UiLanguage = 'en' | 'es';

interface UiStrings {
  showTerminal: string;
  restart: string;
  stop: string;
  start: string;
  configure: string;
  rename: string;
  menuTitle: (label: string) => string;
  menuPlaceholder: string;
  commandFailed: (label: string) => string;
}

const strings: Record<UiLanguage, UiStrings> = {
  en: {
    showTerminal: 'Show terminal',
    restart: 'Restart',
    stop: 'Stop',
    start: 'Start',
    configure: 'Configure',
    rename: 'Rename',
    menuTitle: (label) => `${label} processes`,
    menuPlaceholder: 'Select an action',
    commandFailed: (label) => `The ${label} command failed.`
  },
  es: {
    showTerminal: 'Mostrar terminal',
    restart: 'Reiniciar',
    stop: 'Detener',
    start: 'Iniciar',
    configure: 'Configurar',
    rename: 'Renombrar',
    menuTitle: (label) => `Procesos de ${label}`,
    menuPlaceholder: 'Selecciona una acción',
    commandFailed: (label) => `El comando ${label} ha fallado.`
  }
};

export function getUiLanguage(locale: string): UiLanguage {
  return locale.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function getUiStrings(locale: string): UiStrings {
  return strings[getUiLanguage(locale)];
}

export function getLocalizedProcessLabel(kind: ProcessKind, locale: string): string {
  if (getUiLanguage(locale) === 'es') return kind === 'backend' ? 'Backend' : 'Frontend';
  return kind === 'backend' ? 'Backend' : 'Frontend';
}

export function getCommandFailedMessage(kind: ProcessKind, locale: string): string {
  const stringsForLocale = getUiStrings(locale);
  return stringsForLocale.commandFailed(getLocalizedProcessLabel(kind, locale));
}
