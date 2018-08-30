import {History, Location} from 'history';
import {Dict} from 'tslang';

import {GeneralFragmentDict, GeneralQueryDict, RouteMatch} from './route-match';

type RouteQuerySchemaType<T> = T extends {
  $query: infer TSchema;
}
  ? TSchema
  : never;

interface RouteSchemaChildrenPartial<TRouteSchemaDict> {
  $children: TRouteSchemaDict;
}

export interface RouteSchema {
  $match?: string | RegExp;
  $query?: Dict<boolean>;
  $children?: RouteSchemaDict;
}

export type RouteSchemaDict = Dict<RouteSchema | boolean>;

export type RouteMatchType<
  TRouteSchema,
  TFragmentKey extends string
> = RouteMatch<
  {[K in TFragmentKey]: string},
  Record<
    Extract<keyof RouteQuerySchemaType<TRouteSchema>, string>,
    string | undefined
  >
> &
  (TRouteSchema extends RouteSchemaChildrenPartial<infer TNestedRouteSchemaDict>
    ? {
        [K in Extract<keyof TNestedRouteSchemaDict, string>]: RouteMatchType<
          TNestedRouteSchemaDict[K],
          TFragmentKey | K
        >
      }
    : {});

export type RootRouterType<TRouteSchemaDict> = Router &
  {
    [K in Extract<keyof TRouteSchemaDict, string>]: RouteMatchType<
      TRouteSchemaDict[K],
      K
    >
  };

export class Router {
  /** @internal */
  _children!: RouteMatch[];

  private constructor(schema: RouteSchemaDict, history: History) {
    this._children = this.buildRouteMatches(this, schema);

    history.listen(this.onLocationChange);

    this.onLocationChange(history.location);
  }

  private onLocationChange = ({pathname, search}: Location): void => {
    let searchParams = new URLSearchParams(search);

    let queryDict = Array.from(searchParams).reduce(
      (dict, [key, value]) => {
        dict[key] = value;
        return dict;
      },
      {} as GeneralQueryDict,
    );

    this.pushRouteChange(this, false, pathname, {}, queryDict);
  };

  private pushRouteChange(
    target: Router | RouteMatch,
    skipped: boolean,
    upperRest: string,
    upperFragmentDict: GeneralFragmentDict,
    sourceQueryDict: GeneralQueryDict,
  ): void {
    if (!target._children) {
      return;
    }

    for (let routeMatch of target._children) {
      let {matched, rest, fragmentDict} = routeMatch._push(
        skipped,
        upperRest,
        upperFragmentDict,
        sourceQueryDict,
      );

      if (matched) {
        skipped = true;
      }

      this.pushRouteChange(
        routeMatch,
        !matched,
        rest,
        fragmentDict,
        sourceQueryDict,
      );
    }
  }

  private buildRouteMatches(
    target: Router | RouteMatch,
    schemaDict: RouteSchemaDict,
  ): RouteMatch[] {
    let routeMatches: RouteMatch[] = [];

    for (let [key, schema] of Object.entries(schemaDict)) {
      if (typeof schema === 'boolean') {
        schema = {};
      }

      let {$match: match = key, $query: query, $children: children} = schema;

      let routeMatch = new RouteMatch(key, {match, query});

      routeMatches.push(routeMatch);

      (target as any)[key] = routeMatch;

      if (!children) {
        continue;
      }

      routeMatch._children = this.buildRouteMatches(routeMatch, children);
    }

    return routeMatches;
  }

  static create<TSchema extends RouteSchemaDict>(
    schema: TSchema,
    history: History,
  ): RootRouterType<TSchema> {
    return new Router(schema, history) as RootRouterType<TSchema>;
  }
}
