import {IHistory} from '../history';
import {Router} from '../router';

import {RouteMatch, RouteMatchEntry, RouteSource} from './route-match';
import {
  GeneralParamDict,
  RouteMatchShared,
  RouteMatchSharedOptions,
} from './route-match-shared';

export class NextRouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TGroupName extends string = string
> extends RouteMatchShared<TParamDict, TGroupName> {
  readonly $parent: NextRouteMatch | undefined;

  /** @internal */
  private _origin: RouteMatch<TParamDict>;

  constructor(
    name: string,
    prefix: string,
    router: Router,
    source: RouteSource,
    parent: NextRouteMatch<TParamDict> | undefined,
    origin: RouteMatch<TParamDict>,
    extension: object,
    history: IHistory,
    options: RouteMatchSharedOptions,
  ) {
    super(name, prefix, router, source, parent, history, options);

    this._origin = origin;

    for (let key of Object.keys(extension)) {
      Object.defineProperty(this, key, {
        get() {
          return (origin as any)[key];
        },
      });
    }
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
