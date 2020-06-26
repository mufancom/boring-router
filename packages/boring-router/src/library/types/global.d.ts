declare class URLSearchParams {
  constructor(
    init?: string[][] | Record<string, string> | string | URLSearchParams,
  );

  [Symbol.iterator](): IterableIterator<[string, string]>;
}

interface Console {
  error(message?: any, ...optionalParams: any[]): void;
}

declare const console: Console;
