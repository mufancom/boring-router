# Server-Side Rendering Example

```ts
import {MemoryHistory, Router} from 'boring-router';
import {when} from 'mobx';
import {renderToString} from 'react-dom/server';

import {App} from '...';

export async function render(path: string): Promise<string> {
  // Use `MemoryHistory` instead of `BrowserHistory` and pass in initial ref.
  let history = new MemoryHistory({
    initialRef: path,
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
