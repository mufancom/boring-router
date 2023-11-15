import _ from 'lodash';
import type {EmptyObjectPatch} from 'tslang';

import {buildPath, buildRef, isQueryIdsMatched, parseSearch} from './@utils.js';
import type {
  GeneralParamDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
} from './route-match/index.js';
import type {Router, RouterNavigateOptions} from './router.js';

type BuildingPart = RouteBuilderBuildingPart | StringBuildingPart;

type StringBuildingPart = {
  route?: RouteMatchShared;
  path: string;
  query: Map<string, string>;
};

export type RouteBuilderBuildingPart = {
  route: RouteMatchShared;
  params?: GeneralParamDict;
};

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
    const [firstPart] = this.buildingParts;

    return typeof firstPart === 'object' ? firstPart.route : undefined;
  }

  $<TRouteMatchShared extends RouteMatchShared>(
    route: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(part: string): RouteBuilder<TGroupName>;
  $(
    route: RouteMatchShared | string,
    params?: GeneralParamDict,
  ): RouteBuilder<TGroupName> {
    const buildingPart =
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

    const leavingGroupSet = new Set([...this.leavingGroupSet, ...groups]);

    return new RouteBuilder(
      this.router,
      this.sourceType,
      this.buildingParts,
      leavingGroupSet,
    );
  }

  $ref(): string {
    const router = this.router;
    const sourceType = this.sourceType;

    const leavingGroupSet = this.leavingGroupSet;

    const groupToBuildingPartMap = new Map<string | undefined, BuildingPart>();

    if (sourceType !== 'none') {
      for (const [group, route] of router._groupToRouteMatchMap) {
        if (group && leavingGroupSet.has(group)) {
          continue;
        }

        const sourceRoute = sourceType === 'current' ? route : route.$next;

        if (!sourceRoute.$matched) {
          continue;
        }

        groupToBuildingPartMap.set(group, {
          route: sourceRoute.$rest,
        });
      }
    }

    for (const buildingPart of this.buildingParts) {
      if (typeof buildingPart === 'string') {
        const {groups, query: buildingPartQueryMap} = parseStringBuildingPart(
          buildingPart,
          router.$groups,
        );

        for (const {name: group, path} of groups) {
          if (group && leavingGroupSet.has(group)) {
            continue;
          }

          // Preserve the route information if already exists.
          const route = groupToBuildingPartMap.get(group)?.route;

          groupToBuildingPartMap.set(group, {
            path,
            route,
            query: buildingPartQueryMap,
          });
        }
      } else {
        const group = buildingPart.route.$group;

        if (group && leavingGroupSet.has(group)) {
          continue;
        }

        groupToBuildingPartMap.set(group, buildingPart);
      }
    }

    const pathMap = new Map<string | undefined, string>();

    const queryMap = new Map<string, string | undefined>();

    for (const [group, buildingPart] of groupToBuildingPartMap) {
      if ('path' in buildingPart) {
        let {path, route, query: buildingPartQueryMap} = buildingPart;

        pathMap.set(group, path);

        if (route) {
          buildingPartQueryMap = new Map([
            ...Array.from(route._source.queryMap).map(
              ([key, {value}]): [string, string] => [key, value],
            ),
            ...buildingPartQueryMap,
          ]);
        }

        for (const [key, value] of buildingPartQueryMap) {
          if (queryMap.has(key)) {
            continue;
          }

          queryMap.set(key, value);
        }
      } else {
        const {route, params: paramDict = {}} = buildingPart;

        const nextSegmentDict = route._pathSegments;
        const nextSegmentNames = _.keys(nextSegmentDict);

        const restSegmentDict = _.pick(
          router._groupToRouteMatchMap.get(group)?.$rest._pathSegments || {},
          nextSegmentNames,
        );

        const segmentDict = _.fromPairs(
          _.sortBy(
            _.entries(_.merge(restSegmentDict, nextSegmentDict)),
            ([key]) => nextSegmentNames.indexOf(key),
          ),
        );

        const queryKeyToIdMap = route._queryKeyToIdMap;
        const queryKeys = Array.from(queryKeyToIdMap.keys());

        pathMap.set(
          group,
          buildPath(segmentDict, _.omit(paramDict, queryKeys)),
        );

        const {queryMap: sourceQueryMap} = route._source;

        for (const [key, {id, value}] of sourceQueryMap) {
          const routeQueryId = queryKeyToIdMap.get(key);

          if (
            queryMap.has(key) ||
            routeQueryId === undefined ||
            !isQueryIdsMatched(routeQueryId, id)
          ) {
            continue;
          }

          queryMap.set(key, value);
        }

        const restParamKeys = _.difference(
          Object.keys(paramDict),
          _.difference(Object.keys(segmentDict), queryKeys),
        );

        for (const key of restParamKeys) {
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
    const ref = this.$ref();
    this.router._push(ref, options);
  }

  /**
   * Perform a `history.replace()` with `this.$ref()`.
   */
  $replace(options?: RouterNavigateOptions): void {
    const ref = this.$ref();
    this.router._replace(ref, options);
  }
}

type ParsedStringBuildingPartGroup = {
  name: string | undefined;
  path: string;
};

type ParsedStringBuildingPart = {
  groups: ParsedStringBuildingPartGroup[];
  query: Map<string, string>;
};

function parseStringBuildingPart(
  part: string,
  groups: string[],
): ParsedStringBuildingPart {
  const searchIndex = part.indexOf('?');

  let primaryPath: string | undefined;
  let queryMap: Map<string, string>;

  if (searchIndex >= 0) {
    primaryPath = part.slice(0, searchIndex);
    queryMap = parseSearch(part.slice(searchIndex));
  } else {
    primaryPath = part;
    queryMap = new Map();
  }

  const buildingPartGroups: ParsedStringBuildingPartGroup[] = [];

  if (primaryPath) {
    buildingPartGroups.push({
      name: undefined,
      path: primaryPath,
    });
  }

  if (queryMap) {
    for (const group of groups) {
      const key = `_${group}`;

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
