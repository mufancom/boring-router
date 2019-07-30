import hyphenate from 'hyphenate';
import {observable, runInAction} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {
  buildRef,
  hasOwnProperty,
  isLocationEqual,
  isShallowlyEqual,
  parsePath,
  testPathPrefix,
  then,
} from './@utils';
import {IHistory, Location} from './history';
import {RouteBuilder, RouteBuilderBuildOptions} from './route-builder';
import {RouteGroup} from './route-group';
import {
  GeneralParamDict,
  GeneralQueryDict,
  NextRouteMatch,
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

export type NestedRouteSchemaDictType<
  TRouteSchema
> = TRouteSchema extends RouteSchemaChildrenSection<
  infer TNestedRouteSchemaDict
>
  ? TNestedRouteSchemaDict
  : {};

interface RouteSchemaExtensionSection<TRouteMatchExtension> {
  $extension: TRouteMatchExtension;
}

export type RouteMatchExtensionType<
  TRouteSchema
> = TRouteSchema extends RouteSchemaExtensionSection<infer TRouteMatchExtension>
  ? TRouteMatchExtension
  : {};

export type RouteMatchSegmentType<
  TRouteSchemaDict,
  TSegmentKey extends string,
  TQueryKey extends string,
  TGroupName extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    | TQueryKey
    | Extract<keyof RouteQuerySchemaType<TRouteSchemaDict[K]>, string>,
    TGroupName
  >
};

type __RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TGroupName extends string,
  TParamDict extends Dict<string | undefined>
> = RouteMatch<
  TParamDict,
  NextRouteMatch<TParamDict, TGroupName> &
    NextRouteMatchSegmentType<
      NestedRouteSchemaDictType<TRouteSchema>,
      TSegmentKey,
      TGroupName
    >,
  TGroupName
> &
  RouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TQueryKey,
    TGroupName
  > &
  RouteMatchExtensionType<TRouteSchema>;

export type RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TQueryKey extends string,
  TGroupName extends string
> = __RouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TQueryKey,
  TGroupName,
  Record<TQueryKey, string | undefined> & Record<TSegmentKey, string>
>;

export type NextRouteMatchSegmentType<
  TRouteSchemaDict,
  TSegmentKey extends string,
  TGroupName extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: NextRouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    TGroupName
  >
};

export type NextRouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TGroupName extends string
> = NextRouteMatch<
  Record<
    Extract<keyof RouteQuerySchemaType<TRouteSchema>, string>,
    string | undefined
  > &
    Record<TSegmentKey, string>,
  TGroupName
> &
  NextRouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TGroupName
  >;

export type RouteGroupType<
  TThisGroupName extends string,
  TRouteSchemaDict,
  TGroupNames extends string,
  TParamDict extends GeneralParamDict = GeneralParamDict
> = RouteGroup<
  TParamDict,
  NextRouteMatch<TParamDict, TGroupNames>,
  TThisGroupName,
  TGroupNames
> &
  RouteMatchSegmentType<TRouteSchemaDict, never, never, TGroupNames>;

export type RouterOnLeave = (path: string) => void;

export type RouterOnChange = (from: Location | undefined, to: Location) => void;

export type RouterOnRouteComplete = () => void;

export interface RouterOnRouteCompleteLocationState {
  onCompleteListenerId: number;
}

export interface RouterOptions {
  /**
   * A function to perform default schema field name to segment string
   * transformation.
   */
  segmentMatcher?: SegmentMatcherCallback;
  /** Default path on error. */
  default?: string;
  /** Prefix for path. */
  prefix?: string;
  /** Called when routing out current prefix. */
  onLeave?: RouterOnLeave;
  /** Called when route changes. */
  onChange?: RouterOnChange;
}

export interface RouterRefOptions<TGroupName extends string> {
  /**
   * Parallel route group(s) to leave. Set to `'*'` to leave all.
   */
  leaves?: '*' | TGroupName | TGroupName[];
  /**
   * Whether to preserve values in current query string.
   */
  preserveQuery?: boolean;
}

export class Router<TGroupNames extends string = string> {
  /** @internal */
  private _history: IHistory;

  /** @internal */
  private _segmentMatcher: SegmentMatcherCallback;

  /** @internal */
  private _default: Location;

  /** @internal */
  private _prefix: string;

  /** @internal */
  private _onLeave?: RouterOnLeave;

  /** @internal */
  private _onChange?: RouterOnChange;

  /** @internal */
  private _location: Location | undefined;

  /** @internal */
  private _nextLocation: Location | undefined;

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
  _groupToChildrenMap = new Map<string | undefined, RouteMatch[]>();

  /** @internal */
  _onRouteCompleteListenerMap = new Map<number, RouterOnRouteComplete>();

  constructor(
    history: IHistory,
    {
      segmentMatcher,
      default: defaultPath = '/',
      prefix = '',
      onLeave,
      onChange,
    }: RouterOptions = {},
  ) {
    this._history = history;
    this._default = parsePath(defaultPath);
    this._prefix = prefix;
    this._onLeave = onLeave;
    this._onChange = onChange;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    then(() => {
      history.listen(this._onLocationChange);
      this._onLocationChange(history.location);
    });
  }

  /** @internal */
  private get _groupSet(): Set<string> {
    return new Set(
      Array.from(this._groupToChildrenMap.keys()).filter(
        (group): group is string => !!group,
      ),
    );
  }

  route<TPrimaryRouteSchemaDict extends RouteSchemaDict>(
    schema: TPrimaryRouteSchemaDict,
    group?: never,
  ): RouteGroupType<never, TPrimaryRouteSchemaDict, TGroupNames>;
  route<
    TPrimaryRouteSchemaDict extends RouteSchemaDict,
    TGroupName extends TGroupNames
  >(
    group: TGroupName,
    schema: TPrimaryRouteSchemaDict,
  ): RouteGroupType<TGroupName, TPrimaryRouteSchemaDict, TGroupNames>;
  route<
    TPrimaryRouteSchemaDict extends RouteSchemaDict,
    TGroupName extends TGroupNames
  >(
    group: TPrimaryRouteSchemaDict | TGroupName,
    schema: TPrimaryRouteSchemaDict | TGroupName,
  ): RouteGroupType<TGroupName, TPrimaryRouteSchemaDict, TGroupNames> {
    let _group: TGroupName | undefined;
    let _schema: TPrimaryRouteSchemaDict;

    if (isSchema(group)) {
      _schema = group;
      _group = undefined;
    } else {
      _group = group;
      _schema = schema as TPrimaryRouteSchemaDict;
    }

    let routeGroup = new RouteGroup(
      _group,
      this._prefix,
      this._source,
      this._matchingSource,
      this._history,
    );

    routeGroup._children = this._build(_schema, routeGroup, routeGroup.$next);

    this._groupToChildrenMap.set(_group, [routeGroup]);

    return routeGroup as RouteGroupType<
      TGroupName,
      TPrimaryRouteSchemaDict,
      TGroupNames
    >;
  }

  /**
   * Generates a string reference that can be used for history navigation.
   */
  $ref({
    leaves = [],
    preserveQuery = true,
  }: RouterRefOptions<TGroupNames> = {}): string {
    let {pathMap: sourcePathMap, queryDict: sourceQueryDict} = this._source;
    let pathMap: Map<string | undefined, string>;

    if (leaves === '*') {
      pathMap = new Map([[undefined, sourcePathMap.get(undefined)!]]);
    } else {
      if (typeof leaves === 'string') {
        leaves = [leaves];
      }

      pathMap = new Map(sourcePathMap);

      for (let group of leaves) {
        pathMap.delete(group);
      }
    }

    return buildRef(this._prefix, pathMap, {
      ...(preserveQuery ? (sourceQueryDict as Dict<string>) : undefined),
    });
  }

  $build<TRouteMatchShared extends RouteMatchShared>(
    match: TRouteMatchShared,
    params?: Partial<RouteMatchSharedToParamDict<TRouteMatchShared>> &
      EmptyObjectPatch,
    options?: RouteBuilderBuildOptions,
  ): RouteBuilder<TGroupNames> {
    return new RouteBuilder(match._prefix, match._source, this._history).$and(
      match,
      params,
      options,
    );
  }

  /** @internal */
  private _onLocationChange = (location: Location): void => {
    this._nextLocation = location;

    this._changing = this._changing
      .then(() => this._asyncOnLocationChange(location))
      .catch(console.error);
  };

  /** @internal */
  private _asyncOnLocationChange = async (
    nextLocation: Location,
  ): Promise<void> => {
    let onCompleteListener: RouterOnRouteComplete | undefined;

    let state = nextLocation.state;

    if (isRouterOnRouteCompleteLocationState(state)) {
      let onCompleteListenerId = state.onCompleteListenerId;

      onCompleteListener = this._onRouteCompleteListenerMap.get(
        onCompleteListenerId,
      );
      this._onRouteCompleteListenerMap.delete(onCompleteListenerId);
    }

    if (this._isNextLocationOutDated(nextLocation)) {
      return;
    }

    let {pathname, search} = nextLocation;

    let location = this._location;

    if (location && isLocationEqual(location, nextLocation)) {
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

    let prefix = this._prefix;

    let pathMap = new Map<string | undefined, string>();

    // Process primary route path
    if (!testPathPrefix(pathname, prefix)) {
      let onLeave = this._onLeave;

      if (onLeave) {
        onLeave(pathname);
      }

      return;
    }

    let pathWithoutPrefix = pathname.slice(prefix.length) || '/';

    pathMap.set(undefined, pathWithoutPrefix);

    // Extract group route paths in query
    for (let group of this._groupSet) {
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

    let groupToChildrenMap = this._groupToChildrenMap;

    for (let [group, path] of pathMap) {
      let routeMatches = groupToChildrenMap.get(group) || [];

      let routeMatchEntries = this._routerMatch(routeMatches, path) || [];

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
              entries.map(
                (entry): [RouteMatch, RouteMatchEntry] => [entry.match, entry],
              ),
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

    await this._update(
      nextLocation,
      undefined,
      groupToMatchToMatchEntryMapMap.get(undefined),
    );

    let groupSet = new Set([...pathMap.keys(), ...this._source.pathMap.keys()]);

    groupSet.delete(undefined);

    await Promise.all(
      Array.from(groupSet).map(group =>
        this._update(
          nextLocation,
          group,
          groupToMatchToMatchEntryMapMap.get(group),
        ),
      ),
    );

    if (this._onChange) {
      this._onChange(location, nextLocation);
    }

    if (onCompleteListener) {
      onCompleteListener();
    }
  };

  /** @internal */
  private async _update(
    nextLocation: Location,
    group: string | undefined,
    matchToMatchEntryMap: Map<RouteMatch, RouteMatchEntry> | undefined,
  ): Promise<void> {
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
    let nextMatchSet = new Set(matchToMatchEntryMap.keys());

    let leavingMatchSet = new Set(previousMatchSet);

    for (let match of nextMatchSet) {
      leavingMatchSet.delete(match);
    }

    let reversedLeavingMatches = Array.from(leavingMatchSet).reverse();

    let enteringAndUpdatingMatchSet = new Set(nextMatchSet);

    let triggerByDescendanceMatchSet = new Set<RouteMatch>();

    for (let match of previousMatchSet) {
      if (!enteringAndUpdatingMatchSet.has(match)) {
        continue;
      }

      let nextMatch = match.$next;

      if (
        isShallowlyEqual(match._pathSegments, nextMatch._pathSegments) &&
        match.$exact === nextMatch.$exact
      ) {
        if (match._rest === nextMatch._rest) {
          enteringAndUpdatingMatchSet.delete(match);
        } else {
          triggerByDescendanceMatchSet.add(match);
        }
      }
    }

    for (let match of reversedLeavingMatches) {
      let result = await match._beforeLeave();

      if (this._isNextLocationOutDated(nextLocation)) {
        return;
      }

      if (!result) {
        this._revert();
        return;
      }
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      let result = update
        ? await match._beforeUpdate(triggerByDescendanceMatchSet.has(match))
        : await match._beforeEnter();

      if (this._isNextLocationOutDated(nextLocation)) {
        return;
      }

      if (!result) {
        this._revert();
        return;
      }
    }

    // Update

    this._location = nextLocation;

    runInAction(() => {
      let source = this._source;
      let matchingSource = this._matchingSource;

      source.queryDict = matchingSource.queryDict;

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
    });

    // Process after hooks

    for (let match of reversedLeavingMatches) {
      await match._afterLeave();
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      if (update) {
        await match._afterUpdate(triggerByDescendanceMatchSet.has(match));
      } else {
        await match._afterEnter();
      }
    }
  }

  /** @internal */
  private _isNextLocationOutDated(location: Location): boolean {
    return location !== this._nextLocation;
  }

  /** @internal */
  private _revert(): void {
    this._history.replace(this._location || this._default);
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
  private _build(
    schemaDict: RouteSchemaDict,
    parent: RouteMatch,
    matchingParent: NextRouteMatch,
  ): RouteMatch[] {
    let routeMatches: RouteMatch[] = [];

    let source = this._source;
    let matchingSource = this._matchingSource;
    let history = this._history;
    let prefix = this._prefix;
    let group = parent.$group;

    for (let [routeName, schema] of Object.entries(schemaDict)) {
      if (typeof schema === 'boolean') {
        schema = {};
      }

      let {
        $match: match = this._segmentMatcher(routeName),
        $query: query,
        $exact: exact = false,
        $children: children,
        $extension: extension = {},
      } = schema;

      let options: RouteMatchOptions = {
        match,
        query,
        exact,
        group,
      };

      let routeMatch = new RouteMatch(
        routeName,
        prefix,
        source,
        parent,
        extension,
        history,
        options,
      );

      let nextRouteMatch = new NextRouteMatch(
        routeName,
        prefix,
        matchingSource,
        matchingParent,
        routeMatch,
        extension,
        history,
        options,
      );

      (routeMatch as any).$next = nextRouteMatch;

      routeMatches.push(routeMatch);

      (parent as any)[routeName] = routeMatch;
      // (matchingParent as any)[routeName] = nextRouteMatch;

      if (!children) {
        continue;
      }

      routeMatch._children = this._build(children, routeMatch, nextRouteMatch);
    }

    return routeMatches;
  }
}

function isSchema<TGRoupName extends RouteSchemaDict>(
  schema: any,
): schema is TGRoupName {
  return typeof schema === 'object';
}

function isRouterOnRouteCompleteLocationState(
  object: any,
): object is RouterOnRouteCompleteLocationState {
  return object && typeof object.onCompleteListenerId === 'number';
}
