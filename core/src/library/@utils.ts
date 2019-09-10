import {Dict} from 'tslang';

import {
  GeneralParamDict,
  GeneralQueryDict,
  GeneralSegmentDict,
} from './route-match';

const _hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasOwnProperty(object: object, name: string): boolean {
  return _hasOwnProperty.call(object, name);
}

export function buildPath(
  segmentDict: GeneralSegmentDict,
  paramDict: GeneralParamDict = {},
): string {
  return Object.entries(segmentDict)
    .map(([key, defaultSegment]) => {
      let param = paramDict[key];
      let segment = typeof param === 'string' ? param : defaultSegment;

      if (typeof segment !== 'string') {
        throw new Error(`Parameter "${key}" is required`);
      }

      return `/${segment}`;
    })
    .join('');
}

export function buildRef(
  pathMap: Map<string | undefined, string>,
  queryDict: Dict<string | undefined>,
): string {
  let primaryPath = pathMap.get(undefined) || '';

  let pathQuery = encodeURI(
    Array.from(pathMap)
      .filter(([group]) => group !== undefined)
      .map(([group, path]) => `_${group}=${path}`)
      .join('&'),
  );

  let normalQuery = new URLSearchParams(
    Object.entries(queryDict).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ).toString();

  let query = pathQuery
    ? normalQuery
      ? `${pathQuery}&${normalQuery}`
      : pathQuery
    : normalQuery;

  return `${primaryPath}${query ? `?${query}` : ''}`;
}

export interface ParseRefResult {
  pathname: string;
  search: string;
  hash: string;
}

export function parseRef(ref: string): ParseRefResult {
  let pathname = ref || '/';
  let search = '';
  let hash = '';

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

export function parseSearch(search: string): GeneralQueryDict {
  let searchParams = new URLSearchParams(search);

  return Array.from(searchParams).reduce(
    (dict, [key, value]) => {
      dict[key] = value;
      return dict;
    },
    {} as GeneralQueryDict,
  );
}

export function testPathPrefix(path: string, prefix: string): boolean {
  return (
    path.startsWith(prefix) &&
    (path.length === prefix.length || path[prefix.length] === '/')
  );
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
