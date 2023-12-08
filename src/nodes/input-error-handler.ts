import { NodeDone } from 'epdoc-node-red-hautil';
import { RED } from './globals';
import BaseError from './BaseError';

interface Dependencies {
  done?: NodeDone;
}

export function getErrorData(e: unknown) {
  let statusMessage = RED._('home-assistant.status.error');
  if (e instanceof BaseError) {
    statusMessage = e.statusMessage;
  } else if (e instanceof Error) {
    statusMessage = e.name || statusMessage;
  } else if (typeof e === 'string') {
    e = new Error(e);
  } else {
    e = new Error(
      RED._('home-assistant.error.unrecognized_error', {
        error: JSON.stringify(e)
      })
    );
  }

  return { error: e as Error, statusMessage };
}

export function inputErrorHandler(e: unknown, deps?: Dependencies) {
  const { error, statusMessage } = getErrorData(e);

  deps?.done?.(error);
}

export function setTimeoutWithErrorHandling(
  callback: (...args: any[]) => void,
  timeout: number,
  deps?: Dependencies
): NodeJS.Timeout {
  const timeoutId = setTimeout(() => {
    try {
      callback();
    } catch (e) {
      inputErrorHandler(e, deps);
    }
  }, timeout);

  return timeoutId;
}
