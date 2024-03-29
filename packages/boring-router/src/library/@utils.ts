import type {GeneralParamDict, GeneralSegmentDict} from './route-match';

export function isQueryIdsMatched(
  a: string | symbol | true,
  b: string | symbol | true,
): boolean {
  return a === true || b === true || a === b;
}

export function buildPath(
  segmentDict: GeneralSegmentDict,
  paramDict: GeneralParamDict = {},
): string {
  return (
    Object.entries(segmentDict)
      .map(([key, defaultSegment]) => {
        const param = paramDict[key];
        const segment = typeof param === 'string' ? param : defaultSegment;

        if (typeof segment !== 'string') {
          throw new Error(`Parameter "${key}" is required`);
        }

        return `/${segment}`;
      })
      .join('') || '/'
  );
}

export function buildRef(
  pathMap: Map<string | undefined, string>,
  queryMap: Map<string, string | undefined> | undefined,
): string {
  const primaryPath = pathMap.get(undefined) ?? '';

  const pathQuery = encodeURI(
    Array.from(pathMap)
      .filter(([group]) => group !== undefined)
      .map(([group, path]) => `_${group}=${path}`)
      .join('&'),
  );

  const normalQuery =
    queryMap &&
    new URLSearchParams(
      Array.from(queryMap).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ).toString();

  const query = pathQuery
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

  const hashIndex = pathname.indexOf('#');

  if (hashIndex >= 0) {
    hash = pathname.slice(hashIndex);
    pathname = pathname.slice(0, hashIndex);
  }

  const searchIndex = pathname.indexOf('?');

  if (searchIndex >= 0) {
    search = pathname.slice(searchIndex);
    pathname = pathname.slice(0, searchIndex);
  }

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash,
  };
}

export function parseSearch(search: string): Map<string, string> {
  const searchParams = new URLSearchParams(search);

  return new Map(searchParams);
}

export function testPathPrefix(path: string, prefix: string): boolean {
  return (
    path.startsWith(prefix) &&
    (path.length === prefix.length || path[prefix.length] === '/')
  );
}

export type ToleratedReturnType<TOriginalReturnType> =
  TOriginalReturnType extends Promise<infer T>
    ? Promise<T | undefined> | undefined
    : TOriginalReturnType | undefined;

export function tolerate<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ToleratedReturnType<ReturnType<T>>;
export function tolerate(
  fn: (...args: any[]) => any,
  ...args: unknown[]
): unknown {
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
