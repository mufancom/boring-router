declare class URLSearchParams {
  constructor(
    init?: string[][] | Record<string, string> | string | URLSearchParams,
  );

  [Symbol.iterator](): IterableIterator<[string, string]>;
}

declare namespace console {
  function error(message?: any, ...optionalParams: any[]): void;
}
