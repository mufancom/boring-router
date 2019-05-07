import {observable} from 'mobx';
import {OmitValueOfKey, OmitValueWithType} from 'tslang';

import {testPathPrefix, tolerate} from '../@utils';
import {IHistory} from '../history';
import {Router} from '../router';

import {NextRouteMatch} from './next-route-match';
import {
  GeneralParamDict,
  GeneralQueryDict,
  GeneralSegmentDict,
  RouteMatchShared,
  RouteMatchSharedOptions,
} from './route-match-shared';

/**
 * Route before enter callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeEnter<TRouteMatch extends RouteMatch = RouteMatch> = (
  next: TRouteMatch['$next'],
) => Promise<boolean | void> | boolean | void;

/**
 * Route before update callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeUpdate<TRouteMatch extends RouteMatch = RouteMatch> = (
  next: TRouteMatch['$next'],
) => Promise<boolean | void> | boolean | void;

/**
 * Route before leave callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change.
 */
export type RouteBeforeLeave = () => Promise<boolean | void> | boolean | void;

export type RouteAfterEnter = () => void;
export type RouteAfterUpdate = () => void;
export type RouteAfterLeave = () => void;

export type RouteInterceptCallback<
  TRouteMatch extends RouteMatch = RouteMatch
> = (next: TRouteMatch['$next']) => Promise<boolean | void> | boolean | void;

export type RouteReactCallback = () => void;

export type RouteServiceFactory<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => IRouteService<TRouteMatch> | Promise<IRouteService<TRouteMatch>>;

export type IRouteService<TRouteMatch extends RouteMatch = RouteMatch> = {
  beforeEnter?: RouteBeforeEnter<TRouteMatch>;
  afterEnter?: RouteAfterEnter;
  beforeUpdate?: RouteBeforeUpdate<TRouteMatch>;
  afterUpdate?: RouteAfterUpdate;
  beforeLeave?: RouteBeforeLeave;
  afterLeave?: RouteAfterLeave;
} & RouteServiceExtension<TRouteMatch>;

export type RouteServiceExtension<
  TRouteMatch extends RouteMatch
> = OmitValueWithType<
  OmitValueOfKey<TRouteMatch, keyof RouteMatch>,
  RouteMatch
>;

interface RouteMatchInternalResult {
  matched: boolean;
  exactlyMatched: boolean;
  segment: string | undefined;
  rest: string;
}

export interface RouteMatchParallelOptions<TGroupName extends string> {
  groups?: TGroupName[];
  matches?: RouteMatch[];
}

/** @internal */
export interface RouteMatchUpdateResult {
  pathSegmentDict: GeneralSegmentDict;
  paramSegmentDict: GeneralSegmentDict;
}

export interface RouteMatchEntry {
  match: RouteMatch;
  exact: boolean;
  segment: string;
  rest: string;
}

export interface RouteSource {
  groupToMatchToMatchEntryMapMap: Map<
    string | undefined,
    Map<RouteMatch, RouteMatchEntry>
  >;
  queryDict: GeneralQueryDict;
  pathMap: Map<string | undefined, string>;
}

export interface RouteMatchOptions extends RouteMatchSharedOptions {
  exact: boolean;
}

export class RouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TNextRouteMatch extends NextRouteMatch<TParamDict> = NextRouteMatch<
    TParamDict
  >,
  TGroupName extends string = string
> extends RouteMatchShared<TParamDict, TGroupName> {
  readonly $parent: RouteMatch | undefined;

  readonly $next!: TNextRouteMatch;

  /** @internal */
  private _beforeEnterCallbacks: RouteBeforeEnter[] = [];

  /** @internal */
  private _beforeUpdateCallbacks: RouteBeforeUpdate[] = [];

  /** @internal */
  private _beforeLeaveCallbacks: RouteBeforeLeave[] = [];

  /** @internal */
  private _afterEnterCallbacks: RouteAfterEnter[] = [];

  /** @internal */
  private _afterUpdateCallbacks: RouteAfterUpdate[] = [];

  /** @internal */
  private _afterLeaveCallbacks: RouteAfterLeave[] = [];

  /** @internal */
  @observable
  private _service: IRouteService | undefined;

  /** @internal */
  private _servicePromise: Promise<IRouteService | undefined> | undefined;

  /** @internal */
  private _serviceFactory: RouteServiceFactory<any> | undefined;

  /** @internal */
  private _allowExact: boolean;

  /** @internal */
  _children: RouteMatch[] | undefined;

  /** @internal */
  _parallel: RouteMatchParallelOptions<TGroupName> | undefined;

  constructor(
    name: string,
    prefix: string,
    router: Router,
    source: RouteSource,
    parent: RouteMatch | undefined,
    extension: object,
    history: IHistory,
    {exact, ...sharedOptions}: RouteMatchOptions,
  ) {
    super(name, prefix, router, source, parent, history, sharedOptions);

    for (let [key, defaultValue] of Object.entries(extension)) {
      Object.defineProperty(this, key, {
        get() {
          let service = (this as RouteMatch).$matched
            ? (this as RouteMatch)._service
            : undefined;
          return service ? (service as any)[key] : defaultValue;
        },
      });
    }

    this._allowExact = exact;
  }

  /**
   * A reactive value indicates whether this route is matched.
   */
  get $matched(): boolean {
    return !!this._matchEntry;
  }

  /**
   * A reactive value indicates whether this route is exactly matched.
   */
  get $exact(): boolean {
    let entry = this._matchEntry;
    return !!entry && entry.exact;
  }

  $beforeEnter(callback: RouteBeforeEnter<this>): this {
    this._beforeEnterCallbacks.push(callback as RouteBeforeEnter);
    return this;
  }

  $beforeUpdate(callback: RouteBeforeUpdate<this>): this {
    this._beforeUpdateCallbacks.push(callback as RouteBeforeUpdate);
    return this;
  }

  $beforeLeave(callback: RouteBeforeLeave): this {
    this._beforeLeaveCallbacks.push(callback);
    return this;
  }

  $afterEnter(callback: RouteAfterEnter): this {
    this._afterEnterCallbacks.push(callback);
    return this;
  }

  $afterUpdate(callback: RouteAfterUpdate): this {
    this._afterUpdateCallbacks.push(callback);
    return this;
  }

  $afterLeave(callback: RouteAfterLeave): this {
    this._afterLeaveCallbacks.push(callback);
    return this;
  }

  $intercept(callback: RouteInterceptCallback): this {
    this._beforeEnterCallbacks.push(callback);
    this._beforeUpdateCallbacks.push(callback);

    return this;
  }

  $react(callback: RouteReactCallback): this {
    this._afterEnterCallbacks.push(callback);
    this._afterUpdateCallbacks.push(callback);

    return this;
  }

  $service(factory: RouteServiceFactory<this>): this {
    if (this._serviceFactory) {
      throw new Error(`Service has already been defined for "${this.$name}"`);
    }

    this._serviceFactory = factory;

    return this;
  }

  $parallel(options: RouteMatchParallelOptions<TGroupName>): void {
    if (this.$group) {
      throw new Error('Parallel whitelist can only be set on primary routes');
    }

    let {groups = [], matches = []} = options;

    let parent = this.$parent;

    if (parent instanceof RouteMatch && parent._parallel) {
      let {
        groups: parentGroups = [],
        matches: parentMatches = [],
      } = parent._parallel;

      let parentGroupSet = new Set(parentGroups);
      let parentMatchSet = new Set(parentMatches);

      let groupsBeingSubsetOfParents = groups.every(group =>
        parentGroupSet.has(group),
      );

      if (!groupsBeingSubsetOfParents) {
        throw new Error(
          "Parallel group can only be a subset of its parent's groups",
        );
      }

      let matchesBeingSubsetOfParents = matches.every(match => {
        if (
          typeof match.$group === 'string' &&
          parentGroupSet.has(match.$group)
        ) {
          return true;
        }

        let current: RouteMatch | undefined = match;

        while (current) {
          if (parentMatchSet.has(current)) {
            return true;
          }

          current = current.$parent;
        }

        return false;
      });

      if (!matchesBeingSubsetOfParents) {
        throw new Error(
          "Parallel match can only be a subset of its parent's matches",
        );
      }
    }

    this._parallel = options;

    let children = this._children || [];

    for (let child of children) {
      if (
        child._parallel &&
        (!parent || parent._parallel !== child._parallel)
      ) {
        throw new Error(
          'Parallel options can only be specified in a top-down fashion',
        );
      }

      child.$parallel(options);
    }
  }

  /** @internal */
  _match(upperRest: string): RouteMatchInternalResult {
    let segment: string | undefined;
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
        if (testPathPrefix(upperRest, pattern)) {
          segment = pattern;
          rest = upperRest.slice(pattern.length);
        } else {
          segment = undefined;
          rest = '';
        }
      } else {
        let groups = pattern.exec(upperRest);

        if (groups) {
          let matched = groups[0];

          if (testPathPrefix(upperRest, matched)) {
            segment = matched;
            rest = upperRest.slice(matched.length);
          } else {
            segment = undefined;
            rest = '';
          }
        } else {
          segment = undefined;
          rest = '';
        }
      }
    } else {
      segment = undefined;
      rest = '';
    }

    let matched = segment !== undefined;
    let exactlyMatched = matched && rest === '';

    if (exactlyMatched && (this._children && !this._allowExact)) {
      matched = false;
      exactlyMatched = false;
    }

    return {
      matched,
      exactlyMatched,
      segment,
      rest,
    };
  }

  /** @internal */
  async _beforeLeave(): Promise<boolean> {
    let results = await Promise.all([
      ...this._beforeLeaveCallbacks.map(callback => tolerate(callback)),
      (async () => {
        let service = await this._getService();

        if (!service || !service.beforeLeave) {
          return undefined;
        }

        return tolerate(() => service!.beforeLeave!());
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeEnter(): Promise<boolean> {
    let next = this.$next;

    let results = await Promise.all([
      ...this._beforeEnterCallbacks.map(callback => tolerate(callback, next)),
      (async () => {
        let service = await this._getService();

        if (!service || !service.beforeEnter) {
          return undefined;
        }

        return tolerate(() => service!.beforeEnter!(next));
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeUpdate(): Promise<boolean> {
    let next = this.$next;

    let results = await Promise.all([
      ...this._beforeUpdateCallbacks.map(callback => tolerate(callback, next)),
      (async () => {
        let service = await this._getService();

        if (!service || !service.beforeUpdate) {
          return undefined;
        }

        return tolerate(() => service!.beforeUpdate!(next));
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _afterLeave(): Promise<void> {
    for (let callback of this._afterLeaveCallbacks) {
      tolerate(callback);
    }

    let service = await this._getService();

    if (!service || !service.afterLeave) {
      return;
    }

    tolerate(() => service!.afterLeave!());
  }

  /** @internal */
  async _afterEnter(): Promise<void> {
    for (let callback of this._afterEnterCallbacks) {
      tolerate(callback);
    }

    let service = await this._getService();

    if (!service || !service.afterEnter) {
      return;
    }

    tolerate(() => service!.afterEnter!());
  }

  /** @internal */
  async _afterUpdate(): Promise<void> {
    for (let callback of this._afterUpdateCallbacks) {
      tolerate(callback);
    }

    let service = await this._getService();

    if (!service || !service.afterUpdate) {
      return;
    }

    tolerate(() => service!.afterUpdate!());
  }

  /** @internal */
  _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined {
    let matchToMatchEntryMap = source.groupToMatchToMatchEntryMapMap.get(
      this.$group,
    );

    return matchToMatchEntryMap && matchToMatchEntryMap.get(this);
  }

  /** @internal */
  private async _getService(): Promise<IRouteService | undefined> {
    let serviceOrServicePromise = this._service || this._servicePromise;

    if (serviceOrServicePromise) {
      return serviceOrServicePromise;
    }

    let factory = this._serviceFactory;

    if (!factory) {
      return undefined;
    }

    let output = tolerate(factory, this);

    if (output instanceof Promise) {
      return (this._servicePromise = output.then(service => {
        this._service = service;
        return service;
      }));
    } else {
      this._service = output;
      return output;
    }
  }

  static segment = /[^/]+/;
  static rest = /.+/;
}
