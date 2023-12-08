import { RED } from './globals';

export interface BaseErrorConstructor {
  defaultStatusMessage?: string;
  name?: string;
  statusMessage?: string;
}

export function isTranslationKey(key?: unknown): boolean {
  if (typeof key !== 'string') {
    return false;
  }

  return !key.includes(' ') && (key.includes('.') || key.includes('__'));
}

export default abstract class BaseError extends Error {
  #statusMessage: string;

  constructor({ statusMessage, name, defaultStatusMessage }: BaseErrorConstructor) {
    super(statusMessage);
    this.name = name ?? 'BaseError';

    // Set status message
    let [statusKey, statusParams] = Array.isArray(statusMessage) ? statusMessage : [statusMessage, undefined];
    statusKey ??= defaultStatusMessage ?? 'home-assistant.status.error';

    this.#statusMessage = RED._(statusKey, statusParams);
  }

  get statusMessage(): string {
    return this.#statusMessage;
  }
}
