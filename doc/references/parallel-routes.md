---
menu: References
name: Parallel Routes
route: /references/parallel-routes
---

# Parallel Routes

## Overview

We can define multiple routes parallel to each other within a single web app using Boring Router. Let's look at a URL with parallel routes:

```
/workbench?_overlay=/task/123&mode=default
```

- The first part of the URL is `/workbench`, which is the path of the primary route.
- The second part is `_overlay=/task/123`, which includes the name and path of the parallel route `overlay`.
- The third part is `mode=default`, which is **shared** between parallel routes.

Creating parallel routes in Boring Router is simple:

```ts
const route = router.$({
  workbench: {
    $query: {
      mode: true,
    },
  },
  settings: true,
});

const overlayRoute = router.$('overlay', {
  task: {
    $children: {
      taskId: {
        $match: /\d+/,
      },
    },
  },
});
```

Navigation using a route object is by default independent to its parallel routes. This means if we call `route.settings.$push()` with URL `/workbench?_overlay=/task/123&mode=default`, it will navigate to `/settings?_overlay=/task/123` while keeping the `overlay` route untouched.

## Combining Multiple Routes

Most of the time having routes independent to each other brings convenience, there are still scenarios in which we need to put them together. For example sometimes we might want to navigate with both routes. This can be done with `RouteBuilder`, e.g.:

```ts
route.workbench.$(overlayRoute.task.taskId, {taskId: 456}).$push();
```

Check out [Route Builder](/references/route-builder) for more information.

## Experimental Whitelist

Parallel routes currently support an experimental whitelist feature, check out the source code for more information.
