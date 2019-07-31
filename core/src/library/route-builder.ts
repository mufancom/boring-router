import {EmptyObjectPatch} from 'tslang';

import {buildRef} from './@utils';
import {IHistory} from './history';
import {
  GeneralQueryDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSource,
} from './route-match';

export interface RouteBuilderRefOptions<TGroupName extends string> {
  /**
   * Parallel route groups to leave.
   */
  leaves?: TGroupName[];
  /**
   * Whether to preserve query string that matches the target ref, defaults to
   * `true`.
   */
  preserveQuery?: boolean;
}

export interface RouteBuilderBuildOptions {
  /**
   * Whether to leave this match's group.
   */
  leave?: boolean;
  /**
   * Whether to preserve rest path of current match, defaults to `false`.
   */
  rest?: boolean;
}

export class RouteBuilder<TGroupName extends string = string> {
  private overridingPathMap = new Map<string | undefined, string | false>();

  private preservedQueryDict: GeneralQueryDict | undefined;

  constructor(
    private prefix: string,
    private source: RouteSource,
    private history: IHistory,
  ) {}

  $and<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
    options?: RouteBuilderBuildOptions,
  ): this;
  $and<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch = {},
    {leave = false, rest = false}: RouteBuilderBuildOptions = {},
  ): this {
    let group = match.$group;
    let primary = group === undefined;

    let restParamKeySet = new Set(Object.keys(params));

    let overridingPathMap = this.overridingPathMap;

    if (leave) {
      if (primary) {
        throw new Error('Cannot leave the primary route');
      }

      overridingPathMap.set(group!, false);
    } else {
      let segmentDict = match._pathSegments;

      let path = Object.entries(segmentDict)
        .map(([key, defaultSegment]) => {
          restParamKeySet.delete(key);

          let param = params[key];
          let segment = typeof param === 'string' ? param : defaultSegment;

          if (typeof segment !== 'string') {
            throw new Error(`Parameter "${key}" is required`);
          }

          return `/${segment}`;
        })
        .join('');

      if (rest) {
        path += match._rest;
      }

      overridingPathMap.set(group, path);
    }

    if (primary) {
      let {queryDict: sourceQueryDict} = match._source;

      let queryKeySet = match._queryKeySet;

      let preservedQueryDict: GeneralQueryDict = {};

      for (let [key, value] of Object.entries(sourceQueryDict)) {
        if (queryKeySet.has(key)) {
          preservedQueryDict[key] = value;
        }
      }

      for (let key of restParamKeySet) {
        if (!queryKeySet.has(key)) {
          throw new Error(
            `Parameter "${key}" is defined as neither segment nor query`,
          );
        }

        preservedQueryDict[key] = params[key];
      }

      this.preservedQueryDict = preservedQueryDict;
    }

    return this;
  }

  $ref(options?: RouteBuilderRefOptions<TGroupName>): string;
  $ref({
    preserveQuery = true,
    leaves = [],
  }: RouteBuilderRefOptions<TGroupName> = {}): string {
    let {pathMap: sourcePathMap, queryDict: sourceQueryDict} = this.source;

    let pathMap = new Map(sourcePathMap);

    for (let [group, path] of this.overridingPathMap) {
      if (typeof path === 'string') {
        pathMap.set(group, path);
      } else {
        pathMap.delete(group);
      }
    }

    for (let group of leaves) {
      pathMap.delete(group);
    }

    let preservedQueryDict = this.preservedQueryDict || sourceQueryDict;

    let queryDict = preserveQuery ? preservedQueryDict : {};

    return buildRef(this.prefix, pathMap, queryDict);
  }

  /**
   * Perform a `history.push()` with `this.$ref(options)`.
   */
  $push(options?: RouteBuilderRefOptions<TGroupName>): void {
    let ref = this.$ref(options);
    this.history.push(ref);
  }

  /**
   * Perform a `history.replace()` with `this.$ref(options)`.
   */
  $replace(options?: RouteBuilderRefOptions<TGroupName>): void {
    let ref = this.$ref(options);
    this.history.replace(ref);
  }
}
