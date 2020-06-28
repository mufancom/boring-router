import hyphenate from 'hyphenate';
import _ from 'lodash';
import {action, observable, runInAction} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {parseRef, parseSearch} from './@utils';
import {HistorySnapshot, IHistory, getActiveHistoryEntry} from './history';
import {RouteBuilder} from './route-builder';
import {
  GeneralParamDict,
  NextRouteMatch,
  ROUTE_MATCH_START_ANCHOR_PATTERN,
  RouteMatch,
  RouteMatchEntry,
  RouteMatchOptions,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSource,
  RouteSourceQuery,
} from './route-match';
import {RouteSchemaDict} from './schema';

export type SegmentMatcherCallback = (key: string) => string;

const DEFAULT_SEGMENT_MATCHER_CALLBACK: SegmentMatcherCallback = key =>
  hyphenate(key, {lowerCase: true});

type RouteQuerySchemaType<TRouteSchema> = TRouteSchema extends {
  $query: infer TQuerySchema;
}
  ? TQuerySchema
  : {};

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

interface RouteSchemaMetadataSection<TMetadata> {
  $metadata: TMetadata;
}

type RouteMatchMetadataType<
  TRouteSchema,
  TUpperMetadata
> = TRouteSchema extends RouteSchemaMetadataSection<infer TMetadata>
  ? TMetadata & TUpperMetadata
  : TUpperMetadata;

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
  TGroupName extends string,
  TMetadata extends object
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    | TQueryKey
    | Extract<keyof RouteQuerySchemaType<TRouteSchemaDict[K]>, string>,
    TSpecificGroupName,
    TGroupName,
    TMetadata
  >;
};

type __RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TParamDict extends Dict<string | undefined>,
  TMetadata extends object
> = RouteMatch<
  TParamDict,
  __NextRouteMatchType<
    TRouteSchema,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName,
    TParamDict
  >,
  TSpecificGroupName,
  TGroupName,
  RouteMatchMetadataType<TRouteSchema, TMetadata>
> &
  RouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName,
    RouteMatchMetadataType<TRouteSchema, TMetadata>
  > &
  RouteMatchExtensionType<TRouteSchema>;

export type RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TMetadata extends object
> = __RouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TSpecificGroupName,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>,
  TMetadata
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
  TParamDict extends Dict<string | undefined>
> = NextRouteMatch<TParamDict, TSpecificGroupName, TGroupName> &
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
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>
>;

export type RootRouteMatchType<
  TRouteSchemaDict,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TMetadata extends object = {}
> = RouteMatchType<
  {$children: TRouteSchemaDict},
  never,
  never,
  TSpecificGroupName,
  TGroupName,
  TMetadata
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
  exact: boolean | string;
  query: Dict<string | symbol | true> | undefined;
  children: RouteSchemaDict | undefined;
  extension: object | undefined;
  metadata: object | undefined;
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
    queryMap: new Map(),
    pathMap: new Map(),
  });

  /** @internal */
  @observable
  private _matchingSource: RouteSource = observable({
    groupToMatchToMatchEntryMapMap: new Map(),
    queryMap: new Map(),
    pathMap: new Map(),
  });

  /** @internal */
  private _changing = Promise.resolve();

  /** @internal */
  @observable
  private _routing = 0;

  /** @internal */
  private _beforeLeaveHookCalledMatchSet = new Set<RouteMatch | undefined>();

  /** @internal */
  private _groupToRouteMatchMap = new Map<string | undefined, RouteMatch>();

  constructor(history: RouterHistory, {segmentMatcher}: RouterOptions = {}) {
    this._history = history;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    history.listen(this._onHistoryChange);
  }

  get $current(): RouteBuilder<TGroupName> {
    let {pathMap, queryMap} = this._source;

    return new RouteBuilder(pathMap, queryMap, this);
  }

  get $routing(): boolean {
    return this._routing > 0;
  }

  get $next(): RouteBuilder<TGroupName> {
    let {pathMap, queryMap} = this._matchingSource;

    return new RouteBuilder(pathMap, queryMap, this);
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
      metadata: undefined,
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
    route: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
  ): RouteBuilder<TGroupName>;
  $(part: string): RouteBuilder<TGroupName>;
  $(route: RouteMatchShared | string, params?: GeneralParamDict): RouteBuilder {
    let {pathMap, queryMap} = this._source;

    let buildingPart =
      typeof route === 'string'
        ? route
        : {
            route,
            params,
          };

    return new RouteBuilder(pathMap, queryMap, this, [buildingPart]);
  }

  $scratch(): RouteBuilder<TGroupName> {
    return new RouteBuilder(new Map(), new Map(), this);
  }

  $push(ref: string, options?: RouterNavigateOptions): void {
    this.$current.$(ref).$push(options);
  }

  $replace(ref: string, options?: RouterNavigateOptions): void {
    this.$current.$(ref).$replace(options);
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

    if (!this.$routing) {
      this._beforeLeaveHookCalledMatchSet.clear();
    }

    runInAction(() => {
      this._routing++;
    });

    this._changing = this._changing
      .then(() => this._asyncOnHistoryChange(snapshot))
      .finally(() => {
        runInAction(() => {
          this._routing--;
        });
      })
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

    let queryMap = parseSearch(search);

    let pathMap = new Map<string | undefined, string>();

    pathMap.set(undefined, pathname || '/');

    let groups = this.$groups;

    // Extract group route paths in query
    for (let group of groups) {
      let key = `_${group}`;

      if (!queryMap.has(key)) {
        continue;
      }

      let path = queryMap.get(key);

      if (path) {
        pathMap.set(group, path);
      }

      queryMap.delete(key);
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
        this._match(routeMatch ? [routeMatch] : [], path) || [];

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

    let matchingSource = this._matchingSource;

    runInAction(() => {
      matchingSource.groupToMatchToMatchEntryMapMap = groupToMatchToMatchEntryMapMap;
      matchingSource.pathMap = pathMap;

      let matchingQueryKeyToIdMap = groupToRouteMatchMap.get(undefined)!.$next
        .$rest._queryKeyToIdMap;

      matchingSource.queryMap = new Map(
        _.compact(
          Array.from(queryMap).map(([key, value]):
            | [string, RouteSourceQuery]
            | undefined =>
            matchingQueryKeyToIdMap.has(key)
              ? [key, {id: matchingQueryKeyToIdMap.get(key)!, value}]
              : undefined,
          ),
        ),
      );
    });

    let generalGroups = [undefined, ...groups];

    let interUpdateDataArray = await Promise.all(
      generalGroups.map(async group =>
        this._beforeUpdate(
          nextSnapshot,
          group,
          groupToMatchToMatchEntryMapMap.get(group),
        ),
      ),
    );

    if (interUpdateDataArray.some(data => !data)) {
      return;
    }

    await Promise.all(
      interUpdateDataArray.map(data => this._willUpdate(data!)),
    );

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

    let beforeLeaveHookCalledMatchSet = this._beforeLeaveHookCalledMatchSet;

    for (let match of reversedLeavingMatches) {
      if (beforeLeaveHookCalledMatchSet.has(match)) {
        continue;
      }

      let result = await match._beforeLeave();

      if (this._isNextSnapshotOutDated(nextSnapshot)) {
        return undefined;
      }

      if (!result) {
        this._revert();
        return undefined;
      }

      beforeLeaveHookCalledMatchSet.add(match);
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
  private async _willUpdate({
    reversedLeavingMatches,
    enteringAndUpdatingMatchSet,
    previousMatchSet,
    descendantUpdatingMatchSet,
  }: InterUpdateData): Promise<void> {
    for (let match of reversedLeavingMatches) {
      await match._willLeave();
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      if (update) {
        await match._willUpdate(descendantUpdatingMatchSet.has(match));
      } else {
        await match._willEnter();
      }
    }
  }

  /** @internal */
  @action
  private _update(generalGroups: (string | undefined)[]): void {
    let source = this._source;
    let matchingSource = this._matchingSource;

    source.queryMap = matchingSource.queryMap;

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

    if (snapshot) {
      this._history.restore(snapshot).catch(console.error);
    } else {
      this._history.replace('/').catch(console.error);
    }
  }

  /** @internal */
  private _match(
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

      if (rest === '') {
        return [
          {
            match: routeMatch,
            segment: segment!,
            exact: exactlyMatched,
            rest,
          },
        ];
      }

      let result = this._match(routeMatch._children || [], rest);

      if (!result) {
        continue;
      }

      return [
        {
          match: routeMatch,
          segment: segment!,
          exact: exactlyMatched,
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
          $metadata: metadata,
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
            metadata,
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
    {
      match,
      exact,
      query: queryDict,
      children,
      extension,
      metadata,
    }: BuildRouteMatchOptions,
  ): [RouteMatch, NextRouteMatch] {
    let source = this._source;
    let matchingSource = this._matchingSource;
    let history = this._history;

    let query = new Map(
      Object.entries(queryDict ?? {}).map(([key, id]): [
        string,
        string | symbol,
      ] => [
        key,
        typeof id === 'boolean' ? Symbol(`query:${routeName}.${key}`) : id,
      ]),
    );

    let options: RouteMatchOptions = {
      match,
      query,
      exact,
      group,
      metadata,
    };

    let routeMatch = new RouteMatch(
      routeName,
      this as Router,
      source,
      parent,
      extension,
      history,
      options,
    );

    let nextRouteMatch = new NextRouteMatch(
      routeName,
      this as Router,
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
