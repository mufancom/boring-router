import {Dict} from 'tslang';

export interface RouteSchema {
  $match?: string | RegExp;
  $query?: Dict<boolean>;
  $children?: RouteSchemaDict;
}

export type RouteSchemaDict = Dict<RouteSchema | boolean>;

export function schema<T extends RouteSchemaDict>(schema: T): T {
  return schema;
}
