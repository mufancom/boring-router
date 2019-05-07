import {computed} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {buildRef, getNextId} from '../@utils';
import {IHistory} from '../history';
import {
  Router,
  RouterOnRouteComplete,
  RouterOnRouteCompleteLocationState,
} from '../router';

import {RouteMatchEntry, RouteSource} from './route-match';

export type GeneralSegmentDict = Dict<string | undefined>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

export type RouteMatchSharedToParamDict<
  TRouteMatchShared extends RouteMatchShared
> = TRouteMatchShared extends RouteMatchShared<infer TParamDict>
  ? TParamDict
  : never;

export interface RouterMatchRefOptions<TGroupName extends string> {
  /**
   * Whether to leave this match's group.
   */
  leave?: boolean;
  /**
   * Parallel route groups to leave.
   */
  leaves?: TGroupName[];
  /**
   * Whether to preserve rest path of current match, defaults to `false`.
   */
  rest?: boolean;
  /**
   * Whether to preserve query string that matches the target ref, defaults to
   * `true`.
   */
  preserveQuery?: boolean;
  /**
   * The callback that will be called after a route completed (after all the hooks).
   */
  onComplete?: RouterOnRouteComplete;
}

export interface RouteMatchSharedOptions {
  match: string | RegExp;
  query: Dict<boolean> | undefined;
  group: string | undefined;
}

export abstract class RouteMatchShared<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TGroupName extends string = string
> {
  /**
   * Name of this `RouteMatch`, correspondent to the field name of route
   * schema.
   */
  readonly $name: string;

  /**
   * Group of this `RouteMatch`, specified in the root route.
   */
  readonly $group: TGroupName | undefined;

  /**
   * Parent of this route match.
   */
  readonly $parent: RouteMatchShared | undefined;

  /** @internal */
  readonly _prefix: string;

  /** @internal */
  readonly _source: RouteSource;

  /** @internal */
  readonly _queryKeySet: Set<string>;

  /** @internal */
  protected _history: IHistory;

  /** @internal */
  protected _matchPattern: string | RegExp;

  /** @internal */
  protected _router: Router;

  constructor(
    name: string,
    prefix: string,
    router: Router,
    source: RouteSource,
    parent: RouteMatchShared | undefined,
    history: IHistory,
    {match, query, group}: RouteMatchSharedOptions,
  ) {
    this.$name = name;
    this.$group = group as TGroupName;
    this.$parent = parent;
    this._prefix = prefix;
    this._router = router;
    this._source = source;
    this._history = history;

    if (match instanceof RegExp && match.global) {
      throw new Error(
        'Expecting a non-global regular expression as match pattern',
      );
    }

    this._matchPattern = match;

    this._queryKeySet = new Set([
      ...(query ? Object.keys(query) : []),
      ...(parent ? parent._queryKeySet : []),
    ]);
  }

  /**
   * A dictionary of the combination of query string and segments.
   */
  @computed
  get $params(): TParamDict {
    return {
      ...this._paramSegments,
      ...this._query,
    } as TParamDict;
  }

  /** @internal */
  @computed
  protected get _matchEntry(): RouteMatchEntry | undefined {
    return this._getMatchEntry(this._source);
  }

  /** @internal */
  @computed
  protected get _segment(): string | undefined {
    let entry = this._matchEntry;
    return entry && entry.segment;
  }

  /** @internal */
  @computed
  protected get _paramSegments(): GeneralSegmentDict {
    let parent = this.$parent;
    let upperSegmentDict = parent && parent._paramSegments;

    let matchPattern = this._matchPattern;
    let segment = this._segment;

    return {
      ...upperSegmentDict,
      ...(typeof matchPattern === 'string'
        ? undefined
        : {[this.$name]: segment}),
    };
  }

  /** @internal */
  @computed
  get _pathSegments(): GeneralSegmentDict {
    let parent = this.$parent;
    let upperSegmentDict = parent && parent._pathSegments;

    let matchPattern = this._matchPattern;
    let segment = this._segment;

    return {
      ...upperSegmentDict,
      ...{
        [this.$name]: typeof matchPattern === 'string' ? matchPattern : segment,
      },
    };
  }

  /** @internal */
  @computed
  get _rest(): string {
    let entry = this._matchEntry;
    return entry ? entry.rest : '';
  }

  /** @internal */
  @computed
  protected get _query(): GeneralQueryDict | undefined {
    let sourceQueryDict = this._source.queryDict;

    return Array.from(this._queryKeySet).reduce(
      (dict, key) => {
        let value = sourceQueryDict[key];

        if (value !== undefined) {
          dict[key] = sourceQueryDict[key];
        }

        return dict;
      },
      {} as GeneralQueryDict,
    );
  }

  /**
   * Generates a string reference that can be used for history navigation.
   * @param params A dictionary of the combination of query string and
   * segments.
   */
  $ref(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    options?: RouterMatchRefOptions<TGroupName>,
  ): string;
  $ref(
    params: Partial<TParamDict> & EmptyObjectPatch = {},
    {
      leave = false,
      rest = false,
      preserveQuery = true,
      leaves = [],
    }: RouterMatchRefOptions<TGroupName> = {},
  ): string {
    let group = this.$group;
    let beingPrimaryRoute = group === undefined;

    let restParamKeySet = new Set(Object.keys(params));
    let {pathMap: sourcePathMap, queryDict: sourceQueryDict} = this._source;

    let pathMap = new Map(sourcePathMap);

    for (let item of leaves) {
      pathMap.delete(item);
    }

    if (leave) {
      if (beingPrimaryRoute) {
        throw new Error('Cannot leave the primary route');
      }

      pathMap.delete(group);
    } else {
      let segmentDict = this._pathSegments;

      let path = Object.keys(segmentDict)
        .map(key => {
          restParamKeySet.delete(key);

          let param = params[key];
          let segment = typeof param === 'string' ? param : segmentDict[key];

          if (typeof segment !== 'string') {
            throw new Error(`Parameter "${key}" is required`);
          }

          return `/${segment}`;
        })
        .join('');

      if (rest) {
        path += this._rest;
      }

      pathMap.set(group, path);
    }

    let preservedQueryDict: GeneralQueryDict = {};

    if (beingPrimaryRoute) {
      preservedQueryDict = {};

      let queryKeySet = this._queryKeySet;

      for (let [key, value] of Object.entries(sourceQueryDict)) {
        if (queryKeySet.has(key)) {
          preservedQueryDict[key] = value;
        }
      }

      for (let key of restParamKeySet) {
        if (!queryKeySet.has(key)) {
          throw new Error(
            `Parameter "${key}" is defined as neither segment nor query`,
          );
        }

        preservedQueryDict[key] = params[key];
      }
    } else {
      preservedQueryDict = sourceQueryDict;
    }

    let queryDict = preserveQuery ? preservedQueryDict : {};

    return buildRef(this._prefix, pathMap, queryDict);
  }

  /**
   * Perform a `history.push()` with `this.$ref(params, options)`.
   */
  $push(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    options?: RouterMatchRefOptions<TGroupName>,
  ): void {
    let ref = this.$ref(params, options);
    let state = this._generateState(options);

    this._history.push(ref, state);
  }

  /**
   * Perform a `history.replace()` with `this.$ref(params, options)`.
   */
  $replace(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    options?: RouterMatchRefOptions<TGroupName>,
  ): void {
    let ref = this.$ref(params, options);
    let state = this._generateState(options);

    this._history.replace(ref, state);
  }

  /** @internal */
  protected abstract _getMatchEntry(
    source: RouteSource,
  ): RouteMatchEntry | undefined;

  private _generateState({
    onComplete: onCompleteListener,
  }: RouterMatchRefOptions<TGroupName> = {}):
    | RouterOnRouteCompleteLocationState
    | undefined {
    if (!onCompleteListener) {
      return undefined;
    }

    let onCompleteListenerId = getNextId();

    this._router._onRouteCompleteListenerMap.set(
      onCompleteListenerId,
      onCompleteListener,
    );

    return {
      onCompleteListenerId,
    };
  }
}
