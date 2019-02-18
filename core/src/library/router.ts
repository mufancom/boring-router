import hyphenate from 'hyphenate';
import {observable, runInAction} from 'mobx';
import {Dict} from 'tslang';

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
import {RouteGroup} from './route-group';
import {
  GeneralQueryDict,
  NextRouteMatch,
  RouteMatch,
  RouteMatchOptions,
} from './route-match';
import {GroupToRouteSchemaDictDict, RouteSchemaDict} from './schema';

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
  ? TMatch extends string ? never : T
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
  TGroupName extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
    TRouteSchemaDict[K],
    TSegmentKey | FilterRouteMatchNonStringSegment<TRouteSchemaDict[K], K>,
    TGroupName
  >
};

type __RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
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
    TGroupName
  > &
  RouteMatchExtensionType<TRouteSchema>;

export type RouteMatchType<
  TRouteSchema,
  TSegmentKey extends string,
  TGroupName extends string
> = __RouteMatchType<
  TRouteSchema,
  TSegmentKey,
  TGroupName,
  Record<
    Extract<keyof RouteQuerySchemaType<TRouteSchema>, string>,
    string | undefined
  > &
    {[K in TSegmentKey]: string}
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
    {[K in TSegmentKey]: string},
  TGroupName
> &
  NextRouteMatchSegmentType<
    NestedRouteSchemaDictType<TRouteSchema>,
    TSegmentKey,
    TGroupName
  >;

export type RouteGroupType<
  TRouteSchemaDict,
  TGroupName extends string
> = RouteGroup<NextRouteMatchSegmentType<TRouteSchemaDict, never, TGroupName>> &
  RouteMatchSegmentType<TRouteSchemaDict, never, TGroupName>;

type __RouterType<
  TRouteSchemaDict,
  TGroupToRouteSchemaDictDict,
  TGroupName extends string
> = Router<
  {
    [K in keyof TGroupToRouteSchemaDictDict]: RouteGroupType<
      TGroupToRouteSchemaDictDict[K],
      TGroupName
    >
  },
  NextRouteMatchSegmentType<TRouteSchemaDict, never, TGroupName>,
  TGroupName
> &
  RouteMatchSegmentType<TRouteSchemaDict, never, TGroupName>;

export type RouterType<
  TRouteSchemaDict,
  TGroupToRouteSchemaDictDict
> = __RouterType<
  TRouteSchemaDict,
  TGroupToRouteSchemaDictDict,
  Extract<keyof TGroupToRouteSchemaDictDict, string>
>;

export interface RouteMatchEntry {
  match: RouteMatch;
  exact: boolean;
  segment: string;
}

export interface RouteSource {
  groupToMatchToMatchEntryMapMap: Map<
    string | undefined,
    Map<RouteMatch, RouteMatchEntry>
  >;
  queryDict: GeneralQueryDict;
  pathMap: Map<string | undefined, string>;
}

export type RouterOnLeave = (path: string) => void;

export type RouterOnChange = (from: Location | undefined, to: Location) => void;

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
  leaves?: TGroupName | TGroupName[];
  /**
   * Whether to preserve values in current query string.
   */
  preserveQuery?: boolean;
}

export class Router<
  TParallelRouteGroupDict extends object = object,
  TNextRouteMatchDict extends object = object,
  TGroupName extends string = string
> {
  readonly $ = {} as TParallelRouteGroupDict;

  readonly $next = {} as TNextRouteMatchDict;

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
  private _groupSet: Set<string>;

  /** @internal */
  _groupToChildrenMap = new Map<string | undefined, RouteMatch[]>();

  private constructor(
    primarySchema: RouteSchemaDict,
    groupToSchemaDict: GroupToRouteSchemaDictDict | undefined,
    history: IHistory,
    {
      segmentMatcher,
      default: defaultPath = '/',
      prefix = '',
      onLeave,
      onChange,
    }: RouterOptions,
  ) {
    this._history = history;
    this._default = parsePath(defaultPath);
    this._prefix = prefix;
    this._onLeave = onLeave;
    this._onChange = onChange;

    this._segmentMatcher = segmentMatcher || DEFAULT_SEGMENT_MATCHER_CALLBACK;

    this._groupSet = new Set();

    let groupToChildrenMap = this._groupToChildrenMap;
    let groupSet = this._groupSet;

    let primaryMatchRoutes = this._build(primarySchema, this, this.$next);

    groupToChildrenMap.set(undefined, primaryMatchRoutes);

    if (groupToSchemaDict) {
      let parallelRouteDict = this.$ as Dict<RouteGroup>;

      for (let [group, schema] of Object.entries(groupToSchemaDict)) {
        let routeGroup = new RouteGroup(group);

        parallelRouteDict[group] = routeGroup;

        groupToChildrenMap.set(
          group,
          this._build(schema, routeGroup, routeGroup.$next),
        );
        groupSet.add(group);
      }
    }

    then(() => {
      history.listen(this._onLocationChange);
      this._onLocationChange(history.location);
    });
  }

  /**
   * Generates a string reference that can be used for history navigation.
   */
  $ref({
    leaves = [],
    preserveQuery = true,
  }: RouterRefOptions<TGroupName> = {}): string {
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

  /**
   * Perform a `history.push()` with `this.$ref(options)`.
   */
  $push(options?: RouterRefOptions<TGroupName>): void {
    let ref = this.$ref(options);
    this._history.push(ref);
  }

  /**
   * Perform a `history.replace()` with `this.$ref(options)`.
   */
  $replace(options?: RouterRefOptions<TGroupName>): void {
    let ref = this.$ref(options);
    this._history.replace(ref);
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

      let routeMatchEntries = this._match(routeMatches, path) || [];

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
      this._source.groupToMatchToMatchEntryMapMap.set(
        group,
        previousMatchToMatchEntryMap,
      );
    }

    let previousMatchSet = new Set(previousMatchToMatchEntryMap.keys());
    let nextMatchSet = new Set(matchToMatchEntryMap.keys());

    let leavingMatchSet = new Set(previousMatchSet);

    for (let match of nextMatchSet) {
      leavingMatchSet.delete(match);
    }

    let reversedLeavingMatches = Array.from(leavingMatchSet).reverse();

    let enteringAndUpdatingMatchSet = new Set(nextMatchSet);

    for (let match of previousMatchSet) {
      if (!enteringAndUpdatingMatchSet.has(match)) {
        continue;
      }

      let nextMatch = match.$next;

      if (
        isShallowlyEqual(match._pathSegments, nextMatch._pathSegments) &&
        match.$exact === nextMatch.$exact
      ) {
        enteringAndUpdatingMatchSet.delete(match);
      }
    }

    // Process before hooks

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
        ? await match._beforeUpdate()
        : await match._beforeEnter();

      if (this._isNextLocationOutDated(nextLocation)) {
        return;
      }

      if (!result) {
        this._revert();
        return;
      }
    }

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

    // Update

    for (let match of reversedLeavingMatches) {
      match._update(false, false);
    }

    for (let match of nextMatchSet) {
      let {exact} = matchToMatchEntryMap.get(match)!;
      match._update(true, exact);
    }

    // Process after hooks

    for (let match of reversedLeavingMatches) {
      await match._afterLeave();
    }

    for (let match of enteringAndUpdatingMatchSet) {
      let update = previousMatchSet.has(match);

      if (update) {
        await match._afterUpdate();
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

      if (exactlyMatched) {
        return [
          {
            match: routeMatch,
            segment: segment!,
            exact: true,
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
          exact: false,
        },
        ...result,
      ];
    }

    return undefined;
  }

  /** @internal */
  private _build(
    schemaDict: RouteSchemaDict,
    parent: RouteMatch | RouteGroup | Router,
    matchingParent: object,
  ): RouteMatch[] {
    let routeMatches: RouteMatch[] = [];

    let source = this._source;
    let matchingSource = this._matchingSource;
    let history = this._history;
    let prefix = this._prefix;

    let group = '$group' in parent ? parent.$group : undefined;

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
        parent instanceof RouteMatch ? parent : undefined,
        extension,
        history,
        options,
      );

      let nextRouteMatch = new NextRouteMatch(
        routeName,
        prefix,
        matchingSource,
        matchingParent instanceof NextRouteMatch ? matchingParent : undefined,
        routeMatch,
        extension,
        history,
        options,
      );

      (routeMatch as any).$next = nextRouteMatch;

      routeMatches.push(routeMatch);

      (parent as any)[routeName] = routeMatch;
      (matchingParent as any)[routeName] = nextRouteMatch;

      if (!children) {
        continue;
      }

      routeMatch._children = this._build(children, routeMatch, nextRouteMatch);
    }

    return routeMatches;
  }

  static create<TPrimaryRouteSchemaDict extends RouteSchemaDict>(
    primarySchema: TPrimaryRouteSchemaDict,
    history: IHistory,
    options?: RouterOptions,
  ): RouterType<TPrimaryRouteSchemaDict, object>;
  static create<
    TPrimaryRouteSchemaDict extends RouteSchemaDict,
    TGroupToRouteSchemaDictDict extends GroupToRouteSchemaDictDict
  >(
    primarySchema: TPrimaryRouteSchemaDict,
    groupSchema: TGroupToRouteSchemaDictDict,
    history: IHistory,
    options?: RouterOptions,
  ): RouterType<TPrimaryRouteSchemaDict, TGroupToRouteSchemaDictDict>;
  static create(
    primarySchema: any,
    groupSchema: any,
    history: any = {},
    options: any = {},
  ): Router {
    if (isHistory(groupSchema)) {
      options = history;
      history = groupSchema;
      groupSchema = {};
    }

    return new Router(primarySchema, groupSchema, history, options);
  }
}

function isHistory(object: any): object is IHistory {
  return (
    object &&
    object.location &&
    typeof object.push === 'function' &&
    typeof object.replace === 'function' &&
    typeof object.listen === 'function'
  );
}
