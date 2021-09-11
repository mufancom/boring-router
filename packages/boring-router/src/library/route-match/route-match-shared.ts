import {computed} from 'mobx';
import {Dict, EmptyObjectPatch} from 'tslang';

import {isQueryIdsMatched} from '../@utils';
import {IHistory} from '../history';
import {RouteBuilder} from '../route-builder';
import {Router, RouterNavigateOptions} from '../router';

import {RouteMatchEntry, RouteSource} from './route-match';

export type GeneralSegmentDict = Dict<string | undefined>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

export type RouteMatchSharedToParamDict<TRouteMatchShared> =
  TRouteMatchShared extends RouteMatchShared<infer TParamDict>
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
  match: string | RegExp;
  query: Map<string, string | symbol | true>;
  group: string | undefined;
}

export abstract class RouteMatchShared<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TSpecificGroupName extends string | undefined = string | undefined,
  TGroupName extends string = string,
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

  readonly $router: Router<TGroupName>;

  /** @internal */
  readonly _source: RouteSource;

  /** @internal */
  readonly _queryKeyToIdMap: Map<string, string | symbol | true>;

  /** @internal */
  _children: this[] | undefined;

  /** @internal */
  protected _history: IHistory;

  /** @internal */
  protected _matchPattern: string | RegExp;

  constructor(
    name: string,
    router: Router<TGroupName>,
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

    this._queryKeyToIdMap = new Map([
      ...(parent?._queryKeyToIdMap ?? []),
      ...query,
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
  @computed
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

    if (!(matchPattern instanceof RegExp)) {
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

    let name = this.$name;

    let matchPattern = this._matchPattern;
    let segment = this._segment;

    return {
      ...upperSegmentDict,
      ...(name
        ? {[name]: typeof matchPattern === 'string' ? matchPattern : segment}
        : undefined),
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
    let sourceQueryMap = this._source.queryMap;

    return Array.from(this._queryKeyToIdMap).reduce((dict, [key, id]) => {
      let sourceQuery = sourceQueryMap.get(key);

      if (!sourceQuery || !isQueryIdsMatched(sourceQuery.id, id)) {
        return dict;
      }

      dict[key] = sourceQuery.value;

      return dict;
    }, {} as GeneralQueryDict);
  }

  $(params?: Partial<TParamDict> & EmptyObjectPatch): RouteBuilder<TGroupName> {
    return new RouteBuilder<TGroupName>(this.$router, 'none', [
      {route: this, params},
    ]);
  }

  $ref(params?: Partial<TParamDict> & EmptyObjectPatch): string {
    return this.$(params).$ref();
  }

  $href(params?: Partial<TParamDict> & EmptyObjectPatch): string {
    return this.$(params).$href();
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

      // eslint-disable-next-line @mufan/no-unnecessary-type-assertion
      leaves.push(group as string as TGroupName);
    }

    return this._getBuilder()
      .$(this, params as object)
      .$leave(leaves);
  }
}
