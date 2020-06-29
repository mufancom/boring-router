---
menu: References
name: Service
route: /references/service
---

# Service

Every `RouteMatch` can be backed by a route service in Boring Router, providing additional flexibility with states comparing to lifecycle hooks.

A route service gets only "activated" when the route matches. And we can provide both pre-instantiated service or service factory:

```ts
route.account.$service(new AccountRouteService());

route.settings.$service(match => new SettingsRouteService(match));

route.workbench.$service(async match => {
  // asynchronous code...
  return new WorkbenchRouteService(match);
});
```

Service factory will be called on demand.

## Lifecycle Hooks

Lifecycle hooks are supported by service as optional methods:

```ts
type AccountRoute = typeof route.account;

class AccountRouteService implements IRouteService<AccountRoute> {
  constructor(private match: AccountRoute) {}

  async beforeEnter(next: AccountRoute['$next']): Promise<void> {}

  async willEnter(next: AccountRoute['$next']): Promise<void> {}

  async afterEnter(): void {}

  async beforeUpdate(next: AccountRoute['$next']): Promise<void> {
    this.beforeEnter(next);
  }

  async willUpdate(next: AccountRoute['$next']): Promise<void> {
    this.willEnter(next);
  }

  async afterUpdate(): void {
    this.afterEnter();
  }

  async beforeLeave(): Promise<void> {}

  async willLeave(): Promise<void> {}

  afterLeave(): void {}
}
```

> For full signatures of lifecycle hook methods, checkout [Lifecycle Hooks](/references/lifecycle-hooks) and type information.

## Managed Extension

We can add extension to a route with predefined values or getters (see also [Route Schema Extension](/references/route-schema#extension)), and route service provides a way to manage extension.

When the route is matched, accessing an extension value will first access the correspondent value on the service instance. It the key does not exist on the service instance, it will then fallback to the `$extension` object provided by route schema.

Note only value with keys predefined in `$extension` (using `Object.keys()`) can be accessed through this mechanism.

E.g.:

```ts
const route = router.$route({
  user: {
    $children: {
      userId: {
        $match: /\d+/,
        $extension: {
          user: undefined! as User,
        },
      },
    },
  },
});

route.user.userId.$service(() => new UserIdRouteService());

type UserIdRoute = typeof route.user.userId;

class UserIdRouteService implements IRouteService<UserIdRoute> {
  @observable
  user!: User;

  willEnter(next: UserIdRoute['$next']): void {
    this.user = new User(next.$params.userId);
  }

  afterLeave(): void {
    this.user = undefined!;
  }
}
```

Thus we can easily access the `user` elsewhere. For example within route content:

```tsx
<Route match={route.user.userId}>
  {match => <div>Hello, user {match.user.displayName}.</div>}
</Route>
```
