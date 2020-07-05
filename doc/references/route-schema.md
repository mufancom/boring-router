---
menu: References
name: Route Schema
route: /references/route-schema
---

# Route Schema

## Overview

Boring Router defines routes by tree-structure route schemas:

```ts
const route = router.$route({
  account: {
    $children: {
      accountId: {
        $match: /\d+/,
        $children: {
          profile: {
            $query: {
              'show-comment': true,
            },
          },
          contact: true,
        },
      },
    },
  },
});
```

The route defined above matches paths like below:

```
/account/123/profile
/account/123/profile?show-comment=on
/account/456/contact
```

And it creates route objects (`RouteMatch`) that can be accessed using:

```ts
route;
route.account;
route.account.accountId;
route.account.accountId.profile;
route.account.accountId.contact;
```

To get a parameter (including segment parameter and query string) from a route, we need to access `$params` of the target route object.

In this case, to get `accountId`, we need to use `route.account.accountId.$params.accountId`. This might look a little bit weird at the beginning (maybe forever), but it's also reasonable: because `accountId` (the segment parameter) is one of the properties of route `route.account.accountId`, and its name by convention is the same as the route key.

We can also get the parameter from a child route object, e.g.: `route.account.accountId.profile.$params.accountId`.

## Match

By adding a child under schema root or `$children`, we create a `RouteMatch` for the correspondent segment:

```ts
const route = router.$route({
  // Simply use `true` for default options.
  workbench: true,
  // Specify route options with an object.
  settings: {
    $match: /boring/,
    $children: {
      security: true,
      notification: true,
    },
  },
});
```

### Segment Match

By default, Boring Router matches a segment according to the "hyphenated" string of the route key.

```ts
const route = router.$route({
  // This matches `/user-settings`.
  userSettings: true,
});
```

To match another fixed string, we may add a string `$match` option:

```ts
const route = router.$route({
  // This matches `/settings`.
  userSettings: {
    $match: 'settings',
  },
});
```

To make the segment a segment parameter, we may add `$match` option as regular expression:

```ts
const route = router.$route({
  // This matches both `/settings` and `/user-settings`.
  userSettings: {
    $match: /(?:user-)?settings/,
  },
});
```

And now we can get the actual matched segment by `route.userSettings.$params.userSettings`.

Please note that the regular expression must match the whole string of a segment. Assuming the path is `/settings-suffix`, even though `/(?:user-)?settings/.test('settings-suffix')` is true, but it won't match the route because the regular expression matches only `settings` instead of the whole segment `settings-suffix`.

### Exact Match

For route with children, by default it ignores the exact match. This means that the route previously defined does not match paths like:

```
/account
/account/123
```

To allow exact match for those parent routes, we need to set `$exact` as `true` respectively.

```ts
const route = router.$route({
  account: {
    $exact: true,
    $children: {
      /* ... */
    },
  },
});
```

### Exact Match Default

Sometimes we might want a default child route to act as matched if its parent is exactly matched. E.g., for settings pages `/settings/user` and `/settings/organization`, we might want an exact match of `/settings` to act as if `/settings/user` is matched. And we may specify a string value for `$exact` to achieve that:

```ts
const route = router.$route({
  settings: {
    $exact: 'user',
    $children: {
      user: true,
      organization: true,
    },
  },
});
```

Note this value is not specified according to the key but the path segment. So if the key of the child route is `awesomeUser`, the `$exact` value should be `awesome-user` with default configuration.

## Query

The ability of handling query string in Boring Router is limited for now. It has some handy usages, but all `$query` definition is handled as optional strings without validations.

> This problem can be partially solved by [Extension](/references/route-schema#extension) & [Service](/references/service#managed-extension).

To get access to a specific query string, just add `$query` options and set a `true` value of the desired key:

```ts
const route = router.$route({
  account: {
    $query: {
      group: true,
      id: true,
    },
    $children: {
      profile: true,
    },
  },
});
```

Just like segment parameter, we can get a query string from `$params`. In this case, from both the route declaring the query string and its child route:

```ts
route.account.$params.group;
route.account.$params.id;
route.account.profile.$params.group;
route.account.profile.$params.id;
```

### Query String Preservation

By default, route builder (when you click a `<Link>` or trigger `RouteMatch#$ref()` directly or indirectly) keeps query strings declared at the next matching route when creating a new "ref" for navigation. Think of the example below:

```ts
const route = router.$route({
  account: {
    $query: {
      source: true,
    },
  },
  about: {
    $query: {
      source: true,
    },
  },
});
```

If the current route matches `/account?source=123`, the result of `route.about.$ref()` would be `/about?source=123`.

We can provide specific query IDs for different queries to achieve more accurate query string preservation:

```ts
const route = router.$route({
  account: {
    $query: {
      source: 'account-source',
    },
  },
  about: {
    $query: {
      source: 'about-source',
    },
  },
});
```

A query ID could be either a string or a symbol. If `true` is provided, it will always preserve query string with the same key or be preserved by other query string with the same key.

## Metadata

You may add metadata to a specific route and its child route will automatically inherit the metadata.

For example:

```ts
const route = router.$route({
  user: {
    $metadata: {
      title: 'User',
    },
    $exact: true,
    $children: {
      settings: {
        $metadata: {
          subTitle: 'Settings',
        },
      },
    },
  },
  workbench: {
    $metadata: {
      title: 'Workbench',
    },
  },
});

route.user.$metadata; // {title: 'User'}
route.user.settings.$metadata; // {title: 'User', subTitle: 'Settings'}
```

Then we can use the metadata to update page title once the route changes:

```ts
route.$afterEnterOrUpdate(
  () => {
    let {title, subTitle} = route.$rest.$metadata as {
      title: string;
      subTitle?: string;
    };

    document.title = `${subTitle ? `${subTitle} | ` : ''}${title}`;
  },
  {traceDescendants: true},
);
```

## Extension

Boring Router provides a way to add addition property to a specific route through `$extension` route option:

```ts
const route = router.$route({
  user: {
    $query: {
      id: true,
    },
    $extension: {
      get user() {
        return new User(route.user.$params.id);
      },
    },
  },
});
```

One of our common use case is just to provide type information with `$extension` and later have a route service to manage the actual value, with which more options are provided.

```ts
const route = router.$route({
  user: {
    $query: {
      id: true,
    },
    $extension: {
      user: undefined! as User,
    },
  },
});

route.user.$service(match => new UserRouteService(match));

type UserRoute = typeof route.user;

class UserRouteService implements IRouteService<UserRoute> {
  @observable
  user!: User;

  constructor(private match: UserRoute) {}

  async willEnter(next: UserRoute['$next']): Promise<void> {
    this.user = await getUser(next.$params.id);
  }

  afterLeave(): void {
    this.user = undefined!;
  }
}
```

> Checkout [Service](/references/service) for more information.
