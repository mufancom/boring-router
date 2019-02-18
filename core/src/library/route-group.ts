export class RouteGroup<
  TGroupName extends string = string,
  TNextRouteMatchDict extends object = object
> {
  readonly $next = {} as TNextRouteMatchDict;

  constructor(readonly $group: TGroupName) {}
}
