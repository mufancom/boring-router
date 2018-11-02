export type Action = 'PUSH' | 'POP' | 'REPLACE';
export type UnregisterCallback = () => void;

export type Path = string;
export type LocationState = any;
export type Pathname = string;
export type Search = string;
export type Hash = string;
export type LocationKey = string;
export type Href = string;

export interface LocationDescriptorObject<S = LocationState> {
  pathname?: Pathname;
  search?: Search;
  state?: S;
  hash?: Hash;
  key?: LocationKey;
}

export interface Location<S = LocationState> {
  pathname: Pathname;
  search: Search;
  state: S;
  hash: Hash;
  key?: LocationKey;
}

export type LocationListener = (location: Location, action: Action) => void;

export type TransitionPromptHook = (
  location: Location,
  action: Action,
) => string | false | void;

export interface History {
  length: number;
  action: Action;
  location: Location;
  push(path: Path, state?: LocationState): void;
  push(location: LocationDescriptorObject): void;
  replace(path: Path, state?: LocationState): void;
  replace(location: LocationDescriptorObject): void;
  go(n: number): void;
  goBack(): void;
  goForward(): void;
  block(prompt?: boolean | string | TransitionPromptHook): UnregisterCallback;
  listen(listener: LocationListener): UnregisterCallback;
  createHref(location: LocationDescriptorObject): Href;
}

export function parsePath(path: Path): Location {
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
    state: undefined,
  };
}
