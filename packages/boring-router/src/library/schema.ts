import type {Dict} from 'tslang';

export interface RootRouteSchema {
  $query?: Dict<string | symbol | true>;
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

export interface RouteSchema extends RootRouteSchema {
  $match?: string | RegExp;
}

export type RouteSchemaDict = Dict<RouteSchema | boolean>;
export type GroupToRouteSchemaDictDict = Dict<RouteSchemaDict>;

export function schema<T extends RouteSchema>(schema: T): T {
  return schema;
}
