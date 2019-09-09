import hyphenate from 'hyphenate';
import _ from 'lodash';
import {action, observable, runInAction} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {hasOwnProperty, parseRef} from './@utils';
import {HistorySnapshot, IHistory, getActiveHistoryEntry} from './history';
import {RouteBuilder} from './route-builder';
import {
  GeneralParamDict,
  GeneralQueryDict,
  NextRouteMatch,
  ROUTE_MATCH_START_ANCHOR_PATTERN,
  RouteMatch,
  RouteMatchEntry,
  RouteMatchOptions,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSource,
} from './route-match';
import {RouteSchemaDict} from './schema';

export type SegmentMatcherCallback = (key: string) => string;

const DEFAULT_SEGMENT_MATCHER_CALLBACK: SegmentMatcherCallback = key =>
  hyphenate(key, {lowerCase: true});

type RouteQuerySchemaType<TRouteSchema> = TRouteSchema extends {
  $query: infer TQuerySchema;
}
  ? TQuerySchema
  : never;

type FilterRouteMatchNonStringSegment<TRouteSchema, T> = TRouteSchema extends {
  $match: infer TMatch;
}
  ? TMatch extends string
    ? never
    : T
  : never;

interface RouteSchemaChildrenSection<TRouteSchemaDict> {
  $children: TRouteSchemaDict;
}

type NestedRouteSchemaDictType<
  TRouteSchema
> = TRouteSchema extends RouteSchemaChildrenSection<
  infer TNestedRouteSchemaDict
>
  ? TNestedRouteSchemaDict
  : {};

interface RouteSchemaExtensionSection<TRouteMatchExtension> {
  $extension: TRouteMatchExtension;
}

type RouteMatchExtensionType<
  TRouteSchema
> = TRouteSchema extends RouteSchemaExtensionSection<infer TRouteMatchExtension>
  ? TRouteMatchExtension
  : {};

type RouteMatchSegmentType<
  TRouteSchemaDict,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    | TQueryKey
    | Extract<keyof RouteQuerySchemaType<TRouteSchemaDict[K]>, string>,
    TSpecificGroupName,
    TGroupName
  >;
};

type __RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TParamDict extends Dict<string | undefined>,
  TPathParamDict extends Dict<string | undefined>
> = RouteMatch<
  TParamDict,
  TPathParamDict,
  __NextRouteMatchType<
    TRouteSchema,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName,
    TParamDict,
    TPathParamDict
  >,
  TSpecificGroupName,
  TGroupName
> &
  RouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName
  > &
  RouteMatchExtensionType<TRouteSchema>;

export type RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string
> = __RouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TSpecificGroupName,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>,
  Record<TSegmentKey, string>
>;

type NextRouteMatchSegmentType<
  TRouteSchemaDict,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: NextRouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    | TQueryKey
    | Extract<keyof RouteQuerySchemaType<TRouteSchemaDict[K]>, string>,
    TSpecificGroupName,
    TGroupName
  >;
};

type __NextRouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TParamDict extends Dict<string | undefined>,
  TPathParamDict extends Dict<string | undefined>
> = NextRouteMatch<TParamDict, TPathParamDict, TSpecificGroupName, TGroupName> &
  NextRouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName
  >;

type NextRouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string
> = __NextRouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TSpecificGroupName,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>,
  Record<TSegmentKey, string>
>;

export type RootRouteMatchType<
  TRouteSchemaDict,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string
> = RouteMatchType<
  {$children: TRouteSchemaDict},
  never,
  never,
  TSpecificGroupName,
  TGroupName
>;

export type RouterOnLeave = (path: string) => void;

export type RouterOnNavigateComplete = () => void;

export interface RouterHistoryEntryData {
  navigateCompleteListener?: RouterOnNavigateComplete;
}

export interface RouterOptions {
  /**
   * A function to perform default schema field name to segment string
   * transformation.
   */
  segmentMatcher?: SegmentMatcherCallback;
}

interface BuildRouteMatchOptions {
  match: string | symbol | RegExp;
  exact: boolean;
  query: Dict<boolean> | undefined;
  children: RouteSchemaDict | undefined;
  extension: object | undefined;
}

export interface RouterNavigateOptions {
  /**
   * The callback that will be called after a route completed (after all the hooks).
   */
  onComplete?: RouterOnNavigateComplete;
}

export type RouterHistory = IHistory<unknown, RouterHistoryEntryData>;

type RouterHistorySnapshot = HistorySnapshot<unknown, RouterHistoryEntryData>;

interface InterUpdateData {
  reversedLeavingMatches: RouteMatch[];
  enteringAndUpdatingMatchSet: Set<RouteMatch>;
  previousMatchSet: Set<RouteMatch>;
  descendantUpdatingMatchSet: Set<RouteMatch>;
}

export class Router<TGroupName extends string = string> {
  /** @internal */
  readonly _history: RouterHistory;

  /** @internal */
  private _segmentMatcher: SegmentMatcherCallback;

  /** @internal */
  private _snapshot: RouterHistorySnapshot | undefined;

  /** @internal */
  private _nextSnapshot: RouterHistorySnapshot | undefined;

  /** @internal */
  private _source: RouteSource = observable({
    groupToMatchToMatchEntryMapMap: new Map(),
    queryDict: {},
    pathMap: new Map(),
  });

  /** @internal */
  @observable
  private _matchingSource: RouteSource = observable({
    groupToMatchToMatchEntryMapMap: new Map(),
    queryDict: {},
    pathMap: new Map(),
  });

  /** @internal */
  private _changing = Promise.resolve();

  /** @internal */
  @observable
  private _routing = false;

  /** @internal */
  private _groupToRouteMatchMap = new Map<string | undefined, RouteMatch>();

  constructor(history: RouterHistory, {segmentMatcher}: RouterOptions = {}) {
    this._history = history;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    history.listen(this._onHistoryChange);
  }

  get $current(): RouteBuilder<TGroupName> {
    let {pathMap, queryDict} = this._source;

    return new RouteBuilder(pathMap, queryDict, this);
  }

  get $routing(): boolean {
    return this._routing;
  }

  get $next(): RouteBuilder<TGroupName> {
    let {pathMap, queryDict} = this._matchingSource;

    return new RouteBuilder(pathMap, queryDict, this);
  }

  get $groups(): TGroupName[] {
    return Array.from(this._groupToRouteMatchMap.keys()).filter(
      (group): group is TGroupName => !!group,
    );
  }

  $route<TPrimaryRouteSchemaDict extends RouteSchemaDict>(
    schema: TPrimaryRouteSchemaDict,
  ): RootRouteMatchType<TPrimaryRouteSchemaDict, undefined, TGroupName>;
  $route<
    TRouteSchemaDict extends RouteSchemaDict,
    TSpecificGroupName extends TGroupName
  >(
    group: TSpecificGroupName,
    schema: TRouteSchemaDict,
  ): RootRouteMatchType<TRouteSchemaDict, TSpecificGroupName, TGroupName>;
  $route(
    groupOrSchema: TGroupName | RouteSchemaDict,
    schemaOrUndefined?: RouteSchemaDict,
  ): RouteMatch {
    let group: TGroupName | undefined;
    let schema: RouteSchemaDict;

    if (typeof groupOrSchema === 'string') {
      group = groupOrSchema;
      schema = schemaOrUndefined!;
    } else {
      group = undefined;
      schema = groupOrSchema;
    }

    let [routeMatch] = this._buildRouteMatch(group, '', undefined, undefined, {
      match: ROUTE_MATCH_START_ANCHOR_PATTERN,
      exact: false,
      query: undefined,
      children: schema,
      extension: undefined,
    });

    this._groupToRouteMatchMap.set(group, routeMatch);

    return routeMatch;
  }

  $ref(): string {
    return this.$current.$ref();
  }

  $href(): string {
    return this.$current.$href();
  }

  $<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(part: string): RouteBuilder<TGroupName>;
  $(match: RouteMatchShared | string, params?: GeneralParamDict): RouteBuilder {
    let {pathMap, queryDict} = this._source;

    let buildingPart =
      typeof match === 'string'
        ? match
        : {
            match,
            params,
          };

    return new RouteBuilder(pathMap, queryDict, this, [buildingPart]);
  }

  $scratch(): RouteBuilder<TGroupName> {
    return new RouteBuilder(new Map(), {}, this);
  }

  /** @internal */
  _push(ref: string, {onComplete}: RouterNavigateOptions = {}): void {
    this._history
      .push(ref, {navigateCompleteListener: onComplete})
      .catch(console.error);
  }

  /** @internal */
  _replace(ref: string, {onComplete}: RouterNavigateOptions = {}): void {
    this._history
      .replace(ref, {navigateCompleteListener: onComplete})
      .catch(console.error);
  }

  /** @internal */
  private _onHistoryChange = (snapshot: RouterHistorySnapshot): void => {
    this._nextSnapshot = snapshot;

    this._changing = this._changing
      .then(() => this._asyncOnHistoryChange(snapshot))
      .catch(console.error);
  };

  /** @internal */
  private _asyncOnHistoryChange = async (
    nextSnapshot: RouterHistorySnapshot,
  ): Promise<void> => {
    if (this._isNextSnapshotOutDated(nextSnapshot)) {
      return;
    }

    let {ref, data} = getActiveHistoryEntry(nextSnapshot);

    let navigateCompleteListener = data && data.navigateCompleteListener;

    let {pathname, search} = parseRef(ref);

    let snapshot = this._snapshot;

    if (snapshot && _.isEqual(snapshot, nextSnapshot)) {
      return;
    }

    let searchParams = new URLSearchParams(search);

    let queryDict = Array.from(searchParams).reduce(
      (dict, [key, value]) => {
        dict[key] = value;
        return dict;
      },
      {} as GeneralQueryDict,
    );

    let pathMap = new Map<string | undefined, string>();

    pathMap.set(undefined, pathname || '/');

    let groups = this.$groups;

    // Extract group route paths in query
    for (let group of groups) {
      let key = `_${group}`;

      if (!hasOwnProperty(queryDict, key)) {
        continue;
      }

      let path = queryDict[key];

      if (path) {
        pathMap.set(group, path);
      }

      delete queryDict[key];
    }

    // Match parallel routes
    let groupToMatchEntriesMap = new Map<
      string | undefined,
      RouteMatchEntry[]
    >();

    let groupToRouteMatchMap = this._groupToRouteMatchMap;

    for (let [group, path] of pathMap) {
      let routeMatch = groupToRouteMatchMap.get(group);

      let routeMatchEntries =
        this._routerMatch(routeMatch ? [routeMatch] : [], path) || [];

      if (!routeMatchEntries.length) {
        continue;
      }

      let [{match}] = routeMatchEntries;

      if (match.$group !== group) {
        continue;
      }

      groupToMatchEntriesMap.set(group, routeMatchEntries);
    }

    // Check primary match parallel options
    let groupToMatchToMatchEntryMapMap = new Map<
      string | undefined,
      Map<RouteMatch, RouteMatchEntry>
    >();

    let primaryMatchEntries = groupToMatchEntriesMap.get(undefined);

    if (primaryMatchEntries) {
      let primaryMatch =
        primaryMatchEntries[primaryMatchEntries.length - 1].match;

      let options = primaryMatch._parallel;

      let {groups = [], matches = []} = options || {};

      for (let [group, entries] of groupToMatchEntriesMap) {
        if (
          !group ||
          !options ||
          groups.includes(group) ||
          entries.some(({match}) => matches.includes(match))
        ) {
          groupToMatchToMatchEntryMapMap.set(
            group,
            new Map(
              entries.map((entry): [RouteMatch, RouteMatchEntry] => [
                entry.match,
                entry,
              ]),
            ),
          );
        }
      }
    }

    runInAction(() => {
      Object.assign(this._matchingSource, {
        groupToMatchToMatchEntryMapMap,
        queryDict,
        pathMap,
      });
    });

    let generalGroups = [undefined, ...groups];

    runInAction(() => {
      this._routing = true;
    });

    let interUpdateDataArray = await Promise.all(
      generalGroups.map(async group =>
        this._beforeUpdate(
          nextSnapshot,
          group,
          groupToMatchToMatchEntryMapMap.get(group),
        ),
      ),
    );

    runInAction(() => {
      this._routing = false;
    });

    if (interUpdateDataArray.some(data => !data)) {
      return;
    }

    this._update(generalGroups);

    this._snapshot = nextSnapshot;

    await Promise.all(
      interUpdateDataArray.map(data => this._afterUpdate(data!)),
    );

    if (navigateCompleteListener) {
      navigateCompleteListener();
    }
  };

  /** @internal */
  private async _beforeUpdate(
    nextSnapshot: RouterHistorySnapshot,
    group: string | undefined,
    matchToMatchEntryMap: Map<RouteMatch, RouteMatchEntry> | undefined,
  ): Promise<InterUpdateData | undefined> {
    if (!matchToMatchEntryMap) {
      matchToMatchEntryMap = new Map();
    }

    // Prepare previous/next match set

    let previousMatchToMatchEntryMap = this._source.groupToMatchToMatchEntryMapMap.get(
      group,
    );

    if (!previousMatchToMatchEntryMap) {
      previousMatchToMatchEntryMap = new Map();

      runInAction(() => {
        this._source.groupToMatchToMatchEntryMapMap.set(
          group,
          previousMatchToMatchEntryMap!,
        );
      });
    }

    let previousMatchSet = new Set(previousMatchToMatchEntryMap.keys());
    let matchSet = new Set(matchToMatchEntryMap.keys());

    let leavingMatchSet = new Set(previousMatchSet);

    for (let match of matchSet) {
      leavingMatchSet.delete(match);
    }

    let reversedLeavingMatches = Array.from(leavingMatchSet).reverse();

    let enteringAndUpdatingMatchSet = new Set(matchSet);

    let descendantUpdatingMatchSet = new Set<RouteMatch>();

    for (let match of previousMatchSet) {
      if (!enteringAndUpdatingMatchSet.has(match)) {
        continue;
      }

      let nextMatch = match.$next;

      if (
        _.isEqual(match._pathSegments, nextMatch._pathSegments) &&
        match.$exact === nextMatch.$exact
      ) {
        if (match._rest === nextMatch._rest) {
          enteringAndUpdatingMatchSet.delete(match);
        } else {
          descendantUpdatingMatchSet.add(match);
        }
      }
    }

    for (let match of reversedLeavingMatches) {
      let result = await match._beforeLeave();

      if (this._isNextSnapshotOutDated(nextSnapshot)) {
        return undefined;
      }

      if (!result) {
        this._revert();
        return undefined;
      }
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      let result = update
        ? await match._beforeUpdate(descendantUpdatingMatchSet.has(match))
        : await match._beforeEnter();

      if (this._isNextSnapshotOutDated(nextSnapshot)) {
        return undefined;
      }

      if (!result) {
        this._revert();
        return undefined;
      }
    }

    return {
      reversedLeavingMatches,
      enteringAndUpdatingMatchSet,
      previousMatchSet,
      descendantUpdatingMatchSet,
    };
  }

  /** @internal */
  @action
  private _update(generalGroups: (string | undefined)[]): void {
    let source = this._source;
    let matchingSource = this._matchingSource;

    source.queryDict = matchingSource.queryDict;

    for (let group of generalGroups) {
      let path = matchingSource.pathMap.get(group)!;

      if (path) {
        source.pathMap.set(group, path);
      } else {
        source.pathMap.delete(group);
      }

      let matchToMatchEntryMap = matchingSource.groupToMatchToMatchEntryMapMap.get(
        group,
      )!;

      source.groupToMatchToMatchEntryMapMap.set(group, matchToMatchEntryMap);
    }
  }

  /** @internal */
  private async _afterUpdate({
    reversedLeavingMatches,
    enteringAndUpdatingMatchSet,
    previousMatchSet,
    descendantUpdatingMatchSet,
  }: InterUpdateData): Promise<void> {
    for (let match of reversedLeavingMatches) {
      await match._afterLeave();
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      if (update) {
        await match._afterUpdate(descendantUpdatingMatchSet.has(match));
      } else {
        await match._afterEnter();
      }
    }
  }

  /** @internal */
  private _isNextSnapshotOutDated(snapshot: RouterHistorySnapshot): boolean {
    return this._nextSnapshot !== snapshot;
  }

  /** @internal */
  private _revert(): void {
    let snapshot = this._snapshot;

    if (!snapshot) {
      throw new Error('Cannot revert the very first snapshot');
    }

    this._history.restore(snapshot).catch(console.error);
  }

  /** @internal */
  private _routerMatch(
    routeMatches: RouteMatch[],
    upperRest: string,
  ): RouteMatchEntry[] | undefined {
    for (let routeMatch of routeMatches) {
      let {matched, exactlyMatched, segment, rest} = routeMatch._match(
        upperRest,
      );

      if (!matched) {
        continue;
      }

      if (exactlyMatched) {
        return [
          {
            match: routeMatch,
            segment: segment!,
            exact: true,
            rest,
          },
        ];
      }

      let result = this._routerMatch(routeMatch._children || [], rest);

      if (!result) {
        continue;
      }

      return [
        {
          match: routeMatch,
          segment: segment!,
          exact: false,
          rest,
        },
        ...result,
      ];
    }

    return undefined;
  }

  /** @internal */
  private _buildRouteMatches(
    group: string | undefined,
    schemaDict: RouteSchemaDict,
    parent: RouteMatch,
    matchingParent: NextRouteMatch,
  ): [RouteMatch[], NextRouteMatch[]] {
    return Object.entries(schemaDict).reduce<[RouteMatch[], NextRouteMatch[]]>(
      ([routeMatches, nextRouteMatches], [routeName, schema]) => {
        if (typeof schema === 'boolean') {
          schema = {};
        }

        let {
          $match: match = this._segmentMatcher(routeName),
          $exact: exact = false,
          $query: query,
          $children: children,
          $extension: extension,
        } = schema;

        let [routeMatch, nextRouteMatch] = this._buildRouteMatch(
          group,
          routeName,
          parent,
          matchingParent,
          {
            match,
            exact,
            query,
            children,
            extension,
          },
        );

        (parent as any)[routeName] = routeMatch;
        (matchingParent as any)[routeName] = nextRouteMatch;

        return [
          [...routeMatches, routeMatch],
          [...nextRouteMatches, nextRouteMatch],
        ];
      },
      [[], []],
    );
  }

  /** @internal */
  private _buildRouteMatch(
    group: string | undefined,
    routeName: string,
    parent: RouteMatch | undefined,
    matchingParent: NextRouteMatch | undefined,
    {match, exact, query, children, extension}: BuildRouteMatchOptions,
  ): [RouteMatch, NextRouteMatch] {
    let source = this._source;
    let matchingSource = this._matchingSource;
    let history = this._history;

    let options: RouteMatchOptions = {
      match,
      query,
      exact,
      group,
    };

    let routeMatch = new RouteMatch(
      routeName,
      this,
      source,
      parent,
      extension,
      history,
      options,
    );

    let nextRouteMatch = new NextRouteMatch(
      routeName,
      this,
      matchingSource,
      matchingParent,
      routeMatch,
      history,
      options,
    );

    (routeMatch as any).$next = nextRouteMatch;

    if (children) {
      let [childRouteMatches, childNextRouteMatches] = this._buildRouteMatches(
        group,
        children,
        routeMatch,
        nextRouteMatch,
      );

      routeMatch._children = childRouteMatches;
      nextRouteMatch._children = childNextRouteMatches;
    }

    return [routeMatch, nextRouteMatch];
  }
}
