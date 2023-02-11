import type {
  IAutorunOptions,
  IReactionDisposer,
  IReactionOptions,
  IReactionPublic,
} from 'mobx';
import {autorun, observable, reaction} from 'mobx';
import type {OmitValueOfKey, OmitValueWithType} from 'tslang';

import {testPathPrefix, tolerate} from '../@utils';
import type {IHistory} from '../history';
import type {RouteBuilder} from '../route-builder';
import type {Router} from '../router';

import type {NextRouteMatch} from './next-route-match';
import type {
  GeneralParamDict,
  GeneralSegmentDict,
  RouteMatchSharedOptions,
} from './route-match-shared';
import {RouteMatchShared} from './route-match-shared';

export const ROUTE_SERVICE_ENTER_DATA_SYMBOL = Symbol('enter data');
export const ROUTE_SERVICE_UPDATE_DATA_SYMBOL = Symbol('update data');

/////////////////////
// lifecycle hooks //
/////////////////////

export interface RouteUpdateContext {
  descendants: boolean;
}

// before enter //

/**
 * Route before enter callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeEnterCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (next: TRouteMatch['$next']) => Promise<boolean | void> | boolean | void;

export type ServiceBeforeEnterCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
  TEnterData extends object | void = object | void,
> = (
  next: TRouteMatch['$next'],
) => Promise<boolean | TEnterData | void> | boolean | TEnterData | void;

// before update //

/**
 * Route before update callback.
 * @return Return `true` or `undefined` to do nothing; return `false` to revert
 * this history change; return full path to redirect.
 */
export type RouteBeforeUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (
  next: TRouteMatch['$next'],
  context: RouteUpdateContext,
) => Promise<boolean | void> | boolean | void;

export type ServiceBeforeUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
  TUpdateData extends object | void = object | void,
> = (
  next: TRouteMatch['$next'],
  context: RouteUpdateContext,
) => Promise<boolean | TUpdateData | void> | boolean | TUpdateData | void;

export interface RouteBeforeUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteBeforeUpdateEntry<
  TRouteMatch extends RouteMatch = RouteMatch,
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

// will enter //

export type RouteWillEnterCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (next: TRouteMatch['$next']) => Promise<void> | void;

export type ServiceWillEnterCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
  TEnterData extends object | void = object | void,
> = (next: TRouteMatch['$next'], data: TEnterData) => Promise<void> | void;

// will update //

export type RouteWillUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (
  next: TRouteMatch['$next'],
  context: RouteUpdateContext,
) => Promise<void> | void;

export type ServiceWillUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
  TUpdateData extends object | void = object | void,
> = (
  next: TRouteMatch['$next'],
  context: RouteUpdateContext,
  data: TUpdateData,
) => Promise<void> | void;

export interface RouteWillUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteWillUpdateEntry<
  TRouteMatch extends RouteMatch = RouteMatch,
> {
  callback: RouteWillUpdateCallback<TRouteMatch>;
  options?: RouteWillUpdateOptions;
}

// will leave //

export type RouteWillLeaveCallback = () => Promise<void> | void;

// enter //

export type RouteEnterCallback = () => void;

export type ServiceEnterCallback<
  TEnterData extends object | void = object | void,
> = (data: TEnterData) => void;

// update //

export type RouteUpdateCallback = (context: RouteUpdateContext) => void;

export type ServiceUpdateCallback<TUpdateData extends object | void> = (
  context: RouteUpdateContext,
  data: TUpdateData,
) => void;

export interface RouteUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteUpdateEntry {
  callback: RouteUpdateCallback;
  options?: RouteUpdateOptions;
}

// leave //

export type RouteLeaveCallback = () => void;

// after enter //

export type RouteAfterEnterCallback = () => void;

// after update //

/**
 * Route after update callback.
 */
export type RouteAfterUpdateCallback = (context: RouteUpdateContext) => void;

export interface RouteAfterUpdateOptions {
  traceDescendants: boolean;
}

export interface RouteAfterUpdateEntry {
  options?: RouteAfterUpdateOptions;
  callback: RouteAfterUpdateCallback;
}

// after leave //

export type RouteAfterLeaveCallback = () => void;

// reactive //

export type RouteReactiveDisposer = IReactionDisposer;

export type RouteAutorunView = (reaction: IReactionPublic) => void;

export type RouteAutorunOptions = IAutorunOptions;

interface RouteAutorunEntry {
  type: 'autorun';
  view: RouteAutorunView;
  options: RouteAutorunOptions | undefined;
  disposer: RouteReactiveDisposer | undefined;
}

export type RouteReactionExpression<T> = (reaction: IReactionPublic) => T;

export type RouteReactionEffect<T> = (
  value: T,
  previousValue: T,
  reaction: IReactionPublic,
) => void;

export type RouteReactionOptions<
  T,
  FireImmediately extends boolean = boolean,
> = IReactionOptions<T, FireImmediately> | undefined;

interface RouteReactionEntry<
  T = unknown,
  FireImmediately extends boolean = boolean,
> {
  type: 'reaction';
  expression: RouteReactionExpression<T>;
  effect: RouteReactionEffect<T>;
  options: RouteReactionOptions<T, FireImmediately> | undefined;
  disposer: RouteReactiveDisposer | undefined;
}

// removal //

export type RouteHookRemovalCallback = () => void;

// enter or update combination //

export type RouteBeforeEnterOrUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (next: TRouteMatch['$next']) => Promise<boolean | void> | boolean | void;

export type RouteWillEnterOrUpdateCallback<
  TRouteMatch extends RouteMatch = RouteMatch,
> = (next: TRouteMatch['$next']) => Promise<void> | void;

export type RouteAfterEnterOrUpdateCallback = () => void;

///

export type RouteServiceFactory<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => IRouteService<TRouteMatch> | Promise<IRouteService<TRouteMatch>>;

export type IRouteService<
  TRouteMatch extends RouteMatch = RouteMatch,
  TEnterData extends object | void = object | void,
  TUpdateData extends object | void = TEnterData,
> = {
  /** @internal */
  [ROUTE_SERVICE_ENTER_DATA_SYMBOL]?: TEnterData;
  /** @internal */
  [ROUTE_SERVICE_UPDATE_DATA_SYMBOL]?: TUpdateData;
  beforeEnter?: ServiceBeforeEnterCallback<TRouteMatch, TEnterData>;
  willEnter?: ServiceWillEnterCallback<TRouteMatch, TEnterData>;
  enter?: ServiceEnterCallback<TEnterData>;
  afterEnter?: RouteAfterEnterCallback;
  beforeUpdate?: ServiceBeforeUpdateCallback<TRouteMatch, TUpdateData>;
  willUpdate?: ServiceWillUpdateCallback<TRouteMatch, TUpdateData>;
  update?: ServiceUpdateCallback<TUpdateData>;
  afterUpdate?: RouteAfterUpdateCallback;
  beforeLeave?: RouteBeforeLeaveCallback;
  willLeave?: RouteWillLeaveCallback;
  leave?: RouteLeaveCallback;
  afterLeave?: RouteAfterLeaveCallback;
} & RouteServiceExtension<TRouteMatch>;

export type RouteServiceExtension<TRouteMatch extends RouteMatch> =
  OmitValueWithType<
    OmitValueOfKey<TRouteMatch, keyof RouteMatch>,
    RouteMatch,
    false
  >;

type RouteReactiveEntry = RouteAutorunEntry | RouteReactionEntry;

interface RouteMatchInternalResult {
  matched: boolean;
  exactlyMatched: boolean;
  segment: string | undefined;
  rest: string;
}

export interface RouteMatchResult {
  matched: boolean;
  exactlyMatched: boolean;
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

export interface RouteSourceQuery {
  id: string | symbol | true;
  value: string;
}

export interface RouteSource {
  groupToMatchToMatchEntryMapMap: Map<
    string | undefined,
    Map<RouteMatch, RouteMatchEntry>
  >;
  queryMap: Map<string, RouteSourceQuery>;
  pathMap: Map<string | undefined, string>;
}

export interface RouteMatchOptions extends RouteMatchSharedOptions {
  exact: boolean | string;
}

export class RouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TNextRouteMatch extends NextRouteMatch<TParamDict> = NextRouteMatch<TParamDict>,
  TSpecificGroupName extends string | undefined = string | undefined,
  TGroupName extends string = string,
  TMetadata extends object = object,
> extends RouteMatchShared<
  TParamDict,
  TSpecificGroupName,
  TGroupName,
  TMetadata
> {
  declare readonly $parent: RouteMatch | undefined;

  readonly $next!: TNextRouteMatch;

  /** @internal */
  private _beforeEnterCallbackSet = new Set<RouteBeforeEnterCallback>();

  /** @internal */
  private _beforeUpdateEntrySet = new Set<RouteBeforeUpdateEntry>();

  /** @internal */
  private _beforeLeaveCallbackSet = new Set<RouteBeforeLeaveCallback>();

  /** @internal */
  private _willEnterCallbackSet = new Set<RouteWillEnterCallback>();

  /** @internal */
  private _willUpdateEntrySet = new Set<RouteWillUpdateEntry>();

  /** @internal */
  private _willLeaveCallbackSet = new Set<RouteWillLeaveCallback>();

  /** @internal */
  private _enterCallbackSet = new Set<RouteEnterCallback>();

  /** @internal */
  private _updateEntrySet = new Set<RouteUpdateEntry>();

  /** @internal */
  private _leaveCallbackSet = new Set<RouteLeaveCallback>();

  /** @internal */
  private _afterEnterCallbackSet = new Set<RouteAfterEnterCallback>();

  /** @internal */
  private _afterUpdateEntrySet = new Set<RouteAfterUpdateEntry>();

  /** @internal */
  private _afterLeaveCallbackSet = new Set<RouteAfterLeaveCallback>();

  /** @internal */
  private _reactiveEntrySet = new Set<RouteReactiveEntry>();

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
      for (const key of Object.keys(extension)) {
        Object.defineProperty(this, key, {
          get(this: RouteMatch) {
            const service = this.$matched ? this._service : undefined;

            if (service && key in service) {
              let value = (service as any)[key];

              if (typeof value === 'function') {
                value = value.bind(service);
              }

              return value;
            } else {
              return (extension as any)[key];
            }
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
    const entry: RouteBeforeUpdateEntry<this> = {
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

  $willEnter(callback: RouteWillEnterCallback): RouteHookRemovalCallback {
    this._willEnterCallbackSet.add(callback);

    return () => {
      this._willEnterCallbackSet.delete(callback);
    };
  }

  $willUpdate(
    callback: RouteWillUpdateCallback,
    options?: RouteWillUpdateOptions,
  ): RouteHookRemovalCallback {
    const willUpdateEntry: RouteWillUpdateEntry = {
      callback,
      options,
    };

    this._willUpdateEntrySet.add(willUpdateEntry);

    return () => {
      this._willUpdateEntrySet.delete(willUpdateEntry);
    };
  }

  $willLeave(callback: RouteWillLeaveCallback): RouteHookRemovalCallback {
    this._willLeaveCallbackSet.add(callback);

    return () => {
      this._willLeaveCallbackSet.delete(callback);
    };
  }

  $enter(callback: RouteEnterCallback): RouteHookRemovalCallback {
    this._enterCallbackSet.add(callback);

    return () => {
      this._enterCallbackSet.delete(callback);
    };
  }

  $update(
    callback: RouteUpdateCallback,
    options?: RouteUpdateOptions,
  ): RouteHookRemovalCallback {
    const updateEntry: RouteUpdateEntry = {
      callback,
      options,
    };

    this._updateEntrySet.add(updateEntry);

    return () => {
      this._updateEntrySet.delete(updateEntry);
    };
  }

  $leave(callback: RouteLeaveCallback): RouteHookRemovalCallback {
    this._leaveCallbackSet.add(callback);

    return () => {
      this._leaveCallbackSet.delete(callback);
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
    const afterUpdateEntry: RouteAfterUpdateEntry = {
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
    const autorunEntry: RouteAutorunEntry = {
      type: 'autorun',
      view,
      options,
      disposer: undefined,
    };

    this._reactiveEntrySet.add(autorunEntry);

    if (this.$matched) {
      tolerate(() => {
        autorunEntry.disposer = autorun(view, options);
      });
    }

    return () => {
      if (autorunEntry.disposer) {
        autorunEntry.disposer();
        autorunEntry.disposer = undefined;
      }

      this._reactiveEntrySet.delete(autorunEntry);
    };
  }

  $reaction<T>(
    expression: RouteReactionExpression<T>,
    effect: RouteReactionEffect<T>,
    options?: RouteReactionOptions<T>,
  ): RouteHookRemovalCallback {
    const reactionEntry: RouteReactionEntry = {
      type: 'reaction',
      expression,
      effect,
      options,
      disposer: undefined,
    };

    this._reactiveEntrySet.add(reactionEntry);

    if (this.$matched) {
      tolerate(() => {
        reactionEntry.disposer = reaction(expression, effect, options);
      });
    }

    return () => {
      if (reactionEntry.disposer) {
        reactionEntry.disposer();
        reactionEntry.disposer = undefined;
      }

      this._reactiveEntrySet.delete(reactionEntry);
    };
  }

  $beforeEnterOrUpdate(
    callback: RouteBeforeEnterOrUpdateCallback<this>,
    beforeUpdateOptions?: RouteBeforeUpdateOptions,
  ): RouteHookRemovalCallback {
    const beforeUpdateEntry: RouteBeforeUpdateEntry<this> = {
      callback,
      options: beforeUpdateOptions,
    };

    this._beforeEnterCallbackSet.add(callback);
    this._beforeUpdateEntrySet.add(beforeUpdateEntry);

    return () => {
      this._beforeEnterCallbackSet.delete(callback);
      this._beforeUpdateEntrySet.delete(beforeUpdateEntry);
    };
  }

  $willEnterOrUpdate(
    callback: RouteWillEnterOrUpdateCallback<this>,
    willUpdateOptions?: RouteWillUpdateOptions,
  ): RouteHookRemovalCallback {
    const willUpdateEntry: RouteWillUpdateEntry<this> = {
      callback,
      options: willUpdateOptions,
    };

    this._willEnterCallbackSet.add(callback);
    this._willUpdateEntrySet.add(willUpdateEntry);

    return () => {
      this._willEnterCallbackSet.delete(callback);
      this._willUpdateEntrySet.delete(willUpdateEntry);
    };
  }

  $afterEnterOrUpdate(
    callback: RouteAfterEnterOrUpdateCallback,
    afterUpdateOptions?: RouteAfterUpdateOptions,
  ): RouteHookRemovalCallback {
    const afterUpdateEntry: RouteAfterUpdateEntry = {
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

    const {groups = [], matches = []} = options;

    const parent = this.$parent;

    if (parent instanceof RouteMatch && parent._parallel) {
      const {groups: parentGroups = [], matches: parentMatches = []} =
        parent._parallel;

      const parentGroupSet = new Set(parentGroups);
      const parentMatchSet = new Set(parentMatches);

      const groupsBeingSubsetOfParents = groups.every(group =>
        parentGroupSet.has(group),
      );

      if (!groupsBeingSubsetOfParents) {
        throw new Error(
          "Parallel group can only be a subset of its parent's groups",
        );
      }

      const matchesBeingSubsetOfParents = matches.every(match => {
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

    const children = this._children || [];

    for (const child of children) {
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

  $match(path: string): RouteMatchResult {
    const parent = this.$parent;

    let upperRest: string;

    if (parent) {
      const {matched, rest} = parent.$match(path);

      if (!matched) {
        return {
          matched: false,
          exactlyMatched: false,
          rest: '',
        };
      }

      upperRest = rest;
    } else {
      upperRest = path;
    }

    const {matched, exactlyMatched, rest} = this._match(upperRest);

    return {matched, exactlyMatched, rest};
  }

  /** @internal */
  _match(upperRest: string): RouteMatchInternalResult {
    const pattern = this._matchPattern;

    let segment: string | undefined;
    let rest: string;

    if (typeof pattern === 'string') {
      if (testPathPrefix(upperRest, pattern)) {
        segment = pattern;
        rest = upperRest.slice(pattern.length);

        if (rest.startsWith('/')) {
          rest = rest.slice(1);
        }
      } else {
        segment = undefined;
        rest = '';
      }
    } else {
      const groups = pattern.exec(upperRest);

      if (groups) {
        const matched = groups[0];

        if (testPathPrefix(upperRest, matched)) {
          segment = matched;
          rest = upperRest.slice(matched.length);

          if (rest.startsWith('/')) {
            rest = rest.slice(1);
          }
        } else {
          segment = undefined;
          rest = '';
        }
      } else {
        segment = undefined;
        rest = '';
      }
    }

    let matched = segment !== undefined;
    let exactlyMatched = matched && rest === '';

    if (exactlyMatched) {
      const allowExact = this._allowExact;

      if (typeof allowExact === 'string') {
        // Specify a default rest path on an exact match.
        rest = allowExact;
      } else if (this._children && !allowExact) {
        // If this route has children and does not allow exact match, then this
        // match is invalid and reset `matched` and `exactlyMatched` to false.
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
    const results = await Promise.all([
      ...Array.from(this._beforeLeaveCallbackSet).map(callback =>
        tolerate(callback),
      ),
      (async () => {
        const service = this._getServiceSync();

        if (service && service.beforeLeave) {
          return tolerate(() => service.beforeLeave!());
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeEnter(): Promise<boolean> {
    const next = this.$next;

    const results = await Promise.all([
      ...Array.from(this._beforeEnterCallbackSet).map(callback =>
        tolerate(callback, next),
      ),
      (async () => {
        const service = await this._getService();

        if (service && service.beforeEnter) {
          const ret = await tolerate(() => service.beforeEnter!(next));

          if (typeof ret === 'object') {
            service[ROUTE_SERVICE_ENTER_DATA_SYMBOL] = ret;
            return undefined;
          } else {
            return ret;
          }
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _beforeUpdate(
    triggeredByDescendants: boolean,
  ): Promise<boolean | RouteMatch> {
    const next = this.$next;

    const results = await Promise.all([
      ...Array.from(this._beforeUpdateEntrySet)
        .filter(({options}) =>
          triggeredByDescendants ? options && options.traceDescendants : true,
        )
        .map(({callback}) =>
          tolerate(callback, next, {descendants: triggeredByDescendants}),
        ),
      (async () => {
        const service = this._getServiceSync();

        if (service && service.beforeUpdate) {
          const ret = await tolerate(() =>
            service.beforeUpdate!(next, {descendants: triggeredByDescendants}),
          );

          if (typeof ret === 'object') {
            service[ROUTE_SERVICE_UPDATE_DATA_SYMBOL] = ret;
            return undefined;
          } else {
            return ret;
          }
        }
      })(),
    ]);

    return !results.some(result => result === false);
  }

  /** @internal */
  async _willLeave(): Promise<void> {
    for (const reactiveEntry of this._reactiveEntrySet) {
      if (reactiveEntry.disposer) {
        reactiveEntry.disposer();
        reactiveEntry.disposer = undefined;
      }
    }

    await Promise.all([
      ...Array.from(this._willLeaveCallbackSet).map(callback =>
        tolerate(callback),
      ),
      (async () => {
        const service = this._getServiceSync();

        if (service && service.willLeave) {
          return tolerate(() => service.willLeave!());
        }
      })(),
    ]);
  }

  /** @internal */
  async _willEnter(): Promise<void> {
    const next = this.$next;

    await Promise.all([
      ...Array.from(this._willEnterCallbackSet).map(callback =>
        tolerate(callback, next),
      ),
      (async () => {
        const service = this._getServiceSync();

        if (service && service.willEnter) {
          return tolerate(() =>
            service.willEnter!(next, service[ROUTE_SERVICE_ENTER_DATA_SYMBOL]),
          );
        }
      })(),
    ]);
  }

  /** @internal */
  async _willUpdate(triggeredByDescendants: boolean): Promise<void> {
    const next = this.$next;

    await Promise.all([
      ...Array.from(this._willUpdateEntrySet)
        .filter(({options}) =>
          triggeredByDescendants ? options && options.traceDescendants : true,
        )
        .map(({callback}) =>
          tolerate(callback, next, {descendants: triggeredByDescendants}),
        ),
      (async () => {
        const service = this._getServiceSync();

        if (service && service.willUpdate) {
          return tolerate(() =>
            service.willUpdate!(
              next,
              {descendants: triggeredByDescendants},
              service[ROUTE_SERVICE_UPDATE_DATA_SYMBOL],
            ),
          );
        }
      })(),
    ]);
  }

  /** @internal */
  _abortEnter(): void {
    const service = this._getServiceSync();

    if (service) {
      delete service[ROUTE_SERVICE_ENTER_DATA_SYMBOL];
    }
  }

  /** @internal */
  _abortUpdate(): void {
    const service = this._getServiceSync();

    if (service) {
      delete service[ROUTE_SERVICE_UPDATE_DATA_SYMBOL];
    }
  }

  /** @internal */
  _enter(): void {
    for (const callback of this._enterCallbackSet) {
      tolerate(callback);
    }

    const service = this._getServiceSync();

    if (service) {
      const data = service[ROUTE_SERVICE_ENTER_DATA_SYMBOL];

      delete service[ROUTE_SERVICE_ENTER_DATA_SYMBOL];

      if (service.enter) {
        return tolerate(() => service.enter!(data));
      }
    }

    for (const reactiveEntry of this._reactiveEntrySet) {
      if (reactiveEntry.disposer) {
        reactiveEntry.disposer();
        console.warn('Unexpected disposer during enter phase.');
      }

      tolerate(() => {
        switch (reactiveEntry.type) {
          case 'autorun':
            reactiveEntry.disposer = autorun(
              reactiveEntry.view,
              reactiveEntry.options,
            );
            break;
          case 'reaction':
            reactiveEntry.disposer = reaction(
              reactiveEntry.expression,
              reactiveEntry.effect,
              reactiveEntry.options,
            );
            break;
        }
      });
    }
  }

  /** @internal */
  _update(triggeredByDescendants: boolean): void {
    for (const {options, callback} of this._updateEntrySet) {
      if (triggeredByDescendants && !(options?.traceDescendants ?? false)) {
        continue;
      }

      tolerate(callback, {descendants: triggeredByDescendants});
    }

    const service = this._getServiceSync();

    if (service) {
      const data = service[ROUTE_SERVICE_UPDATE_DATA_SYMBOL];

      delete service[ROUTE_SERVICE_UPDATE_DATA_SYMBOL];

      if (service.update) {
        return tolerate(() =>
          service.update!({descendants: triggeredByDescendants}, data),
        );
      }
    }
  }

  /** @internal */
  _leave(): void {
    for (const callback of this._leaveCallbackSet) {
      tolerate(callback);
    }

    const service = this._getServiceSync();

    if (service && service.leave) {
      tolerate(() => service.leave!());
    }
  }

  /** @internal */
  async _afterLeave(): Promise<void> {
    for (const callback of this._afterLeaveCallbackSet) {
      tolerate(callback);
    }

    const service = this._getServiceSync();

    if (service && service.afterLeave) {
      tolerate(() => service.afterLeave!());
    }
  }

  /** @internal */
  async _afterEnter(): Promise<void> {
    for (const callback of this._afterEnterCallbackSet) {
      tolerate(callback);
    }

    const service = this._getServiceSync();

    if (service && service.afterEnter) {
      tolerate(() => service.afterEnter!());
    }
  }

  /** @internal */
  async _afterUpdate(triggeredByDescendants: boolean): Promise<void> {
    for (const {callback, options} of this._afterUpdateEntrySet) {
      if (triggeredByDescendants ? options && options.traceDescendants : true) {
        tolerate(callback, {descendants: triggeredByDescendants});
      }
    }

    const service = this._getServiceSync();

    if (service && service.afterUpdate) {
      tolerate(() =>
        service.afterUpdate!({descendants: triggeredByDescendants}),
      );
    }
  }

  /** @internal */
  _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined {
    const matchToMatchEntryMap = source.groupToMatchToMatchEntryMapMap.get(
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
    const serviceOrServicePromise = this._service || this._servicePromise;

    if (serviceOrServicePromise) {
      return serviceOrServicePromise;
    }

    const factory = this._serviceFactory;

    if (!factory) {
      return undefined;
    }

    const output = tolerate(factory, this);

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

  /** @internal */
  private _getServiceSync(): IRouteService | undefined {
    const service = this._service;

    if (service) {
      return service;
    }

    if (this._servicePromise) {
      throw new Error(
        `Service of route ${this.$name} is not ready: either use synchronous service factory or make sure the service is ready earlier`,
      );
    }

    const factory = this._serviceFactory;

    if (!factory) {
      return undefined;
    }

    const output = tolerate(factory, this);

    if (output instanceof Promise) {
      this._servicePromise = output.then(service => {
        this._service = service;
        return service;
      });

      throw new Error(
        `Service of route ${this.$name} is not ready: either use synchronous service factory or make sure the service is ready earlier`,
      );
    } else {
      this._service = output;
      return output;
    }
  }

  static SEGMENT = /[^/]+/;
  static REST = /.*/;
}
