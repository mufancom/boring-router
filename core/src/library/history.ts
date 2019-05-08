export type UnregisterCallback = () => void;

export interface LocationDescriptorObject {
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
}

export type LocationListener = (location: Location) => void;

export interface IHistory {
  location: Location;
  push(path: string, state?: unknown): void;
  replace(location: string | LocationDescriptorObject, state?: unknown): void;
  listen(listener: LocationListener): UnregisterCallback;
}
