import {History, Location} from 'history';
import {Dict} from 'tslang';

import {GeneralFragmentDict, GeneralQueryDict, RouteMatch} from './route-match';

interface PathSchemaQueryPartial<TQuery> {
  query: TQuery;
}

interface PathSchemaChildrenPartial<TPathSchemaDict> {
  children: TPathSchemaDict;
}

export interface PathSchema {
  match?: string | RegExp;
  query?: Dict<boolean>;
  children?: PathSchemaDict;
}

export type PathSchemaDict = Dict<PathSchema | boolean>;

export type NestedRouterType<
  TPathSchema,
  TFragmentKey extends string
> = RouteMatch<
  {[K in TFragmentKey]: string},
  TPathSchema extends PathSchemaQueryPartial<infer TQuerySchema>
    ? Record<keyof TQuerySchema, string | undefined>
    : {}
> &
  (TPathSchema extends PathSchemaChildrenPartial<infer TNestedPathSchemaDict>
    ? {
        [K in Extract<keyof TNestedPathSchemaDict, string>]: NestedRouterType<
          TNestedPathSchemaDict[K],
          TFragmentKey | K
        >
      }
    : {});

export type RootRouterType<TPathSchemaDict> = Router &
  {
    [K in Extract<keyof TPathSchemaDict, string>]: NestedRouterType<
      TPathSchemaDict[K],
      K
    >
  };

export class Router {
  /** @internal */
  _children!: RouteMatch[];

  private constructor(schema: PathSchemaDict, history: History) {
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
    upperFragmentDict: GeneralFragmentDict | undefined,
    queryDict: GeneralQueryDict,
  ): void {
    if (!target._children) {
      return;
    }

    for (let routeMatch of target._children) {
      let {matched, rest, fragmentDict} = routeMatch._push(
        skipped,
        upperRest,
        upperFragmentDict,
        queryDict,
      );

      if (matched && !skipped) {
        skipped = true;
      }

      this.pushRouteChange(routeMatch, skipped, rest, fragmentDict, queryDict);
    }
  }

  private buildRouteMatches(
    target: Router | RouteMatch,
    schemaDict: PathSchemaDict,
  ): RouteMatch[] {
    let routeMatches: RouteMatch[] = [];

    for (let [key, schema] of Object.entries(schemaDict)) {
      if (typeof schema === 'boolean') {
        schema = {};
      }

      let {match = key, query, children} = schema;

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

  static create<TSchema extends PathSchemaDict>(
    schema: TSchema,
    history: History,
  ): RootRouterType<TSchema> {
    return new Router(schema, history) as RootRouterType<TSchema>;
  }
}
