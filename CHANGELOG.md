# Changelog

## 0.3.0 - unreleased

### Changes

- Added hooks `$beforeEnter`, `$afterEnter`, `$beforeUpdate`, `$afterUpdate`, `$beforeLeave` and `$afterLeave`; added `$intercept` as shortcut for `$beforeEnter` and `$beforeUpdate`; added `$react` as shortcut for `$afterEnter` and `$afterUpdate`.
- Added service `$service`.
- Added parallel routes.

### Breaking changes

- Names related to `fragment` has been changed to `segment`.
- The router will no longer match parent if it has no matching child.
- By default, the router will no longer match a route if it has children but the path is ended at the route itself. For example, if the path is `/account`, and route `account` has `$children`, `account` will not be matched by default. An option `$exact` is added for this scenario, and applies only to route schema with `$children`.
- `RouteMatch#$action` has been removed, see hooks for alternatives.
- The second argument `RouteMatch#$ref()`, `RouteMatch#$push()`, `RouteMatch#$replace()` methods is now an option object.
- Route match ref option `preserveQuery` now defaults to `true`, but the behavior has changed to preserve query defined with `$query` (and its parents).
- The return value of route hooks(Such as `RouteMatch#$beforeEnter`, `RouteMatch#$afterLeave`) is now a removal callback.

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
