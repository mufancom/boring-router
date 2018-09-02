# Changelog

## [Unreleased]

### Changes

- `<Link>` component now do `history.push()` by default. A new boolean parameter `replace` is added to override the behavior with `history.replace()`.
- `<Redirect>` component now do `history.replace()` by default. A new boolean parameter `push` is added to override the behavior with `history.push()`.

### Breaking Changes

- `<Link>` and `<Redirect>` component now support only `RouteMatch` as value of `to` parameter, and `<HistoryProvider>` is now removed.
- `$navigate` method of `RouteMatch` is now removed in favor of `$push` and `$replace`.
- `<Redirect>` component no longer accept `match` parameter with type boolean.
