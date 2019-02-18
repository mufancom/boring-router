export class RouteGroup<TNextRouteMatchDict extends object = object> {
  readonly $next = {} as TNextRouteMatchDict;

  constructor(readonly $group: string) {}
}
