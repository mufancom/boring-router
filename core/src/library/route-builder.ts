import {EmptyObjectPatch} from 'tslang';

import {buildRef} from './@utils';
import {
  GeneralParamDict,
  GeneralQueryDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
} from './route-match';
import {Router, RouterNavigateOptions} from './router';

export interface RouteBuilderBuildingPart {
  match: RouteMatchShared;
  params: GeneralParamDict;
}

export class RouteBuilder<TGroupName extends string = string> {
  constructor(
    private sourcePathMap: Map<string | undefined, string>,
    private sourceQueryDict: GeneralQueryDict,
    private router: Router<TGroupName>,
    private buildingParts: RouteBuilderBuildingPart[] = [],
    private leavingGroupSet = new Set<string>(),
  ) {}

  $<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(
    match: RouteMatchShared,
    params: GeneralParamDict = {},
  ): RouteBuilder<TGroupName> {
    return new RouteBuilder(
      this.sourcePathMap,
      this.sourceQueryDict,
      this.router,
      [
        ...this.buildingParts,
        {
          match,
          params,
        },
      ],
    );
  }

  $leave(groups: TGroupName | TGroupName[]): RouteBuilder<TGroupName> {
    if (typeof groups === 'string') {
      groups = [groups];
    }

    let leavingGroupSet = new Set([...this.leavingGroupSet, ...groups]);

    return new RouteBuilder(
      this.sourcePathMap,
      this.sourceQueryDict,
      this.router,
      this.buildingParts,
      leavingGroupSet,
    );
  }

  $ref(): string {
    let pathMap = new Map(this.sourcePathMap);
    let queryDict = this.sourceQueryDict;

    for (let {match, params} of this.buildingParts) {
      let group = match.$group;
      let primary = group === undefined;

      let restParamKeySet = new Set(Object.keys(params));

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

      pathMap.set(group, path);

      if (primary) {
        let {queryDict: sourceQueryDict} = match._source;

        let queryKeySet = match._queryKeySet;

        queryDict = {};

        for (let [key, value] of Object.entries(sourceQueryDict)) {
          if (queryKeySet.has(key)) {
            queryDict[key] = value;
          }
        }

        for (let key of restParamKeySet) {
          if (!queryKeySet.has(key)) {
            throw new Error(
              `Parameter "${key}" is defined as neither segment nor query`,
            );
          }

          queryDict[key] = params[key];
        }
      }
    }

    for (let group of this.leavingGroupSet) {
      pathMap.delete(group);
    }

    if (!pathMap.has(undefined)) {
      throw new Error('Primary route match is required for building ref');
    }

    return buildRef(pathMap, queryDict);
  }

  $href(): string {
    let ref = this.$ref();
    return this.router._history.getHRefByRef(ref);
  }

  /**
   * Perform a `history.push()` with `this.$ref()`.
   */
  $push(options?: RouterNavigateOptions): void {
    let ref = this.$ref();
    this.router._push(ref, options);
  }

  /**
   * Perform a `history.replace()` with `this.$ref()`.
   */
  $replace(options?: RouterNavigateOptions): void {
    let ref = this.$ref();
    this.router._replace(ref, options);
  }
}
