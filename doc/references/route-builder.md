---
menu: References
name: Route Builder
route: /references/route-builder
---

# Route Builder

## Overview

Route builder (`RouteBuilder`) is the way to create combinations of parallel routes and generate refs and hrefs in Boring Router.

> Learn more about "ref" and "href" in Boring Router [here](/references/ref-href).

We can get a route builder from different objects with different preset context:

- `router.$(...)` create a route builder with:
  1. router context and current states.
  2. a given building part.
- `router.$scratch()` create a route builder with router context without current states.
- `route.$(...)` create a route builder with:
  1. router context and current states.
  2. `route` and the parameter as a given building part.

We can concatenate multiple building part with `$()` method under `RouteBuilder`, e.g.:

```ts
router
  .$(route, {mode: 'default'})
  .$(overlayRoute.task.taskId, {taskId: '123'})
  .$push();
```

Similar to `RouteMatch`, `RouteBuilder` also has methods including `$ref()`, `$href()`, `$push()` and `$replace()`.
