import hyphenate from 'hyphenate';
import _ from 'lodash';
import {makeObservable, observable, runInAction} from 'mobx';
import type {Dict, EmptyObjectPatch} from 'tslang';

import {parseRef, parseSearch} from './@utils';
import type {
  HistoryChangeCallbackRemovalHandler,
  HistorySnapshot,
  IHistory,
} from './history';
import {getActiveHistoryEntry} from './history';
import {RouteBuilder} from './route-builder';
import type {
  GeneralParamDict,
  RouteMatchEntry,
  RouteMatchOptions,
  RouteMatchShared,
  RouteMatchSharedToParamDict,
  RouteSource,
  RouteSourceQuery,
} from './route-match';
import {NextRouteMatch, RouteMatch} from './route-match';
import type {RootRouteSchema, RouteSchema, RouteSchemaDict} from './schema';

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
    TParamDict,
    TMetadata
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
  TMetadata extends object,
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: NextRouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    | TQueryKey
    | Extract<keyof RouteQuerySchemaType<TRouteSchemaDict[K]>, string>,
    TSpecificGroupName,
    TGroupName,
    TMetadata
  >;
};

type __NextRouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TParamDict extends Dict<string | undefined>,
  TMetadata extends object,
> = NextRouteMatch<
  TParamDict,
  TSpecificGroupName,
  TGroupName,
  RouteMatchMetadataType<TRouteSchema, TMetadata>
> &
  NextRouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TQueryKey,
    TSpecificGroupName,
    TGroupName,
    RouteMatchMetadataType<TRouteSchema, TMetadata>
  >;

type NextRouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TSpecificGroupName extends string | undefined,
  TGroupName extends string,
  TMetadata extends object,
> = __NextRouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TSpecificGroupName,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>,
  TMetadata
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
  readOnly?: boolean;
  /**
   * Start listen automatically, defaults to true unless `readOnly` is true.
   */
  listen?: boolean;
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

  readonly $readOnly: boolean;

  /** @internal */
  readonly _groupToRouteMatchMap = new Map<string | undefined, RouteMatch>();

  /** @internal */
  private _segmentMatcher: SegmentMatcherCallback;

  /** @internal */
  @observable.ref
  private _snapshot: RouterHistorySnapshot | undefined;

  /** @internal */
  @observable.ref
  private _nextSnapshot: RouterHistorySnapshot | undefined;

  /** @internal */
  private _source: RouteSource = observable({
    groupToMatchToMatchEntryMapMap: new Map(),
    queryMap: new Map(),
    pathMap: new Map(),
  });

  /** @internal */
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

  constructor(
    history: RouterHistory,
    {
      readOnly = false,
      listen = readOnly ? false : true,
      segmentMatcher,
    }: RouterOptions = {},
  ) {
    makeObservable(this);

    this._history = history;
    this.$readOnly = readOnly;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    if (listen) {
      this.$listen();
    }
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

  /** @internal */
  get _generalGroups(): (TGroupName | undefined)[] {
    return [undefined, ...this.$groups];
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

    const [routeMatch] = this._buildRouteMatch(
      group,
      '',
      undefined,
      undefined,
      {
        $exact: true,
        $match: '',
        ...schema,
      },
    );

    this._groupToRouteMatchMap.set(group, routeMatch);

    return routeMatch;
  }

  $listen(): HistoryChangeCallbackRemovalHandler {
    const history = this._history;

    if (this.$readOnly) {
      this._snapshot = history.snapshot;
      this._updateMatchingSource(history.ref);
      this._update([]);

      return () => {};
    } else {
      return history.listen(this._onHistoryChange);
    }
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
    const buildingPart =
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
    this._assertNonReadOnly();

    this._history
      .push(ref, {navigateCompleteListener: onComplete})
      .catch(console.error);
  }

  /** @internal */
  _replace(ref: string, {onComplete}: RouterNavigateOptions = {}): void {
    this._assertNonReadOnly();

    this._history
      .replace(ref, {navigateCompleteListener: onComplete})
      .catch(console.error);
  }

  /** @internal */
  private _onHistoryChange = (snapshot: RouterHistorySnapshot): void => {
    runInAction(() => {
      this._nextSnapshot = snapshot;
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
    const snapshot = this._snapshot;

    if (snapshot && _.isEqual(snapshot, nextSnapshot)) {
      return;
    }

    if (this._isNextSnapshotOutDated(nextSnapshot)) {
      return;
    }

    const {ref, data} = getActiveHistoryEntry(nextSnapshot);

    const navigateCompleteListener = data && data.navigateCompleteListener;

    this._updateMatchingSource(ref);

    const groupToMatchToMatchEntryMapMap =
      this._matchingSource.groupToMatchToMatchEntryMapMap;

    const interUpdateDataArray = await Promise.all(
      this._generalGroups.map(async group =>
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

    runInAction(() => {
      this._snapshot = nextSnapshot;
      this._update(interUpdateDataArray as InterUpdateData[]);
    });

    await Promise.all(
      interUpdateDataArray.map(data => this._afterUpdate(data!)),
    );

    if (navigateCompleteListener) {
      navigateCompleteListener();
    }
  };

  /** @internal */
  private _updateMatchingSource(ref: string): void {
    const {pathname, search} = parseRef(ref);

    const queryMap = parseSearch(search);

    const pathMap = new Map<string | undefined, string>();

    pathMap.set(undefined, pathname || '/');

    const groups = this.$groups;

    // Extract group route paths in query
    for (const group of groups) {
      const key = `_${group}`;

      if (!queryMap.has(key)) {
        continue;
      }

      const path = queryMap.get(key);

      if (path) {
        pathMap.set(group, path);
      }

      queryMap.delete(key);
    }

    // Match parallel routes
    const groupToMatchEntriesMap = new Map<
      string | undefined,
      RouteMatchEntry[]
    >();

    const groupToRouteMatchMap = this._groupToRouteMatchMap;

    for (const [group, path] of pathMap) {
      const routeMatch = groupToRouteMatchMap.get(group)!;

      const routeMatchEntries = this._match([routeMatch], path) || [];

      if (!routeMatchEntries.length) {
        continue;
      }

      const [{match}] = routeMatchEntries;

      if (match.$group !== group) {
        continue;
      }

      groupToMatchEntriesMap.set(group, routeMatchEntries);
    }

    // Check primary match parallel options
    const groupToMatchToMatchEntryMapMap = new Map<
      string | undefined,
      Map<RouteMatch, RouteMatchEntry>
    >();

    const primaryMatchEntries = groupToMatchEntriesMap.get(undefined);

    {
      const primaryMatch =
        primaryMatchEntries?.[primaryMatchEntries.length - 1].match;

      const options = primaryMatch?._parallel;

      const {groups = [], matches = []} = options || {};

      for (const [group, entries] of groupToMatchEntriesMap) {
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

    const matchingSource = this._matchingSource;

    runInAction(() => {
      matchingSource.groupToMatchToMatchEntryMapMap =
        groupToMatchToMatchEntryMapMap;
      matchingSource.pathMap = pathMap;

      const matchingQueryKeyToIdMap = new Map(
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
  }

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

    const previousMatchSet = new Set(previousMatchToMatchEntryMap.keys());
    const matchSet = new Set(matchToMatchEntryMap.keys());

    const leavingMatchSet = new Set(previousMatchSet);

    for (const match of matchSet) {
      leavingMatchSet.delete(match);
    }

    const reversedLeavingMatches = Array.from(leavingMatchSet).reverse();

    const enteringAndUpdatingMatchSet = new Set(matchSet);

    const descendantUpdatingMatchSet = new Set<RouteMatch>();

    for (const match of previousMatchSet) {
      if (!enteringAndUpdatingMatchSet.has(match)) {
        continue;
      }

      const nextMatch = match.$next;

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

    for (const match of reversedLeavingMatches) {
      const result = await match._beforeLeave();

      if (this._isNextSnapshotOutDated(nextSnapshot)) {
        return undefined;
      }

      if (!result) {
        this._revert();
        return undefined;
      }
    }

    for (const match of enteringAndUpdatingMatchSet) {
      const update = previousMatchSet.has(match);

      const result = update
        ? await match._beforeUpdate(descendantUpdatingMatchSet.has(match))
        : await match._beforeEnter();

      if (!result) {
        match._abortEnterUpdate();
      }

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
    for (const match of reversedLeavingMatches) {
      await match._willLeave();
    }

    for (const match of enteringAndUpdatingMatchSet) {
      const update = previousMatchSet.has(match);

      if (update) {
        await match._willUpdate(descendantUpdatingMatchSet.has(match));
      } else {
        await match._willEnter();
      }
    }
  }

  /** @internal */
  private _update(dataArray: InterUpdateData[]): void {
    const source = this._source;
    const matchingSource = this._matchingSource;

    source.queryMap = matchingSource.queryMap;

    for (const group of this._generalGroups) {
      const path = matchingSource.pathMap.get(group)!;

      if (path) {
        source.pathMap.set(group, path);
      } else {
        source.pathMap.delete(group);
      }

      const matchToMatchEntryMap =
        matchingSource.groupToMatchToMatchEntryMapMap.get(group)!;

      source.groupToMatchToMatchEntryMapMap.set(group, matchToMatchEntryMap);
    }

    for (const {
      reversedLeavingMatches,
      enteringAndUpdatingMatchSet,
      previousMatchSet,
      descendantUpdatingMatchSet,
    } of dataArray) {
      for (const match of reversedLeavingMatches) {
        match._leave();
      }

      for (const match of enteringAndUpdatingMatchSet) {
        const update = previousMatchSet.has(match);

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
    for (const match of reversedLeavingMatches) {
      await match._afterLeave();
    }

    for (const match of enteringAndUpdatingMatchSet) {
      const update = previousMatchSet.has(match);

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
    const snapshot = this._snapshot;

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
    for (const routeMatch of routeMatches) {
      const {matched, exactlyMatched, segment, rest} =
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

      const result = this._match(routeMatch._children || [], rest);

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

        const [routeMatch, nextRouteMatch] = this._buildRouteMatch(
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
    const source = this._source;
    const matchingSource = this._matchingSource;
    const history = this._history;

    const query = new Map(Object.entries(queryDict ?? {}));

    const options: RouteMatchOptions = {
      match,
      query,
      exact,
      group,
      metadata,
    };

    const routeMatch = new RouteMatch(
      routeName,
      this as Router,
      source,
      parent,
      extension,
      history,
      options,
    );

    const nextRouteMatch = new NextRouteMatch(
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
      const [childRouteMatches, childNextRouteMatches] =
        this._buildRouteMatches(group, children, routeMatch, nextRouteMatch);

      routeMatch._children = childRouteMatches;
      nextRouteMatch._children = childNextRouteMatches;
    }

    return [routeMatch, nextRouteMatch];
  }

  /** @internal */
  private _assertNonReadOnly(): void {
    if (this.$readOnly) {
      throw new Error('Router is read-only');
    }
  }
}
