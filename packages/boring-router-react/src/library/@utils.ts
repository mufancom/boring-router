import {EventHandler, SyntheticEvent} from 'react';

const FULFILLED_PROMISE = Promise.resolve();

export function then(handler: () => void): void {
  // tslint:disable-next-line:no-floating-promises
  FULFILLED_PROMISE.then(handler);
}

export function composeEventHandler<T extends SyntheticEvent>(
  handlers: (EventHandler<T> | undefined)[],
  breakOnDefaultPrevented = false,
): EventHandler<T> {
  return event => {
    for (let handler of handlers) {
      if (handler) {
        handler(event);

        if (breakOnDefaultPrevented && event.defaultPrevented) {
          break;
        }
      }
    }
  };
}
