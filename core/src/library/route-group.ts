import {IHistory} from './history';
import {
  GeneralParamDict,
  NextRouteMatch,
  ROUTER_MATCH_SYMBOL,
  RouteMatch,
  RouteSource,
} from './route-match';

export class RouteGroup<
  TParamDict extends GeneralParamDict = GeneralParamDict,
  TNextRouteMatch extends NextRouteMatch<TParamDict> = NextRouteMatch<
    TParamDict
  >,
  TGroupName extends string = string,
  TGroupNames extends string = string
> extends RouteMatch<TParamDict, TNextRouteMatch, TGroupName, TGroupNames> {
  readonly $next!: TNextRouteMatch;

  constructor(
    readonly group: TGroupName | undefined,
    prefix: string,
    source: RouteSource,
    matchingSource: RouteSource,
    history: IHistory,
  ) {
    super(group || '', prefix, source, undefined, {}, history, {
      exact: false,
      match: ROUTER_MATCH_SYMBOL,
      query: undefined,
      group,
    });

    this.$next = new NextRouteMatch(
      group || '',
      prefix,
      matchingSource,
      undefined,
      this,
      {},
      history,
      {
        match: ROUTER_MATCH_SYMBOL,
        query: undefined,
        group,
      },
    ) as TNextRouteMatch;
  }
}
