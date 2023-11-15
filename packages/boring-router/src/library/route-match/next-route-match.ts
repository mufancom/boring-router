import type {IHistory} from '../history/index.js';
import type {RouteBuilder} from '../route-builder.js';
import type {Router} from '../router.js';

import type {
  GeneralParamDict,
  RouteMatchSharedOptions,
} from './route-match-shared.js';
import {RouteMatchShared} from './route-match-shared.js';
import type {RouteMatch, RouteMatchEntry, RouteSource} from './route-match.js';

export class NextRouteMatch<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TSpecificGroupName extends string | undefined = string | undefined,
  TGroupName extends string = string,
  TMetadata extends object = object,
> extends RouteMatchShared<
  TParamDict,
  TSpecificGroupName,
  TGroupName,
  TMetadata
> {
  declare readonly $parent: NextRouteMatch | undefined;

  /** @internal */
  private _origin: RouteMatch<TParamDict>;

  constructor(
    name: string,
    router: Router<TGroupName>,
    source: RouteSource,
    parent: NextRouteMatch<TParamDict> | undefined,
    origin: RouteMatch<TParamDict>,
    history: IHistory,
    options: RouteMatchSharedOptions,
  ) {
    super(name, router, source, parent, history, options);

    this._origin = origin;
  }

  /** @internal */
  _getMatchEntry(source: RouteSource): RouteMatchEntry | undefined {
    return this._origin._getMatchEntry(source);
  }

  /** @internal */
  protected _getBuilder(): RouteBuilder {
    return this.$router.$next;
  }
}
