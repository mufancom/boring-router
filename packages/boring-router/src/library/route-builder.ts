import {EmptyObjectPatch} from 'tslang';

import {buildPath, buildRef, isQueryIdsMatched, parseSearch} from './@utils';
import {
  GeneralParamDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSourceQuery,
} from './route-match';
import {Router, RouterNavigateOptions} from './router';

export interface RouteBuilderBuildingPart {
  route: RouteMatchShared;
  params?: GeneralParamDict;
}

export class RouteBuilder<TGroupName extends string = string> {
  constructor(
    private sourcePathMap: Map<string | undefined, string>,
    private sourceQueryMap: Map<string, RouteSourceQuery>,
    private router: Router<TGroupName>,
    private buildingParts: (RouteBuilderBuildingPart | string)[] = [],
    private leavingGroupSet = new Set<string>(),
  ) {}

  /**
   * Route of the first building part if available.
   */
  get $route(): RouteMatchShared | undefined {
    let [firstPart] = this.buildingParts;

    return typeof firstPart === 'object' ? firstPart.route : undefined;
  }

  $<TRouteMatchShared extends RouteMatchShared>(
    route: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(part: string): RouteBuilder<TGroupName>;
  $(route: RouteMatchShared | string, params?: GeneralParamDict): RouteBuilder {
    let buildingPart =
      typeof route === 'string'
        ? route
        : {
            route,
            params,
          };

    return new RouteBuilder(
      this.sourcePathMap,
      this.sourceQueryMap,
      this.router,
      [...this.buildingParts, buildingPart],
    );
  }

  $leave(groups: TGroupName | TGroupName[]): RouteBuilder<TGroupName> {
    if (typeof groups === 'string') {
      groups = [groups];
    }

    let leavingGroupSet = new Set([...this.leavingGroupSet, ...groups]);

    return new RouteBuilder(
      this.sourcePathMap,
      this.sourceQueryMap,
      this.router,
      this.buildingParts,
      leavingGroupSet,
    );
  }

  $ref(): string {
    let pathMap = new Map(this.sourcePathMap);

    let queryMap: Map<string, string | undefined> | undefined;

    for (let buildingPart of this.buildingParts) {
      if (typeof buildingPart === 'string') {
        let {groups, query: buildingPartQueryMap} = parseStringBuildingPart(
          buildingPart,
          this.router.$groups,
        );

        for (let {name, path} of groups) {
          pathMap.set(name, path);
        }

        if (buildingPartQueryMap) {
          queryMap = buildingPartQueryMap;
        }
      } else {
        let {route, params: paramDict = {}} = buildingPart;

        let group = route.$group;
        let primary = group === undefined;

        let restParamKeySet = new Set(Object.keys(paramDict));

        let segmentDict = route._pathSegments;

        let path = buildPath(segmentDict, paramDict);

        for (let key of Object.keys(segmentDict)) {
          restParamKeySet.delete(key);
        }

        pathMap.set(group, path);

        if (primary) {
          let {queryMap: sourceQueryMap} = route._source;

          let queryKeyToIdMap = route._queryKeyToIdMap;

          queryMap = new Map();

          for (let [key, {id, value}] of sourceQueryMap) {
            let routeQueryId = queryKeyToIdMap.get(key);

            if (
              routeQueryId !== undefined &&
              isQueryIdsMatched(routeQueryId, id)
            ) {
              queryMap.set(key, value);
            }
          }

          for (let key of restParamKeySet) {
            if (!queryKeyToIdMap.has(key)) {
              throw new Error(
                `Parameter "${key}" is defined as neither segment nor query`,
              );
            }

            queryMap.set(key, paramDict[key]);
          }
        }
      }
    }

    for (let group of this.leavingGroupSet) {
      pathMap.delete(group);
    }

    if (pathMap.get(undefined) && !queryMap) {
      queryMap = new Map(
        Array.from(this.sourceQueryMap).map(([key, {value}]) => [key, value]),
      );
    }

    return buildRef(pathMap, queryMap);
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

interface ParsedStringBuildingPartGroup {
  name: string | undefined;
  path: string;
}

interface ParsedStringBuildingPart {
  groups: ParsedStringBuildingPartGroup[];
  query: Map<string, string> | undefined;
}

function parseStringBuildingPart(
  part: string,
  groups: string[],
): ParsedStringBuildingPart {
  let searchIndex = part.indexOf('?');

  let primaryPath: string | undefined;
  let queryMap: Map<string, string> | undefined;

  if (searchIndex >= 0) {
    primaryPath = part.slice(0, searchIndex);
    queryMap = parseSearch(part.slice(searchIndex));
  } else {
    primaryPath = part;
    queryMap = undefined;
  }

  let buildingPartGroups: ParsedStringBuildingPartGroup[] = [];

  if (primaryPath) {
    buildingPartGroups.push({
      name: undefined,
      path: primaryPath,
    });
  }

  if (queryMap) {
    for (let group of groups) {
      let key = `_${group}`;

      if (queryMap.has(key)) {
        buildingPartGroups.push({
          name: group,
          path: queryMap.get(key)!,
        });

        queryMap.delete(key);
      }
    }

    if (queryMap.size === 0) {
      queryMap = undefined;
    }

    if (queryMap && !primaryPath) {
      console.error(
        `Unexpected query in string building part without primary route path: "${part}"`,
      );

      queryMap = undefined;
    }
  }

  return {
    groups: buildingPartGroups,
    query: queryMap,
  };
}
