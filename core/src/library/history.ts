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
}

export type LocationListener = (location: Location) => void;

export interface IHistory {
  location: Location;
  push(path: string): void;
  replace(location: string | LocationDescriptorObject): void;
  listen(listener: LocationListener): UnregisterCallback;
}
