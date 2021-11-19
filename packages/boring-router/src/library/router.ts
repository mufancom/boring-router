import hyphenate from 'hyphenate';
import _ from 'lodash';
import {action, makeObservable, observable, runInAction} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {parseRef, parseSearch} from './@utils';
import {HistorySnapshot, IHistory, getActiveHistoryEntry} from './history';
import {RouteBuilder} from './route-builder';
import {
  GeneralParamDict,
  NextRouteMatch,
  RouteMatch,
  RouteMatchEntry,
  RouteMatchOptions,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSource,
  RouteSourceQuery,
} from './route-match';
import {RootRouteSchema, RouteSchema, RouteSchemaDict} from './schema';

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

type NestedRouteSchemaDictType<TRouteSchema> =
  TRouteSchema extends RouteSchemaChildrenSection<infer TNestedRouteSchemaDict>
    ? TNestedRouteSchemaDict
    : {};

interface RouteSchemaExtensionSection<TRouteMatchExtension> {
  $extension: TRouteMatchExtension;
}

interface RouteSchemaMetadataSection<TMetadata> {
  $metadata: TMetadata;
}

type RouteMatchMetadataType<TRouteSchema, TUpperMetadata> =
  TRouteSchema extends RouteSchemaMetadataSection<infer TMetadata>
    ? TMetadata & TUpperMetadata
    : TUpperMetadata;

type RouteMatchExtensionType<TRouteSchema> =
  TRouteSchema extends RouteSchemaExtensionSection<infer TRouteMatchExtension>
    ? TRouteMatchExtension
    : {};

type RouteMatchSegmentType<
  TRouteSchemaDict,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TMetadata extends object,
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
  TMetadata extends object,
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
  TMetadata extends object,
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
  TGroupName extends string,
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
  TGroupName extends string,
> = __NextRouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TSpecificGroupName,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>
>;

export type RootRouteMatchType<
  TRouteSchema,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TMetadata extends object = {},
> = RouteMatchType<
  TRouteSchema,
  never,
  Extract<keyof RouteQuerySchemaType<TRouteSchema>, string>,
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

export interface RouterNavigateOptions {
  /**
   * The callback that will be called after a route completed (after all the hooks).
   */
  onComplete?: RouterOnNavigateComplete;
}

export type RouterHistory = IHistory<unknown, RouterHistoryEntryData>;

export type RouterHistorySnapshot = HistorySnapshot<
  unknown,
  RouterHistoryEntryData
>;

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
  readonly _groupToRouteMatchMap = new Map<string | undefined, RouteMatch>();

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

  constructor(history: RouterHistory, {segmentMatcher}: RouterOptions = {}) {
    makeObservable(this);

    this._history = history;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    history.listen(this._onHistoryChange);
  }

  get $routing(): boolean {
    return this._routing > 0;
  }

  get $snapshot(): RouterHistorySnapshot | undefined {
    return this._snapshot;
  }

  get $nextSnapshot(): RouterHistorySnapshot | undefined {
    return this._nextSnapshot;
  }

  get $current(): RouteBuilder<TGroupName> {
    return new RouteBuilder(this, 'current');
  }

  get $next(): RouteBuilder<TGroupName> {
    return new RouteBuilder(this, 'next');
  }

  get $groups(): TGroupName[] {
    return Array.from(this._groupToRouteMatchMap.keys()).filter(
      (group): group is TGroupName => !!group,
    );
  }

  $route<TPrimaryRouteSchema extends RootRouteSchema>(
    schema: TPrimaryRouteSchema,
  ): RootRouteMatchType<TPrimaryRouteSchema, undefined, TGroupName>;
  $route<
    TRouteSchema extends RootRouteSchema,
    TSpecificGroupName extends TGroupName,
  >(
    group: TSpecificGroupName,
    schema: TRouteSchema,
  ): RootRouteMatchType<TRouteSchema, TSpecificGroupName, TGroupName>;
  $route(
    groupOrSchema: TGroupName | RootRouteSchema,
    schemaOrUndefined?: RootRouteSchema,
  ): RouteMatch {
    let group: TGroupName | undefined;
    let schema: RootRouteSchema;

    if (typeof groupOrSchema === 'string') {
      group = groupOrSchema;
      schema = schemaOrUndefined!;
    } else {
      group = undefined;
      schema = groupOrSchema;
    }

    let [routeMatch] = this._buildRouteMatch(group, '', undefined, undefined, {
      $exact: true,
      $match: '',
      ...schema,
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
    let buildingPart =
      typeof route === 'string'
        ? route
        : {
            route,
            params,
          };

    return new RouteBuilder(this, 'current', [buildingPart]);
  }

  $scratch(): RouteBuilder<TGroupName> {
    return new RouteBuilder(this, 'none');
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
      let routeMatch = groupToRouteMatchMap.get(group)!;

      let routeMatchEntries = this._match([routeMatch], path) || [];

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

    {
      let primaryMatch =
        primaryMatchEntries?.[primaryMatchEntries.length - 1].match;

      let options = primaryMatch?._parallel;

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
      matchingSource.groupToMatchToMatchEntryMapMap =
        groupToMatchToMatchEntryMapMap;
      matchingSource.pathMap = pathMap;

      let matchingQueryKeyToIdMap = new Map(
        _.flatMap(
          Array.from(groupToRouteMatchMap.values()).reverse(),
          route => [...route.$next.$rest._queryKeyToIdMap],
        ),
      );

      matchingSource.queryMap = new Map(
        _.compact(
          Array.from(queryMap).map(
            ([key, value]): [string, RouteSourceQuery] | undefined =>
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

    this._update(generalGroups, interUpdateDataArray as InterUpdateData[]);

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

    let previousMatchToMatchEntryMap =
      this._source.groupToMatchToMatchEntryMapMap.get(group);

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
  private _update(
    generalGroups: (string | undefined)[],
    dataArray: InterUpdateData[],
  ): void {
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

      let matchToMatchEntryMap =
        matchingSource.groupToMatchToMatchEntryMapMap.get(group)!;

      source.groupToMatchToMatchEntryMapMap.set(group, matchToMatchEntryMap);
    }

    for (let {
      reversedLeavingMatches,
      enteringAndUpdatingMatchSet,
      previousMatchSet,
      descendantUpdatingMatchSet,
    } of dataArray) {
      for (let match of reversedLeavingMatches) {
        match._leave();
      }

      for (let match of enteringAndUpdatingMatchSet) {
        let update = previousMatchSet.has(match);

        if (update) {
          match._update(descendantUpdatingMatchSet.has(match));
        } else {
          match._enter();
        }
      }
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
      let {matched, exactlyMatched, segment, rest} =
        routeMatch._match(upperRest);

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

        let [routeMatch, nextRouteMatch] = this._buildRouteMatch(
          group,
          routeName,
          parent,
          matchingParent,
          schema,
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
      $match: match = this._segmentMatcher(routeName),
      $exact: exact = false,
      $query: queryDict,
      $children: children,
      $extension: extension,
      $metadata: metadata,
    }: RouteSchema,
  ): [RouteMatch, NextRouteMatch] {
    let source = this._source;
    let matchingSource = this._matchingSource;
    let history = this._history;

    let query = new Map(Object.entries(queryDict ?? {}));

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
