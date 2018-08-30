import {observable} from 'mobx';
import {Dict} from 'tslang';

import {isPathPrefix} from './@utils';

interface RouteMatchInternalResult {
  current: string | undefined;
  rest: string;
}

export type GeneralFragmentDict = Dict<string>;
export type GeneralQueryDict = Dict<string | undefined>;
export type GeneralParamDict = Dict<string | undefined>;

/** @internal */
export interface RouteMatchPushResult {
  matched: boolean;
  rest: string;
  fragmentDict: GeneralFragmentDict;
}

export interface RouteMatchOptions {
  match: string | RegExp;
  query: Dict<boolean> | undefined;
}

export class RouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict
> {
  private _matchPattern: string | RegExp;
  private _queryKeys: string[] | undefined;

  @observable
  private _matched = false;

  @observable
  private _exact = false;

  private _fragments!: GeneralFragmentDict;
  private _sourceQuery: GeneralQueryDict | undefined;

  @observable
  private _params!: GeneralParamDict;

  /** @internal */
  _children!: RouteMatch[];

  constructor(private _name: string, {match, query}: RouteMatchOptions) {
    if (match instanceof RegExp) {
      if (match.global) {
        throw new Error(
          'Expecting a non-global regular expression as match pattern',
        );
      }

      this._matchPattern = match;
    } else if (match === '*') {
      this._matchPattern = /[^/]+/;
    } else if (match === '**') {
      this._matchPattern = /.+/;
    } else {
      this._matchPattern = match;
    }

    if (query) {
      this._queryKeys = Object.keys(query);
    }
  }

  get $matched(): boolean {
    return this._matched;
  }

  get $exact(): boolean {
    return this._exact;
  }

  get $params(): TParamDict {
    return this._params as TParamDict;
  }

  $path(params: Partial<TParamDict> = {}, preserveQuery = false): string {
    let fragmentDict = this._fragments;

    let paramKeySet = new Set(Object.keys(params));

    let path = Object.keys(fragmentDict)
      .map(key => {
        paramKeySet.delete(key);

        let param = params[key];
        let fragment = fragmentDict[key];

        if (typeof fragment === 'string') {
          if (typeof param === 'string') {
            throw new Error(
              `Parameter "${key}" cannot override fragment "${fragment}"`,
            );
          }

          return `/${fragment}`;
        } else {
          if (typeof param !== 'string') {
            throw new Error(`Parameter "${key}" is required`);
          }

          return `/${param}`;
        }
      })
      .join('');

    let queryDict = this._sourceQuery;

    let query = new URLSearchParams([
      ...(preserveQuery && queryDict
        ? (Object.entries(queryDict) as [string, string][])
        : []),
      ...Array.from(paramKeySet).map(
        (key): [string, string] => [key, params[key]!],
      ),
    ]).toString();

    return path + (query ? `?${query}` : '');
  }

  /** @internal */
  _push(
    skipped: boolean,
    upperRest: string,
    upperFragmentDict: GeneralFragmentDict,
    sourceQueryDict: GeneralQueryDict,
  ): RouteMatchPushResult {
    let {current, rest} = this._match(skipped, upperRest);

    let name = this._name;

    let matched = current !== undefined;
    let exact = matched && rest === '';

    let matchPattern = this._matchPattern;

    let fragmentDict = {
      ...upperFragmentDict,
      [name]: matched
        ? current!
        : typeof matchPattern === 'string'
          ? matchPattern
          : undefined!,
    };

    this._fragments = fragmentDict;

    let queryKeys = this._queryKeys;

    let queryDict = queryKeys
      ? matched
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
        : {}
      : undefined;

    this._sourceQuery = sourceQueryDict;

    this._params = {
      ...queryDict,
      ...fragmentDict,
    };

    this._matched = matched;
    this._exact = exact;

    return {
      matched,
      rest,
      fragmentDict,
    };
  }

  private _match(skipped: boolean, rest: string): RouteMatchInternalResult {
    if (skipped || !rest) {
      return {
        current: undefined,
        rest: '',
      };
    }

    if (!rest.startsWith('/')) {
      throw new Error(
        `Expecting rest of path to be started with "/", but got ${JSON.stringify(
          rest,
        )} instead`,
      );
    }

    rest = rest.slice(1);

    let pattern = this._matchPattern;

    if (typeof pattern === 'string') {
      if (isPathPrefix(rest, pattern)) {
        return {
          current: pattern,
          rest: rest.slice(pattern.length),
        };
      } else {
        return {
          current: undefined,
          rest: '',
        };
      }
    } else {
      let groups = pattern.exec(rest);

      if (groups) {
        let matched = groups[0];

        if (!isPathPrefix(rest, matched)) {
          throw new Error(
            `Invalid regular expression pattern, expecting rest of path to be started with "/" after match (matched ${JSON.stringify(
              matched,
            )} out of ${JSON.stringify(rest)})`,
          );
        }

        return {
          current: matched,
          rest: rest.slice(matched.length),
        };
      } else {
        return {
          current: undefined,
          rest: '',
        };
      }
    }
  }
}
