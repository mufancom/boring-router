import {History, Location} from 'history';
import hyphenate from 'hyphenate';

import {then} from './@utils';
import {GeneralFragmentDict, GeneralQueryDict, RouteMatch} from './route-match';
import {RouteSchemaDict} from './schema';

export type FragmentMatcherCallback = (key: string) => string;

const DEFAULT_FRAGMENT_MATCHER_CALLBACK: FragmentMatcherCallback = key =>
  hyphenate(key, {lowerCase: true});

type RouteQuerySchemaType<TRouteSchema> = TRouteSchema extends {
  $query: infer TQuerySchema;
}
  ? TQuerySchema
  : never;

type FilterRouteMatchNonStringFragment<TRouteSchema, T> = TRouteSchema extends {
  $match: infer TMatch;
}
  ? TMatch extends string ? never : T
  : never;

interface RouteSchemaChildrenPartial<TRouteSchemaDict> {
  $children: TRouteSchemaDict;
}

export type RouteMatchFragmentType<
  TRouteSchemaDict,
  TFragmentKey extends string
> = {
  [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
    TRouteSchemaDict[K],
    TFragmentKey | FilterRouteMatchNonStringFragment<TRouteSchemaDict[K], K>
  >
};

export type RouteMatchType<
  TRouteSchema,
  TFragmentKey extends string
> = RouteMatch<
  Record<
    Extract<keyof RouteQuerySchemaType<TRouteSchema>, string>,
    string | undefined
  > &
    {[K in TFragmentKey]: string}
> &
  (TRouteSchema extends RouteSchemaChildrenPartial<infer TNestedRouteSchemaDict>
    ? RouteMatchFragmentType<TNestedRouteSchemaDict, TFragmentKey>
    : {});

export type RouterType<TRouteSchemaDict> = Router &
  RouteMatchFragmentType<TRouteSchemaDict, never>;

export interface RouteMatchEntry {
  match: RouteMatch;
  exact: boolean;
  fragment: string;
}

export interface RouterOptions {
  /**
   * A function to perform default schema field name to fragment string
   * transformation.
   */
  fragmentMatcher?: FragmentMatcherCallback;
}

export class Router {
  /** @internal */
  private _history: History;

  /** @internal */
  private _fragmentMatcher: FragmentMatcherCallback;

  /** @internal */
  _children: RouteMatch[];

  private constructor(
    schema: RouteSchemaDict,
    history: History,
    {fragmentMatcher}: RouterOptions,
  ) {
    this._history = history;

    this._fragmentMatcher =
      fragmentMatcher || DEFAULT_FRAGMENT_MATCHER_CALLBACK;

    this._children = this._build(this, schema);

    this._update(this, new Map(), {}, {}, {});

    then(() => {
      history.listen(this._onLocationChange);
      this._onLocationChange(history.location);
    });
  }

  /** @internal */
  private _onLocationChange = ({pathname, search}: Location): void => {
    let searchParams = new URLSearchParams(search);

    let queryDict = Array.from(searchParams).reduce(
      (dict, [key, value]) => {
        dict[key] = value;
        return dict;
      },
      {} as GeneralQueryDict,
    );

    let matchResult = this._match(this, pathname);

    if (typeof matchResult === 'string') {
      this._history.replace(matchResult);
      return;
    }

    let routeMatchEntryMap = new Map(
      matchResult
        ? matchResult.map(
            (entry): [RouteMatch, RouteMatchEntry] => [entry.match, entry],
          )
        : undefined,
    );

    this._update(this, routeMatchEntryMap, {}, {}, queryDict);
  };

  /** @internal */
  private _match(
    target: Router | RouteMatch,
    upperRest: string,
  ): RouteMatchEntry[] | string | undefined {
    for (let routeMatch of target._children || []) {
      let {fragment, rest} = routeMatch._match(upperRest);

      let matched = fragment !== undefined;
      let exact = matched && rest === '';

      if (matched) {
        let interceptionResult = routeMatch._intercept(exact);

        if (typeof interceptionResult === 'string') {
          return interceptionResult;
        } else if (interceptionResult === false) {
          matched = false;
          exact = false;
        }
      }

      if (!matched) {
        continue;
      }

      if (exact) {
        return [
          {
            match: routeMatch,
            fragment: fragment!,
            exact: true,
          },
        ];
      }

      let result = this._match(routeMatch, rest);

      if (typeof result === 'string') {
        return result;
      } else if (result) {
        return [
          {
            match: routeMatch,
            fragment: fragment!,
            exact: false,
          },
          ...result,
        ];
      }
    }

    return undefined;
  }

  /** @internal */
  private _update(
    target: Router | RouteMatch,
    routeMatchEntryMap: Map<RouteMatch, RouteMatchEntry>,
    upperPathFragmentDict: GeneralFragmentDict,
    upperParamFragmentDict: GeneralFragmentDict,
    sourceQueryDict: GeneralQueryDict,
  ): void {
    for (let routeMatch of target._children || []) {
      let entry = routeMatchEntryMap.get(routeMatch);

      let matched: boolean;
      let exact: boolean;
      let fragment: string | undefined;

      if (entry) {
        matched = true;
        exact = entry.exact;
        fragment = entry.fragment;
      } else {
        matched = false;
        exact = false;
      }

      let {pathFragmentDict, paramFragmentDict} = routeMatch._update(
        matched,
        exact,
        fragment,
        upperPathFragmentDict,
        upperParamFragmentDict,
        sourceQueryDict,
      );

      this._update(
        routeMatch,
        routeMatchEntryMap,
        pathFragmentDict,
        paramFragmentDict,
        sourceQueryDict,
      );
    }
  }

  /** @internal */
  private _build(
    target: Router | RouteMatch,
    schemaDict: RouteSchemaDict,
  ): RouteMatch[] {
    let routeMatches: RouteMatch[] = [];

    for (let [key, schema] of Object.entries(schemaDict)) {
      if (typeof schema === 'boolean') {
        schema = {};
      }

      let {
        $match: match = this._fragmentMatcher(key),
        $query: query,
        $children: children,
      } = schema;

      let routeMatch = new RouteMatch(key, this._history, {match, query});

      routeMatches.push(routeMatch);

      (target as any)[key] = routeMatch;

      if (!children) {
        continue;
      }

      routeMatch._children = this._build(routeMatch, children);
    }

    return routeMatches;
  }

  static create<TSchema extends RouteSchemaDict>(
    schema: TSchema,
    history: History,
    options: RouterOptions = {},
  ): RouterType<TSchema> {
    return new Router(schema, history, options) as RouterType<TSchema>;
  }
}
