# Changelog

## 0.3.0 - unreleased

### Breaking changes

- The router will no longer match parent if it has no matching child.
- By default, the router will no longer match a route if it has children but the path is ended at the route itself. For example, if the path is `/account`, and route `account` has `$children`, `account` will not be matched by default. An option `$exact` is added for this scenario, and applies only to route schema with `$children`.
- `RouteMatch#$action` has been replaced with `RouteMatch#$react`.

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
