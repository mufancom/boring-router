import {computed} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {IHistory} from '../history';
import {RouteBuilder} from '../route-builder';
import {Router, RouterNavigateOptions} from '../router';

import {RouteMatchEntry, RouteSource} from './route-match';

export const ROUTE_MATCH_START_ANCHOR_PATTERN = Symbol('^');

export type GeneralSegmentDict = Dict<string | undefined>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

export type RouteMatchSharedToParamDict<
  TRouteMatchShared extends RouteMatchShared
> = TRouteMatchShared extends RouteMatchShared<infer TParamDict>
  ? TParamDict
  : never;

export interface RouteMatchBuildOptions<TGroupName extends string> {
  /**
   * Whether to leave this match's group.
   */
  leave?: boolean;
  /**
   * Parallel route groups to leave.
   */
  leaves?: TGroupName | TGroupName[];
}

export interface RouteMatchNavigateOptions<TGroupName extends string>
  extends RouteMatchBuildOptions<TGroupName>,
    RouterNavigateOptions {}

export interface RouteMatchSharedOptions {
  match: string | symbol | RegExp;
  query: Dict<boolean> | undefined;
  group: string | undefined;
}

export abstract class RouteMatchShared<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TSpecificGroupName extends string | undefined = string | undefined,
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
  readonly $group: TSpecificGroupName | undefined;

  /**
   * Parent of this route match.
   */
  readonly $parent: RouteMatchShared | undefined;

  readonly $router: Router;

  /** @internal */
  readonly _source: RouteSource;

  /** @internal */
  readonly _queryKeySet: Set<string>;

  /** @internal */
  _children: this[] | undefined;

  /** @internal */
  protected _history: IHistory;

  /** @internal */
  protected _matchPattern: string | symbol | RegExp;

  constructor(
    name: string,
    router: Router,
    source: RouteSource,
    parent: RouteMatchShared | undefined,
    history: IHistory,
    {match, query, group}: RouteMatchSharedOptions,
  ) {
    this.$name = name;
    this.$group = group as TSpecificGroupName;
    this.$parent = parent;
    this.$router = router;
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

  /**
   * A reactive value indicates whether this route is exactly matched.
   */
  get $exact(): boolean {
    let entry = this._matchEntry;
    return !!entry && entry.exact;
  }

  /**
   * A reactive value indicates whether this route is matched.
   */
  get $matched(): boolean {
    return !!this._matchEntry;
  }

  /**
   * Get the deepest matching descendant.
   */
  get $rest(): this {
    if (!this.$matched || this.$exact) {
      return this;
    }

    let children = this._children;

    let matchingChild = children && children.find(match => match.$matched);

    return matchingChild ? matchingChild.$rest : this;
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

    if (typeof matchPattern === 'string') {
      return {
        ...upperSegmentDict,
      };
    }

    return {
      ...upperSegmentDict,
      [this.$name]: segment,
    };
  }

  /** @internal */
  @computed
  get _pathSegments(): GeneralSegmentDict {
    let parent = this.$parent;
    let upperSegmentDict = parent && parent._pathSegments;

    let matchPattern = this._matchPattern;
    let segment = this._segment;

    if (
      typeof matchPattern === 'symbol' &&
      matchPattern === ROUTE_MATCH_START_ANCHOR_PATTERN
    ) {
      return {
        ...upperSegmentDict,
      };
    }

    return {
      ...upperSegmentDict,
      [this.$name]: typeof matchPattern === 'string' ? matchPattern : segment,
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

  $ref(params?: Partial<TParamDict> & EmptyObjectPatch): string {
    return new RouteBuilder(new Map(), this._source.queryDict, this.$router, [
      {match: this, params},
    ]).$ref();
  }

  $push(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    {onComplete, ...options}: RouteMatchNavigateOptions<TGroupName> = {},
  ): void {
    this._build(params, options).$push({onComplete});
  }

  $replace(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    {onComplete, ...options}: RouteMatchNavigateOptions<TGroupName> = {},
  ): void {
    this._build(params, options).$replace({onComplete});
  }

  /** @internal */
  abstract _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined;

  /** @internal */
  protected abstract _getBuilder(): RouteBuilder;

  /** @internal */
  private _build(
    params: Partial<TParamDict> & EmptyObjectPatch = {},
    {leave = false, leaves = []}: RouteMatchBuildOptions<TGroupName> = {},
  ): RouteBuilder {
    if (typeof leaves === 'string') {
      leaves = [leaves];
    }

    if (leave) {
      let group = this.$group;

      if (group === undefined) {
        throw new Error('Cannot leave primary route');
      }

      leaves.push((group as string) as TGroupName);
    }

    return this._getBuilder()
      .$(this, params as object)
      .$leave(leaves);
  }
}
