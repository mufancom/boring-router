import type {EventHandler, SyntheticEvent} from 'react';

const FULFILLED_PROMISE = Promise.resolve();

export function then(handler: () => void): void {
  FULFILLED_PROMISE.then(handler).catch(console.error);
}

export function composeEventHandler<T extends SyntheticEvent>(
  handlers: (EventHandler<T> | undefined)[],
  breakOnDefaultPrevented = false,
): EventHandler<T> {
  return event => {
    for (const handler of handlers) {
      if (handler) {
        handler(event);

        if (breakOnDefaultPrevented && event.defaultPrevented) {
          break;
        }
      }
    }
  };
}
