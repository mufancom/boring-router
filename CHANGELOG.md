# Changelog

## [0.5.1] - 2021-10-15

### Changes

- Fixed `$rest` with parent route match returning the parent route match instead of the deepest descendant.

## [0.5.0] - 2021-9-12

### Breaking changes

- Upgraded to MobX 6.

## [0.4.6] - 2021-1-5

### Changes

- Keep matched rest segment building referring route.

## [0.4.4] - 2020-11-30

### Changes

- Added prefix for `MemoryHistory`.

## [0.4.0] - 2020-7-7

### Breaking changes

- Treat `/foo/bar/` as `/foo/bar`.
- `Route#$route()` method now accepts a route schema similar to what for a child route except for `$match` option.

## [0.3.13] - 2020-7-6

### Changes

- Added hooks `$before/will/afterEnter`, `$before/will/afterUpdate`, `$before/will/afterLeave`; added `$before/will/afterEnterOrUpdate` as shortcut for `$before/will/afterEnter` and `$before/will/afterUpdate`.
- Added service `$service`.
- Added parallel routes.
- Added `RouteBuilder`.
- Added `$metadata` support.

### Breaking changes

- `Router.create()` is removed in favor of `new Router().$route()`.
- Names related to `fragment` has been changed to `segment`.
- The router will no longer match parent if it has no matching child.
- By default, the router will no longer match a route if it has children but the path is ended at the route itself. For example, if the path is `/account`, and route `account` has `$children`, `account` will not be matched by default. An option `$exact` is added for this scenario, and applies only to route schema with `$children`.
- `RouteMatch#$action` has been removed, see hooks for alternatives.
- The second argument `RouteMatch#$ref()`, `RouteMatch#$push()`, `RouteMatch#$replace()` methods is now an option object.
- Route match ref option `preserveQuery` is now removed, but the behavior has changed to preserve query defined with `$query` (and its parents).
- The return value of route hooks (such as `RouteMatch#$beforeEnter`, `RouteMatch#$afterLeave`) is now a removal callback.
- `<Redirect>` component has been removed.`

## [0.2.1] - 2018-9-5

### Changes

- Added `<NavLink>` component.

## [0.2.0] - 2018-9-2

### Changes

- `<Link>` component now does `history.push()` by default. A new boolean parameter `replace` is added to override the behavior with `history.replace()`.
- `<Redirect>` component now does `history.replace()` by default. A new boolean parameter `push` is added to override the behavior with `history.push()`.

### Breaking Changes

- `<Link>` and `<Redirect>` component now supports only `RouteMatch` as value of `to` parameter, and `<HistoryProvider>` is now removed.
- `$navigate` method of `RouteMatch` is now removed in favor of `$push` and `$replace`.
- `<Redirect>` component no longer accepts `match` parameter with type boolean.

[0.2.1]: https://github.com/makeflow/boring-router/releases/tag/v0.2.1
[0.2.0]: https://github.com/makeflow/boring-router/releases/tag/v0.2.0
