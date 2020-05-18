import {Dict} from 'tslang';

export interface RouteSchema {
  $match?: string | RegExp;
  $query?: Dict<boolean>;
  /**
   * Whether to allow exact match while if this route has children. Only
   * applies if this route has children.
   *
   * If a string is applied, it will try to match the children when the current
   * route is exactly matched.
   */
  $exact?: boolean | string;
  $children?: RouteSchemaDict;
  $extension?: object;
  $metadata?: object;
}

export type RouteSchemaDict = Dict<RouteSchema | boolean>;
export type GroupToRouteSchemaDictDict = Dict<RouteSchemaDict>;

export function schema<T extends RouteSchemaDict>(schema: T): T {
  return schema;
}
