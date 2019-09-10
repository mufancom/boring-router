import {EmptyObjectPatch} from 'tslang';

import {buildPath, buildRef, hasOwnProperty} from './@utils';
import {
  GeneralParamDict,
  GeneralQueryDict,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
} from './route-match';
import {Router, RouterNavigateOptions} from './router';

export interface RouteBuilderBuildingPart {
  match: RouteMatchShared;
  params?: GeneralParamDict;
}

export class RouteBuilder<TGroupName extends string = string> {
  constructor(
    private sourcePathMap: Map<string | undefined, string>,
    private sourceQueryDict: GeneralQueryDict,
    private router: Router<TGroupName>,
    private buildingParts: (RouteBuilderBuildingPart | string)[] = [],
    private leavingGroupSet = new Set<string>(),
  ) {}

  $<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(part: string): RouteBuilder<TGroupName>;
  $(match: RouteMatchShared | string, params?: GeneralParamDict): RouteBuilder {
    let buildingPart =
      typeof match === 'string'
        ? match
        : {
            match,
            params,
          };

    return new RouteBuilder(
      this.sourcePathMap,
      this.sourceQueryDict,
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
      this.sourceQueryDict,
      this.router,
      this.buildingParts,
      leavingGroupSet,
    );
  }

  $ref(): string {
    let pathMap = new Map(this.sourcePathMap);
    let queryDict = this.sourceQueryDict;

    for (let buildingPart of this.buildingParts) {
      if (typeof buildingPart === 'string') {
        let {groups, query: buildingPartQueryDict} = parseStringBuildingPart(
          buildingPart,
          this.router.$groups,
        );

        for (let {name, path} of groups) {
          pathMap.set(name, path);
        }

        if (buildingPartQueryDict) {
          queryDict = {
            ...queryDict,
            ...buildingPartQueryDict,
          };
        }
      } else {
        let {match, params: paramDict = {}} = buildingPart;

        let group = match.$group;
        let primary = group === undefined;

        let restParamKeySet = new Set(Object.keys(paramDict));

        let segmentDict = match._pathSegments;

        let path = buildPath(segmentDict, paramDict);

        for (let key of Object.keys(segmentDict)) {
          restParamKeySet.delete(key);
        }

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

            queryDict[key] = paramDict[key];
          }
        }
      }
    }

    for (let group of this.leavingGroupSet) {
      pathMap.delete(group);
    }

    return buildRef(pathMap, pathMap.get(undefined) ? queryDict : {});
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
  query: GeneralQueryDict | undefined;
}

function parseStringBuildingPart(
  part: string,
  groups: string[],
): ParsedStringBuildingPart {
  let searchIndex = part.indexOf('?');

  let primaryPath: string | undefined;
  let queryDict: GeneralQueryDict | undefined;

  if (searchIndex >= 0) {
    primaryPath = part.slice(0, searchIndex);

    let query = part.slice(searchIndex + 1);

    queryDict = query
      ? query.split('&').reduce(
          (dict, entry) => {
            let equalIndex = entry.indexOf('=');

            let key: string;
            let value: string;

            if (equalIndex < 0) {
              key = decodeURIComponent(entry);
              value = '';
            } else {
              key = decodeURIComponent(entry.slice(0, equalIndex));
              value = decodeURIComponent(entry.slice(equalIndex + 1));
            }

            dict[key] = value;

            return dict;
          },
          {} as GeneralQueryDict,
        )
      : {};
  } else {
    primaryPath = part;
    queryDict = undefined;
  }

  let buildingPartGroups: ParsedStringBuildingPartGroup[] = [];

  if (primaryPath) {
    buildingPartGroups.push({
      name: undefined,
      path: primaryPath,
    });
  }

  if (queryDict) {
    for (let group of groups) {
      let key = `_${group}`;

      if (hasOwnProperty(queryDict, key)) {
        buildingPartGroups.push({
          name: group,
          path: queryDict[key]!,
        });

        delete queryDict[key];
      }
    }

    if (Object.keys(queryDict).length === 0) {
      queryDict = undefined;
    }
  }

  return {
    groups: buildingPartGroups,
    query: queryDict,
  };
}
