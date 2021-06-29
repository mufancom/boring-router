import _ from 'lodash';
import {EmptyObjectPatch} from 'tslang';

import {buildPath, buildRef, isQueryIdsMatched, parseSearch} from './@utils';
import {
  GeneralParamDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
} from './route-match';
import {Router, RouterNavigateOptions} from './router';

type BuildingPart = RouteBuilderBuildingPart | StringBuildingPart;

interface StringBuildingPart {
  route?: RouteMatchShared;
  path: string;
  query: Map<string, string>;
}

export interface RouteBuilderBuildingPart {
  route: RouteMatchShared;
  params?: GeneralParamDict;
}

export type RouteBuilderSourceType = 'current' | 'next' | 'none';

export class RouteBuilder<TGroupName extends string = string> {
  constructor(
    private router: Router<TGroupName>,
    private sourceType: RouteBuilderSourceType,
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
      this.router,
      this.sourceType,
      [...this.buildingParts, buildingPart],
      this.leavingGroupSet,
    );
  }

  $leave(groups: TGroupName | TGroupName[]): RouteBuilder<TGroupName> {
    if (typeof groups === 'string') {
      groups = [groups];
    }

    let leavingGroupSet = new Set([...this.leavingGroupSet, ...groups]);

    return new RouteBuilder(
      this.router,
      this.sourceType,
      this.buildingParts,
      leavingGroupSet,
    );
  }

  $ref(): string {
    let router = this.router;
    let sourceType = this.sourceType;

    let leavingGroupSet = this.leavingGroupSet;

    let groupToBuildingPartMap = new Map<string | undefined, BuildingPart>();

    if (sourceType !== 'none') {
      for (let [group, route] of router._groupToRouteMatchMap) {
        if (group && leavingGroupSet.has(group)) {
          continue;
        }

        let sourceRoute = sourceType === 'current' ? route : route.$next;

        if (!sourceRoute.$matched) {
          continue;
        }

        groupToBuildingPartMap.set(group, {
          route: sourceRoute.$rest,
        });
      }
    }

    for (let buildingPart of this.buildingParts) {
      if (typeof buildingPart === 'string') {
        let {groups, query: buildingPartQueryMap} = parseStringBuildingPart(
          buildingPart,
          router.$groups,
        );

        for (let {name: group, path} of groups) {
          if (group && leavingGroupSet.has(group)) {
            continue;
          }

          // Preserve the route information if already exists.
          let route = groupToBuildingPartMap.get(group)?.route;

          groupToBuildingPartMap.set(group, {
            path,
            route,
            query: buildingPartQueryMap,
          });
        }
      } else {
        let group = buildingPart.route.$group;

        if (group && leavingGroupSet.has(group)) {
          continue;
        }

        groupToBuildingPartMap.set(group, buildingPart);
      }
    }

    let pathMap = new Map<string | undefined, string>();

    let queryMap = new Map<string, string | undefined>();

    for (let [group, buildingPart] of groupToBuildingPartMap) {
      if ('path' in buildingPart) {
        let {path, route, query: buildingPartQueryMap} = buildingPart;

        pathMap.set(group, path);

        if (route) {
          buildingPartQueryMap = new Map([
            ...Array.from(route._source.queryMap).map(([key, {value}]): [
              string,
              string,
            ] => [key, value]),
            ...buildingPartQueryMap,
          ]);
        }

        for (let [key, value] of buildingPartQueryMap) {
          if (queryMap.has(key)) {
            continue;
          }

          queryMap.set(key, value);
        }
      } else {
        let {route, params: paramDict = {}} = buildingPart;

        let nextSegmentDict = route._pathSegments;
        let nextSegmentNames = _.keys(nextSegmentDict);

        let restSegmentDict = _.pick(
          router._groupToRouteMatchMap.get(group)?.$rest._pathSegments || {},
          nextSegmentNames,
        );

        let segmentDict = _.fromPairs(
          _.sortBy(
            _.entries(_.merge(restSegmentDict, nextSegmentDict)),
            ([key]) => nextSegmentNames.indexOf(key),
          ),
        );

        pathMap.set(group, buildPath(segmentDict, paramDict));

        let {queryMap: sourceQueryMap} = route._source;

        let queryKeyToIdMap = route._queryKeyToIdMap;

        for (let [key, {id, value}] of sourceQueryMap) {
          let routeQueryId = queryKeyToIdMap.get(key);

          if (
            queryMap.has(key) ||
            routeQueryId === undefined ||
            !isQueryIdsMatched(routeQueryId, id)
          ) {
            continue;
          }

          queryMap.set(key, value);
        }

        let restParamKeys = _.difference(
          Object.keys(paramDict),
          Object.keys(segmentDict),
        );

        for (let key of restParamKeys) {
          if (!queryKeyToIdMap.has(key)) {
            throw new Error(
              `Parameter "${key}" is defined as neither segment nor query`,
            );
          }

          // Note a given param could be `undefined` here to remove the query.
          // The reason why we use `undefined` instead of deleting the key is
          // to ensure this overrides route queries iterated later.
          queryMap.set(key, paramDict[key]);
        }
      }
    }

    return buildRef(pathMap, queryMap);
  }

  $href(): string {
    let ref = this.$ref();

    if (!ref.startsWith('/')) {
      ref = `/${ref}`;
    }

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
  query: Map<string, string>;
}

function parseStringBuildingPart(
  part: string,
  groups: string[],
): ParsedStringBuildingPart {
  let searchIndex = part.indexOf('?');

  let primaryPath: string | undefined;
  let queryMap: Map<string, string>;

  if (searchIndex >= 0) {
    primaryPath = part.slice(0, searchIndex);
    queryMap = parseSearch(part.slice(searchIndex));
  } else {
    primaryPath = part;
    queryMap = new Map();
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
  }

  return {
    groups: buildingPartGroups,
    query: queryMap,
  };
}
