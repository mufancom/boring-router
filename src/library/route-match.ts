import {History} from 'history';
import {computed, observable} from 'mobx';
import {Dict, EmptyObjectPatch, OmitValueOfKey} from 'tslang';

import {isPathPrefix} from './@utils';
import {RouteMatchEntry, RouteSource} from './router';

/**
 * Route match before enter callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteMatchBeforeEnter<
  TRouteMatch extends RouteMatch = RouteMatch
> = (
  next: OmitValueOfKey<
    TRouteMatch,
    Exclude<keyof RouteMatch, keyof MatchingRouteMatch>
  >,
) => Promise<string | boolean | void> | string | boolean | void;

/**
 * Route match before leave callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change.
 */
export type RouteMatchBeforeLeave = () =>
  | Promise<boolean | void>
  | boolean
  | void;

export type RouteMatchAfterEnter = () => Promise<void> | void;
export type RouteMatchAfterLeave = () => Promise<void> | void;

export type RouteMatchServiceFactory<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => IRouteService<TRouteMatch> | Promise<IRouteService<TRouteMatch>>;

export interface IRouteService<TRouteMatch extends RouteMatch = RouteMatch> {
  beforeEnter?: RouteMatchBeforeEnter<TRouteMatch>;
  afterEnter?: RouteMatchAfterEnter;
  beforeLeave?: RouteMatchBeforeLeave;
  afterLeave?: RouteMatchAfterLeave;
}

interface RouteMatchInternalResult {
  matched: boolean;
  exactlyMatched: boolean;
  fragment: string | undefined;
  rest: string;
}

export type GeneralFragmentDict = Dict<string | undefined>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

/** @internal */
export interface RouteMatchUpdateResult {
  pathFragmentDict: GeneralFragmentDict;
  paramFragmentDict: GeneralFragmentDict;
}

export interface RouteMatchSharedOptions {
  match: string | RegExp;
  query: Dict<boolean> | undefined;
}

export interface RouteMatchOptions extends RouteMatchSharedOptions {
  exact: boolean;
}

abstract class RouteMatchShared<
  TParamDict extends GeneralParamDict = GeneralParamDict
> {
  /**
   * Name of this `RouteMatch`, correspondent to the field name of route
   * schema.
   */
  readonly $name: string;

  /** @internal */
  protected _history: History;

  /** @internal */
  protected _source: RouteSource;

  /** @internal */
  protected _parent: RouteMatchShared | undefined;

  /** @internal */
  protected _matchPattern: string | RegExp;

  /** @internal */
  protected _queryKeys: string[] | undefined;

  constructor(
    name: string,
    source: RouteSource,
    parent: RouteMatchShared | undefined,
    history: History,
    {match, query}: RouteMatchSharedOptions,
  ) {
    this.$name = name;
    this._source = source;
    this._parent = parent;
    this._history = history;

    if (match instanceof RegExp && match.global) {
      throw new Error(
        'Expecting a non-global regular expression as match pattern',
      );
    }

    this._matchPattern = match;

    if (query) {
      this._queryKeys = Object.keys(query);
    }
  }

  /**
   * A dictionary of the combination of query string and fragments.
   */
  @computed
  get $params(): TParamDict {
    return {
      ...this._paramFragments,
      ...this._query,
    } as TParamDict;
  }

  /** @internal */
  @computed
  protected get _fragment(): string | undefined {
    let entry = this._getMatchEntry(this._source);
    return entry && entry.fragment;
  }

  /** @internal */
  @computed
  protected get _paramFragments(): GeneralFragmentDict {
    let parent = this._parent;
    let upperFragmentDict = parent && parent._paramFragments;

    let matchPattern = this._matchPattern;
    let fragment = this._fragment;

    return {
      ...upperFragmentDict,
      ...(typeof matchPattern === 'string'
        ? undefined
        : {[this.$name]: fragment}),
    };
  }

  /** @internal */
  @computed
  protected get _pathFragments(): GeneralFragmentDict {
    let parent = this._parent;
    let upperFragmentDict = parent && parent._pathFragments;

    let matchPattern = this._matchPattern;
    let fragment = this._fragment;

    return {
      ...upperFragmentDict,
      ...{
        [this.$name]:
          typeof matchPattern === 'string' ? matchPattern : fragment,
      },
    };
  }

  /** @internal */
  @computed
  protected get _query(): GeneralQueryDict | undefined {
    let queryKeys = this._queryKeys;
    let sourceQueryDict = this._source.queryDict;

    return queryKeys
      ? queryKeys.reduce(
          (dict, key) => {
            let value = sourceQueryDict[key];

            if (value !== undefined) {
              dict[key] = sourceQueryDict[key];
            }

            return dict;
          },
          {} as GeneralQueryDict,
        )
      : undefined;
  }

  /**
   * Generates a string reference that can be used for history navigation.
   * @param params A dictionary of the combination of query string and
   * fragments.
   * @param preserveQuery Whether to preserve values in current query string.
   */
  $ref(
    params: Partial<TParamDict> & EmptyObjectPatch = {},
    preserveQuery = false,
  ): string {
    let fragmentDict = this._pathFragments;
    let sourceQueryDict = this._source.queryDict;

    let paramKeySet = new Set(Object.keys(params));

    let path = Object.keys(fragmentDict)
      .map(key => {
        paramKeySet.delete(key);

        let param = params[key];
        let fragment = typeof param === 'string' ? param : fragmentDict[key];

        if (typeof fragment !== 'string') {
          throw new Error(`Parameter "${key}" is required`);
        }

        return `/${fragment}`;
      })
      .join('');

    let query = new URLSearchParams([
      ...(preserveQuery
        ? (Object.entries(sourceQueryDict) as [string, string][])
        : []),
      ...Array.from(paramKeySet).map(
        (key): [string, string] => [key, params[key]!],
      ),
    ]).toString();

    return `${path}${query ? `?${query}` : ''}`;
  }

  /**
   * Perform a `history.push()` with `this.$ref(params, preserveQuery)`.
   */
  $push(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    preserveQuery?: boolean,
  ): void {
    let ref = this.$ref(params, preserveQuery);
    this._history.push(ref);
  }

  /**
   * Perform a `history.replace()` with `this.$ref(params, preserveQuery)`.
   */
  $replace(
    params?: Partial<TParamDict> & EmptyObjectPatch,
    preserveQuery?: boolean,
  ): void {
    let ref = this.$ref(params, preserveQuery);
    this._history.replace(ref);
  }

  /** @internal */
  abstract _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined;
}

export class MatchingRouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict
> extends RouteMatchShared<TParamDict> {
  /** @internal */
  private _origin: RouteMatch<TParamDict>;

  constructor(
    name: string,
    source: RouteSource,
    parent: RouteMatchShared<TParamDict> | undefined,
    origin: RouteMatch<TParamDict>,
    history: History,
    options: RouteMatchSharedOptions,
  ) {
    super(name, source, parent, history, options);

    this._origin = origin;
  }

  /**
   * A reactive value indicates whether this route is exactly matched.
   */
  get $exact(): boolean {
    let entry = this._getMatchEntry();
    return !!entry && entry.exact;
  }

  /** @internal */
  _getMatchEntry(): RouteMatchEntry | undefined {
    return this._origin._getMatchEntry(this._source);
  }
}

export class RouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict
> extends RouteMatchShared<TParamDict> {
  /** @internal */
  private _beforeEnterCallbacks: RouteMatchBeforeEnter[] = [];

  /** @internal */
  private _beforeLeaveCallbacks: RouteMatchBeforeLeave[] = [];

  /** @internal */
  private _afterEnterCallbacks: RouteMatchAfterEnter[] = [];

  /** @internal */
  private _afterLeaveCallbacks: RouteMatchAfterLeave[] = [];

  /** @internal */
  private _serviceInstanceOrPromise:
    | IRouteService
    | Promise<IRouteService>
    | undefined;

  /** @internal */
  private _serviceFactory: RouteMatchServiceFactory<any> | undefined;

  /** @internal */
  @observable
  private _matched = false;

  /** @internal */
  @observable
  private _exactlyMatched = false;

  /** @internal */
  private _allowExact: boolean;

  /** @internal */
  _children: RouteMatch[] | undefined;

  /** @internal */
  _matching!: MatchingRouteMatch<TParamDict>;

  constructor(
    name: string,
    source: RouteSource,
    parent: RouteMatch | undefined,
    history: History,
    {exact, ...sharedOptions}: RouteMatchOptions,
  ) {
    super(name, source, parent, history, sharedOptions);

    this._allowExact = exact;
  }

  /**
   * A reactive value indicates whether this route is matched.
   */
  get $matched(): boolean {
    return this._matched;
  }

  /**
   * A reactive value indicates whether this route is exactly matched.
   */
  get $exact(): boolean {
    return this._exactlyMatched;
  }

  $beforeEnter(callback: RouteMatchBeforeEnter<this>): this {
    this._beforeEnterCallbacks.push(callback as RouteMatchBeforeEnter);
    return this;
  }

  $beforeLeave(callback: RouteMatchBeforeLeave): this {
    this._beforeLeaveCallbacks.push(callback);
    return this;
  }

  $afterEnter(callback: RouteMatchAfterEnter): this {
    this._afterEnterCallbacks.push(callback);
    return this;
  }

  $afterLeave(callback: RouteMatchAfterLeave): this {
    this._afterLeaveCallbacks.push(callback);
    return this;
  }

  $service(factory: RouteMatchServiceFactory<this>): this {
    if (this._serviceFactory) {
      throw new Error(`Service has already been defined for "${this.$name}"`);
    }

    this._serviceFactory = factory;

    return this;
  }

  /** @internal */
  _match(upperRest: string): RouteMatchInternalResult {
    let fragment: string | undefined;
    let rest: string;

    if (upperRest) {
      if (!upperRest.startsWith('/')) {
        throw new Error(
          `Expecting rest of path to be started with "/", but got ${JSON.stringify(
            upperRest,
          )} instead`,
        );
      }

      upperRest = upperRest.slice(1);

      let pattern = this._matchPattern;

      if (typeof pattern === 'string') {
        if (isPathPrefix(upperRest, pattern)) {
          fragment = pattern;
          rest = upperRest.slice(pattern.length);
        } else {
          fragment = undefined;
          rest = '';
        }
      } else {
        let groups = pattern.exec(upperRest);

        if (groups) {
          let matched = groups[0];

          if (!isPathPrefix(upperRest, matched)) {
            throw new Error(
              `Invalid regular expression pattern, expecting rest of path to be started with "/" after match (matched ${JSON.stringify(
                matched,
              )} out of ${JSON.stringify(upperRest)})`,
            );
          }

          fragment = matched;
          rest = upperRest.slice(matched.length);
        } else {
          fragment = undefined;
          rest = '';
        }
      }
    } else {
      fragment = undefined;
      rest = '';
    }

    let matched = fragment !== undefined;
    let exactlyMatched = matched && rest === '';

    if (exactlyMatched && (this._children && !this._allowExact)) {
      matched = false;
      exactlyMatched = false;
    }

    return {
      matched,
      exactlyMatched,
      fragment,
      rest,
    };
  }

  /** @internal */
  async _beforeLeave(): Promise<boolean> {
    for (let callback of this._beforeLeaveCallbacks) {
      let result = callback();

      if (result === false) {
        return false;
      }
    }

    let service = await this._getService();

    if (!service || !service.beforeLeave) {
      return true;
    }

    let result = service.beforeLeave();

    if (result === false) {
      return false;
    }

    return true;
  }

  /** @internal */
  async _beforeEnter(): Promise<string | boolean> {
    let next = this._matching;

    for (let callback of this._beforeEnterCallbacks) {
      let result = await callback(next);

      if (typeof result === 'string' || result === false) {
        return result;
      }
    }

    let service = await this._getService();

    if (!service || !service.beforeEnter) {
      return true;
    }

    let result = await service.beforeEnter(next);

    if (typeof result === 'string' || result === false) {
      return result;
    }

    return true;
  }

  /** @internal */
  async _afterLeave(): Promise<void> {
    for (let callback of this._afterLeaveCallbacks) {
      await callback();
    }

    let service = await this._getService();

    if (!service) {
      return;
    }

    if (service.afterLeave) {
      await service.afterLeave();
    }
  }

  /** @internal */
  async _afterEnter(): Promise<void> {
    for (let callback of this._afterEnterCallbacks) {
      await callback();
    }

    let service = await this._getService();

    if (!service) {
      return;
    }

    if (service.afterEnter) {
      await service.afterEnter();
    }
  }

  /** @internal */
  _update(matched: boolean, exactlyMatched: boolean): void {
    this._matched = matched;
    this._exactlyMatched = exactlyMatched;
  }

  /** @internal */
  _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined {
    return source.matchToMatchEntryMap.get(this);
  }

  /** @internal */
  private async _getService(): Promise<IRouteService | undefined> {
    let instanceOrPromise = this._serviceInstanceOrPromise;

    if (instanceOrPromise) {
      return instanceOrPromise;
    }

    let factory = this._serviceFactory;

    if (!factory) {
      return undefined;
    }

    let result = (this._serviceInstanceOrPromise = factory(this));

    if (result instanceof Promise) {
      result
        .then(service => {
          this._serviceInstanceOrPromise = service;
        })
        .catch(console.error);
    }

    return result;
  }

  static fragment = /[^/]+/;
  static rest = /.+/;
}
