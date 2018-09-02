# Changelog

## [0.2.0] - 2018-9-2

### Changes

- `<Link>` component now does `history.push()` by default. A new boolean parameter `replace` is added to override the behavior with `history.replace()`.
- `<Redirect>` component now does `history.replace()` by default. A new boolean parameter `push` is added to override the behavior with `history.push()`.

### Breaking Changes

- `<Link>` and `<Redirect>` component now supports only `RouteMatch` as value of `to` parameter, and `<HistoryProvider>` is now removed.
- `$navigate` method of `RouteMatch` is now removed in favor of `$push` and `$replace`.
- `<Redirect>` component no longer accepts `match` parameter with type boolean.

[0.2.0]: https://github.com/makeflow/boring-router/releases/tag/v0.2.0
