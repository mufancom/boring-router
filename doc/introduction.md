---
name: Introduction
route: /
---

# Introduction

Boring Router is a state-first router with light-weight route components. It manages observable (MobX) route states like `route.$matched` and `route.$params`, so the route components as well as your code can react to those states. Boring Router is written in TypeScript and it puts type safety in mind designing the API.

> Check out examples [here](/examples).

## Route Notation

Boring Router uses schema-based, type-safe route notation. You don't need, and it is not recommended to write routes as strings with Boring Router.

```ts
const route = router.$route({
  $children: {
    workbench: {
      $children: {
        taskId: {
          $match: /\d+/,
        },
      },
    },
  },
});
```

```tsx
<Route match={route.workbench.taskId} component={WorkbenchTaskView} />
```

```tsx
<Link to={route.workbench.taskId} params={{taskId: '123'}}>
  Go to Task
</Link>
```

Route schema can be shared with Node.js backend and this makes route notations type-safe everywhere.

## Parallel Routes

Views like sidebar, overlay can be easily routed with Boring Router parallel routes.

```ts
const route = router.$route({
  /* primary route schema */
});

const sidebarRoute = router.$route('sidebar', {
  /* sidebar route schema */
});
```

URL for parallel routes looks like `/workbench?_sidebar=/notifications`, and additional parallel routes work just like primary route in most cases.

## Lifecycle Hooks

Boring Router supports `before/will/after` x `enter/update/leave` hooks.

```ts
route.workbench.$beforeEnter(async next => {
  let {referrer} = next.$params;

  if (await testReferrer(referrer)) {
    return;
  }

  route.$replace();
});
```

To support full lifecycle hooks while keeping history navigation behavior right, Boring Router implements its own `BrowserHistory` with the ability to restore browser history stack according to a given snapshot.

> Check out an example <a href="https://codesandbox.io/s/github/makeflow/boring-router/tree/master/packages/examples/lifecycle-hooks?file=/main.tsx&amp;expanddevtools=1" target="_blank" >here</a>.
