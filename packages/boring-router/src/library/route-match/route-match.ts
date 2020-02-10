import {
  IAutorunOptions,
  IReactionDisposer,
  IReactionPublic,
  autorun,
  observable,
} from 'mobx';
import {OmitValueOfKey, OmitValueWithType} from 'tslang';

import {testPathPrefix, tolerate} from '../@utils';
import {IHistory} from '../history';
import {RouteBuilder} from '../route-builder';
import {Router} from '../router';

import {NextRouteMatch} from './next-route-match';
import {
  GeneralParamDict,
  GeneralQueryDict,
  GeneralSegmentDict,
  ROUTE_MATCH_START_ANCHOR_PATTERN,
  RouteMatchShared,
  RouteMatchSharedOptions,
} from './route-match-shared';

//////////////////////
// life-cycle hooks //
//////////////////////

// before enter //

/**
 * Route before enter callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeEnterCallback<
  TRouteMatch extends RouteMatch = RouteMatch
> = (next: TRouteMatch['$next']) => Promise<boolean | void> | boolean | void;

// before update //

export interface RouteBeforeUpdateCallbackData {
  descendants: boolean;
}

/**
 * Route before update callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch
> = (
  next: TRouteMatch['$next'],
  data: RouteBeforeUpdateCallbackData,
) => Promise<boolean | void> | boolean | void;

export interface RouteBeforeUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteBeforeUpdateEntry<
  TRouteMatch extends RouteMatch = RouteMatch
> {
  callback: RouteBeforeUpdateCallback<TRouteMatch>;
  options?: RouteBeforeUpdateOptions;
}

// before leave //

/**
 * Route before leave callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change.
 */
export type RouteBeforeLeaveCallback = () =>
  | Promise<boolean | void>
  | boolean
  | void;

// after enter //

export type RouteAfterEnterCallback = () => void;

// after update //

export interface RouteAfterUpdateCallbackData {
  descendants: boolean;
}

/**
 * Route after update callback.
 */
export type RouteAfterUpdateCallback = (
  data: RouteAfterUpdateCallbackData,
) => void;

export interface RouteAfterUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteAfterUpdateEntry {
  options?: RouteAfterUpdateOptions;
  callback: RouteAfterUpdateCallback;
}

// after leave //

export type RouteAfterLeaveCallback = () => void;

// autorun //

export type RouteAutorunView = (reaction: IReactionPublic) => void;

export type RouteAutorunOptions = IAutorunOptions;

export type RouteAutorunDisposer = IReactionDisposer;

export interface RouteAutorunEntry {
  view: RouteAutorunView;
  options: RouteAutorunOptions | undefined;
}

export type RouteHookRemovalCallback = () => void;

export type RouteInterceptCallback<
  TRouteMatch extends RouteMatch = RouteMatch
> = (next: TRouteMatch['$next']) => Promise<boolean | void> | boolean | void;

export interface RouteInterceptOptions {
  traceDescendants: boolean;
}

export type RouteReactCallback = () => void;

export type RouteServiceFactory<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => IRouteService<TRouteMatch> | Promise<IRouteService<TRouteMatch>>;

export type IRouteService<TRouteMatch extends RouteMatch = RouteMatch> = {
  beforeEnter?: RouteBeforeEnterCallback<TRouteMatch>;
  afterEnter?: RouteAfterEnterCallback;
  beforeUpdate?: RouteBeforeUpdateCallback<TRouteMatch>;
  afterUpdate?: RouteAfterUpdateCallback;
  beforeLeave?: RouteBeforeLeaveCallback;
  afterLeave?: RouteAfterLeaveCallback;
} & RouteServiceExtension<TRouteMatch>;

export type RouteServiceExtension<
  TRouteMatch extends RouteMatch
> = OmitValueWithType<
  OmitValueOfKey<TRouteMatch, keyof RouteMatch>,
  RouteMatch,
  false
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
  exact: boolean | string;
}

export class RouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TNextRouteMatch extends NextRouteMatch<TParamDict> = NextRouteMatch<
    TParamDict
  >,
  TSpecificGroupName extends string | undefined = string | undefined,
  TGroupName extends string = string
> extends RouteMatchShared<TParamDict, TSpecificGroupName, TGroupName> {
  readonly $parent: RouteMatch | undefined;

  readonly $next!: TNextRouteMatch;

  /** @internal */
  private _beforeEnterCallbackSet = new Set<RouteBeforeEnterCallback>();

  /** @internal */
  private _beforeUpdateEntrySet = new Set<RouteBeforeUpdateEntry>();

  /** @internal */
  private _beforeLeaveCallbackSet = new Set<RouteBeforeLeaveCallback>();

  /** @internal */
  private _afterEnterCallbackSet = new Set<RouteAfterEnterCallback>();

  /** @internal */
  private _afterUpdateEntrySet = new Set<RouteAfterUpdateEntry>();

  /** @internal */
  private _afterLeaveCallbackSet = new Set<RouteAfterLeaveCallback>();

  /** @internal */
  private _autorunEntrySet = new Set<RouteAutorunEntry>();

  /** @internal */
  private _autorunDisposers: RouteAutorunDisposer[] = [];

  /** @internal */
  @observable
  private _service: IRouteService | undefined;

  /** @internal */
  private _servicePromise: Promise<IRouteService | undefined> | undefined;

  /** @internal */
  private _serviceFactory: RouteServiceFactory<any> | undefined;

  /** @internal */
  private _allowExact: boolean | string;

  /** @internal */
  _parallel: RouteMatchParallelOptions<TGroupName> | undefined;

  constructor(
    name: string,
    router: Router<TGroupName>,
    source: RouteSource,
    parent: RouteMatch | undefined,
    extension: object | undefined,
    history: IHistory,
    {exact, ...sharedOptions}: RouteMatchOptions,
  ) {
    super(name, router, source, parent, history, sharedOptions);

    if (extension) {
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
    }

    this._allowExact = exact;
  }

  $beforeEnter(
    callback: RouteBeforeEnterCallback<this>,
  ): RouteHookRemovalCallback {
    this._beforeEnterCallbackSet.add(callback);

    return () => {
      this._beforeEnterCallbackSet.delete(callback);
    };
  }

  $beforeUpdate(
    callback: RouteBeforeUpdateCallback<this>,
    options?: RouteBeforeUpdateOptions,
  ): RouteHookRemovalCallback {
    let entry: RouteBeforeUpdateEntry<this> = {
      callback,
      options,
    };

    this._beforeUpdateEntrySet.add(entry);

    return () => {
      this._beforeUpdateEntrySet.delete(entry);
    };
  }

  $beforeLeave(callback: RouteBeforeLeaveCallback): RouteHookRemovalCallback {
    this._beforeLeaveCallbackSet.add(callback);

    return () => {
      this._beforeLeaveCallbackSet.delete(callback);
    };
  }

  $afterEnter(callback: RouteAfterEnterCallback): RouteHookRemovalCallback {
    this._afterEnterCallbackSet.add(callback);

    return () => {
      this._afterEnterCallbackSet.delete(callback);
    };
  }

  $afterUpdate(
    callback: RouteAfterUpdateCallback,
    options?: RouteAfterUpdateOptions,
  ): RouteHookRemovalCallback {
    let afterUpdateEntry: RouteAfterUpdateEntry = {
      callback,
      options,
    };

    this._afterUpdateEntrySet.add(afterUpdateEntry);

    return () => {
      this._afterUpdateEntrySet.delete(afterUpdateEntry);
    };
  }

  $afterLeave(callback: RouteAfterLeaveCallback): RouteHookRemovalCallback {
    this._afterLeaveCallbackSet.add(callback);

    return () => {
      this._afterLeaveCallbackSet.delete(callback);
    };
  }

  $autorun(
    view: RouteAutorunView,
    options?: RouteAutorunOptions,
  ): RouteHookRemovalCallback {
    let autorunEntry: RouteAutorunEntry = {view, options};

    this._autorunEntrySet.add(autorunEntry);

    if (this.$matched) {
      tolerate(() => {
        this._autorunDisposers.push(autorun(view, options));
      });
    }

    return () => {
      this._autorunEntrySet.delete(autorunEntry);
    };
  }

  $intercept(
    callback: RouteInterceptCallback<this>,
    options?: RouteInterceptOptions,
  ): RouteHookRemovalCallback {
    let beforeUpdateEntry: RouteBeforeUpdateEntry<this> = {
      callback,
      options,
    };

    this._beforeEnterCallbackSet.add(callback);
    this._beforeUpdateEntrySet.add(beforeUpdateEntry);

    return () => {
      this._beforeEnterCallbackSet.delete(callback);
      this._beforeUpdateEntrySet.delete(beforeUpdateEntry);
    };
  }

  $react(
    callback: RouteReactCallback,
    afterUpdateOptions?: RouteAfterUpdateOptions,
  ): RouteHookRemovalCallback {
    let afterUpdateEntry: RouteAfterUpdateEntry = {
      callback,
      options: afterUpdateOptions,
    };

    this._afterEnterCallbackSet.add(callback);
    this._afterUpdateEntrySet.add(afterUpdateEntry);

    return () => {
      this._afterEnterCallbackSet.delete(callback);
      this._afterUpdateEntrySet.delete(afterUpdateEntry);
    };
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
    let pattern = this._matchPattern;

    if (typeof pattern === 'symbol') {
      if (pattern === ROUTE_MATCH_START_ANCHOR_PATTERN) {
        return {
          matched: true,
          exactlyMatched: false,
          segment: undefined,
          rest: upperRest,
        };
      }

      throw new Error(`Unrecognized symbol pattern [${pattern.description}]`);
    }

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

    if (exactlyMatched) {
      let allowExact = this._allowExact;

      if (typeof allowExact === 'string') {
        rest = `/${allowExact}`;
      } else if (this._children && !allowExact) {
        matched = false;
        exactlyMatched = false;
      }
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
      ...Array.from(this._beforeLeaveCallbackSet).map(callback =>
        tolerate(callback),
      ),
      (async () => {
        let service = await this._getService();

        if (service && service.beforeLeave) {
          return tolerate(() => service!.beforeLeave!());
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeEnter(): Promise<boolean> {
    let next = this.$next;

    let results = await Promise.all([
      ...Array.from(this._beforeEnterCallbackSet).map(callback =>
        tolerate(callback, next),
      ),
      (async () => {
        let service = await this._getService();

        if (service && service.beforeEnter) {
          return tolerate(() => service!.beforeEnter!(next));
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeUpdate(
    triggeredByDescendants: boolean,
  ): Promise<boolean | RouteMatch> {
    let next = this.$next;

    let results = await Promise.all([
      ...Array.from(this._beforeUpdateEntrySet)
        .filter(({options}) =>
          triggeredByDescendants ? options && options.traceDescendants : true,
        )
        .map(({callback}) =>
          tolerate(callback, next, {descendants: triggeredByDescendants}),
        ),
      (async () => {
        let service = await this._getService();

        if (service && service.beforeUpdate) {
          return tolerate(() =>
            service!.beforeUpdate!(next, {descendants: triggeredByDescendants}),
          );
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _afterLeave(): Promise<void> {
    for (let autorunDisposer of this._autorunDisposers) {
      autorunDisposer();
    }

    for (let callback of this._afterLeaveCallbackSet) {
      tolerate(callback);
    }

    let service = await this._getService();

    if (service && service.afterLeave) {
      tolerate(() => service!.afterLeave!());
    }
  }

  /** @internal */
  async _afterEnter(): Promise<void> {
    for (let callback of this._afterEnterCallbackSet) {
      tolerate(callback);
    }

    let service = await this._getService();

    if (service && service.afterEnter) {
      tolerate(() => service!.afterEnter!());
    }

    for (let autorunEntry of this._autorunEntrySet) {
      tolerate(() => {
        this._autorunDisposers.push(
          autorun(autorunEntry.view, autorunEntry.options),
        );
      });
    }
  }

  /** @internal */
  async _afterUpdate(triggeredByDescendants: boolean): Promise<void> {
    for (let {callback, options} of this._afterUpdateEntrySet) {
      if (triggeredByDescendants ? options && options.traceDescendants : true) {
        tolerate(callback, {descendants: triggeredByDescendants});
      }
    }

    let service = await this._getService();

    if (service && service.afterUpdate) {
      tolerate(() =>
        service!.afterUpdate!({descendants: triggeredByDescendants}),
      );
    }
  }

  /** @internal */
  _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined {
    let matchToMatchEntryMap = source.groupToMatchToMatchEntryMapMap.get(
      this.$group,
    );

    return matchToMatchEntryMap && matchToMatchEntryMap.get(this);
  }

  /** @internal */
  protected _getBuilder(): RouteBuilder {
    return this.$router.$current;
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
