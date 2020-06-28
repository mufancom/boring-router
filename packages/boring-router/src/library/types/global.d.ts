declare class URLSearchParams {
  constructor(
    init?: string[][] | Record<string, string> | string | URLSearchParams,
  );

  [Symbol.iterator](): IterableIterator<[string, string]>;
}

interface Console {
  debug(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
}

declare const console: Console;
