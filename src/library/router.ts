import {History, Location} from 'history';
import hyphenate from 'hyphenate';

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
  _children!: RouteMatch[];

  private constructor(
    schema: RouteSchemaDict,
    history: History,
    {fragmentMatcher}: RouterOptions,
  ) {
    this._history = history;

    this._fragmentMatcher =
      fragmentMatcher || DEFAULT_FRAGMENT_MATCHER_CALLBACK;

    this._children = this._buildRouteMatches(this, schema);

    history.listen(this._onLocationChange);

    this._onLocationChange(history.location);
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

    this._pushRouteChange(this, false, pathname, {}, {}, queryDict);
  };

  /** @internal */
  private _pushRouteChange(
    target: Router | RouteMatch,
    skipped: boolean,
    upperRest: string,
    upperPathFragmentDict: GeneralFragmentDict,
    upperParamFragmentDict: GeneralFragmentDict,
    sourceQueryDict: GeneralQueryDict,
  ): void {
    if (!target._children) {
      return;
    }

    for (let routeMatch of target._children) {
      let {
        matched,
        rest,
        pathFragmentDict,
        paramFragmentDict,
      } = routeMatch._update(
        skipped,
        upperRest,
        upperPathFragmentDict,
        upperParamFragmentDict,
        sourceQueryDict,
      );

      if (matched) {
        skipped = true;
      }

      this._pushRouteChange(
        routeMatch,
        !matched,
        rest,
        pathFragmentDict,
        paramFragmentDict,
        sourceQueryDict,
      );
    }
  }

  /** @internal */
  private _buildRouteMatches(
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

      routeMatch._children = this._buildRouteMatches(routeMatch, children);
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
