# Boring Router

A light-weight yet reactive router service using MobX.

## Installation

```sh
# peer dependencies
yarn add history react mobx mobx-react

# boring router package
yarn add boring-router
```

## Usage

```tsx
import {Route, Router} from 'boring-router';
import {observer} from 'mobx-react';
import {createBrowserHistory} from 'history';
import React, {Component} from 'react';

const history = createBrowserHistory();

const router = Router.create(
  {
    account: true,
    about: true,
    notFound: {
      $match: '**',
    },
  },
  history,
);

@observer
class App extends Component {
  render() {
    return (
      <>
        <Route match={router.account}>Account page</Route>
        <Route match={router.about}>About page</Route>
        <Route match={router.notFound}>Not found</Route>
      </>
    );
  }
}
```

## Schema

Boring Router defines routes via a tree-structure schema:

```ts
type RouteSchemaDict = Dict<RouteSchema | boolean>;

interface RouteSchema {
  $match?: string | RegExp;
  $query?: Dict<boolean>;
  $children?: Dict<RouteSchema | boolean>;
}

const schema: RouteSchemaDict = {};
```

## Examples

- [basic](examples/basic)
- [exact](examples/exact)
- [fragment](examples/fragment)
- [query](examples/query)
- [route-component](examples/route-component)
- [link](examples/link)

###

## License

MIT License.
