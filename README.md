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
import {observer} from 'mobx';
import {createBrowserHistory} from 'history';
import React, {Component} from 'react';

const history = createBrowserHistory();

const router = new Router(
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

## License

MIT License.
