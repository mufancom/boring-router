import {observable} from 'mobx';
import {Dict} from 'tslang';

import {isPathPrefix} from './@utils';

interface RouteMatchInternalResult {
  current: string | undefined;
  rest: string;
}

export type GeneralFragmentDict = Dict<string>;
export type GeneralQueryDict = Dict<string | undefined>;

/** @internal */
export interface RouteMatchPushResult {
  matched: boolean;
  rest: string;
  fragmentDict: GeneralFragmentDict | undefined;
}

export interface RouteMatchOptions {
  match: string | RegExp;
  query: Dict<boolean> | undefined;
}

export class RouteMatch<
  TFragmentDict extends GeneralFragmentDict = GeneralFragmentDict,
  TQueryDict extends GeneralQueryDict | undefined = GeneralQueryDict | undefined
> {
  private _matchPattern: string | RegExp;
  private _queryKeys: string[] | undefined;

  @observable
  private _matched = false;

  @observable
  private _fragments: GeneralFragmentDict | undefined;

  @observable
  private _query: GeneralQueryDict | undefined;

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
      this._matchPattern = /[^/]*/;
    } else if (match === '**') {
      this._matchPattern = /.*/;
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

  get $fragments(): TFragmentDict {
    return this._fragments as TFragmentDict;
  }

  get $query(): TQueryDict {
    let query = this._query;

    if (!query) {
      throw new Error(
        'Query is not accessible, make sure you added it to schema',
      );
    }

    return query as TQueryDict;
  }

  /** @internal */
  _push(
    skipped: boolean,
    upperRest: string,
    upperFragmentDict: GeneralFragmentDict | undefined,
    queryDict: GeneralQueryDict,
  ): RouteMatchPushResult {
    let {current, rest} = this._match(skipped, upperRest);

    let name = this._name;

    let matched = current !== undefined;

    let fragmentDict = {
      ...upperFragmentDict!,
      [name]: matched ? current! : name,
    };

    this._fragments = fragmentDict;

    let queryKeys = this._queryKeys;

    this._query = queryKeys
      ? matched
        ? queryKeys.reduce(
            (dict, key) => {
              dict[key] = queryDict[key];
              return dict;
            },
            {} as GeneralQueryDict,
          )
        : {}
      : undefined;

    this._matched = matched;

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
