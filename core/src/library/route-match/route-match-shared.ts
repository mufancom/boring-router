import {computed} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {buildRef} from '../@utils';
import {IHistory} from '../history';

import {RouteMatchEntry, RouteSource} from './route-match';

export type GeneralSegmentDict = Dict<string | undefined>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

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
  protected _prefix: string;

  /** @internal */
  protected _history: IHistory;

  /** @internal */
  protected _source: RouteSource;

  /** @internal */
  protected _matchPattern: string | RegExp;

  /** @internal */
  protected _queryKeySet: Set<string>;

  constructor(
    name: string,
    prefix: string,
    source: RouteSource,
    parent: RouteMatchShared | undefined,
    history: IHistory,
    {match, query, group}: RouteMatchSharedOptions,
  ) {
    this.$name = name;
    this.$group = group as TGroupName;
    this.$parent = parent;
    this._prefix = prefix;
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
  protected get _rest(): string {
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

    let paramKeySet = new Set(Object.keys(params));
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
          paramKeySet.delete(key);

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

    let queryKeySet = this._queryKeySet;

    let preservedQueryDict = beingPrimaryRoute
      ? preserveQuery
        ? Object.entries(sourceQueryDict)
            .filter(([key]) => queryKeySet.has(key))
            .reduce(
              (dict, [key, value]) => {
                dict[key] = value;
                return dict;
              },
              {} as Dict<string | undefined>,
            )
        : {}
      : (sourceQueryDict as Dict<string>);

    let restParamDict = Array.from(paramKeySet).reduce(
      (dict, key) => {
        if (!queryKeySet.has(key)) {
          throw new Error(
            `Parameter "${key}" is defined as neither segment nor query`,
          );
        }

        dict[key] = params[key]!;
        return dict;
      },
      {} as Dict<string>,
    );

    return buildRef(this._prefix, pathMap, {
      ...preservedQueryDict,
      ...restParamDict,
    });
  }

  /**
   * Perform a `history.push()` with `this.$ref(params, options)`.
   */
  $push(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    options?: RouterMatchRefOptions<TGroupName>,
  ): void {
    let ref = this.$ref(params, options);
    this._history.push(ref);
  }

  /**
   * Perform a `history.replace()` with `this.$ref(params, options)`.
   */
  $replace(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    options?: RouterMatchRefOptions<TGroupName>,
  ): void {
    let ref = this.$ref(params, options);
    this._history.replace(ref);
  }

  /** @internal */
  protected abstract _getMatchEntry(
    source: RouteSource,
  ): RouteMatchEntry | undefined;
}
