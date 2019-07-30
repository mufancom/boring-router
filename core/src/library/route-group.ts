import {IHistory} from './history';
import {
  COMPATIBLE_MATCH_SYMBOL,
  GeneralParamDict,
  NextRouteMatch,
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
      match: COMPATIBLE_MATCH_SYMBOL,
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
        match: COMPATIBLE_MATCH_SYMBOL,
        query: undefined,
        group,
      },
    ) as TNextRouteMatch;
  }
}
