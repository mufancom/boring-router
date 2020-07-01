---
menu: References
name: Ref & HRef
route: /references/ref-href
---

# Ref & HRef

## Overview

Both `$ref()` and `$href()` are representations of specific routes in Boring Router, but they are different in terms of their scopes. `$ref()` is the representation within the scope of a router, while `$href()` is the representation within the scope of the full location path.

## Examples

| href                                    | prefix | ref                                                                                                                                        |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/workbench`                            | -      | `/workbench`                                                                                                                               |
| `/app/workbench`                        | `/app` | `/workbench`                                                                                                                               |
| `/app/workbench?_sidebar=/achievements` | `/app` | `/workbench` (primary route)<br />`?_sidebar=/achievements` (parallel sidebar route)<br />`/workbench?_sidebar=/achievements` (all routes) |

## Best Practices

| Scenario                                              | Best Practice                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-side redirection                               | Use `$href()`                                                                                                                                                  |
| Server generated location for client-side redirection | Use `$href()` + `history.navigate()`                                                                                                                           |
| Client-side redirection                               | Prefer `$ref()` + `$push()`/`$replace()` or `history.push()`/`history.replace()`<br />For cross-router navigation use `$href()` + `history.navigate()` instead |
