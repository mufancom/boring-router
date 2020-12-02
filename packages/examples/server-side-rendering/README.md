# Server-Side Rendering Example

```ts
async function render(): Promise<string> {
  let history = new MemoryHistory({
    initialRef: ctx.path,
  });

  let router = new Router(history);

  let route = router.$route(ROUTE_SCHEMA);

  // Wait till route settled.
  // We can use life-cycle hooks like `willEnter` to load data during this phase.
  // See:
  // - https://makeflow.github.io/boring-router/references/lifecycle-hooks
  // - https://makeflow.github.io/boring-router/references/service
  await when(() => !router.$routing);

  return renderToString(<App router={router} route={route} />);
}
```
