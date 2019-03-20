import {Dict} from 'tslang';

import {Location} from './history';

const FULFILLED_PROMISE = Promise.resolve();

const _hasOwnProperty = Object.prototype.hasOwnProperty;

export function then(handler: () => void): void {
  // tslint:disable-next-line:no-floating-promises
  FULFILLED_PROMISE.then(handler);
}

export function hasOwnProperty(object: object, name: string): boolean {
  return _hasOwnProperty.call(object, name);
}

export function buildRef(
  prefix: string,
  pathMap: Map<string | undefined, string>,
  queryDict: Dict<string>,
): string {
  let primaryPath = pathMap.get(undefined)!;

  let pathQuery = encodeURI(
    Array.from(pathMap)
      .filter(([group]) => group !== undefined)
      .map(([group, path]) => `_${group}=${path}`)
      .join('&'),
  );

  let normalQuery = new URLSearchParams(
    Object.entries(queryDict).filter(([, value]) => value !== undefined),
  ).toString();

  let query = pathQuery
    ? normalQuery
      ? `${pathQuery}&${normalQuery}`
      : pathQuery
    : normalQuery;

  return `${prefix}${primaryPath}${query ? `?${query}` : ''}`;
}

export function testPathPrefix(path: string, prefix: string): boolean {
  return (
    path.startsWith(prefix) &&
    (path.length === prefix.length || path[prefix.length] === '/')
  );
}

export function isLocationEqual(left: Location, right: Location): boolean {
  let keys: (keyof Location)[] = ['pathname', 'search', 'hash'];
  return keys.every(key => left[key] === right[key]);
}

export function isShallowlyEqual(left: any, right: any): boolean {
  if (left === right) {
    return true;
  }

  let keySet = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (let key of keySet) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

export type ToleratedReturnType<
  TOriginalReturnType
> = TOriginalReturnType extends Promise<infer T>
  ? Promise<T | undefined> | undefined
  : TOriginalReturnType | undefined;

export function tolerate<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ToleratedReturnType<ReturnType<T>>;
export function tolerate(fn: Function, ...args: unknown[]): unknown {
  let ret: unknown;

  try {
    ret = fn(...args);
  } catch (error) {
    console.error(error);
    return undefined;
  }

  if (!(ret instanceof Promise)) {
    return ret;
  }

  return ret.catch(error => {
    console.error(error);
  });
}

export function parsePath(path: string): Location {
  let pathname = path || '/';
  let search = '';
  let hash = '';

  let hashIndex = pathname.indexOf('#');

  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }

  let searchIndex = pathname.indexOf('?');

  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash,
  };
}
