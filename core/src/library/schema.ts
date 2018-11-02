import {Dict} from 'tslang';

export interface RouteSchema {
  $match?: string | RegExp;
  $query?: Dict<boolean>;
  /**
   * Whether to allow exact match while if this route has children. Only
   * applies if this route has children.
   */
  $exact?: boolean;
  $children?: RouteSchemaDict;
  $extension?: object;
}

export type RouteSchemaDict = Dict<RouteSchema | boolean>;

export function schema<T extends RouteSchemaDict>(schema: T): T {
  return schema;
}
