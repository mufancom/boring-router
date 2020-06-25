[![NPM Package](https://badge.fury.io/js/boring-router.svg)](https://www.npmjs.com/package/boring-router)
[![Build Status](https://travis-ci.org/makeflow/boring-router.svg?branch=master)](https://travis-ci.org/makeflow/boring-router)

# Boring Router

A type-safe, yet reactive router using MobX.

## Introduction

Boring Router is a state-first router with light-weight route components. It manages observable (MobX) route states like `route.$matched` and `route.$params`, so the route components as well as your code can react to those states. Boring Router is written in TypeScript and it puts type safety in mind designing the API.

## Features

- **Schema-based, type-safe route representation**: You don't need, and it is not recommended to write routes as strings with Boring Router. Route schema can be shared with Node.js backend and this makes route representations type-safe everywhere.
- **Parallel routes support**: Views like sidebar, overlay can be easily routed with Boring Router parallel routes. Parallel routes can be manipulated separately for different views.
- **Full life-cycle hooks support**: Boring Router implements its own `BrowserHistory` with the ability to restore browser history stack according to a given snapshot. This makes it possible to support full life-cycle hooks while keeping history navigation behavior right.

## Installation

```sh
# peer dependencies
yarn add react mobx mobx-react

# boring router packages
yarn add boring-router
yarn add boring-router-react
```

## Usage

```tsx
import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react';
import React, {Component} from 'react';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  account: true,
  about: true,
  notFound: {
    $match: RouteMatch.rest,
  },
});

@observer
class App extends Component {
  render() {
    return (
      <>
        <Route match={route.account}>
          Account page
          <hr />
          <Link to={route.about}>About</Link>
        </Route>
        <Route match={route.about}>About page</Route>
        <Route match={route.notFound}>Not found</Route>
      </>
    );
  }
}
```

## Examples

### Example list

- [Basic](packages/boring-router-react/examples/basic/main.tsx)

  Basic usage.

  ```tsx
  <Route match={route.account}>
    <p>Account page</p>
  </Route>
  ```

- [Exact](packages/boring-router-react/examples/exact/main.tsx)

  Match exact path.

  ```tsx
  <Route match={route.account} exact>
    <p>Exact account page</p>
  </Route>
  ```

- [Segment](packages/boring-router-react/examples/segment/main.tsx)

  Boring Router's version of `/account/:id` alike parameter.

  ```tsx
  <Link to={route.account.id} params={{id: '123'}}>
    Account 123
  </Link>
  ```

  ```tsx
  <Route match={route.account.id}>
    <p>Account {route.account.id.$params.id} details page</p>
  </Route>
  ```

- [Query](packages/boring-router-react/examples/query/main.tsx)

  Handle query string parameter.

  ```tsx
  <Link to={route.account} params={{id: '123'}}>
    Account 123
  </Link>
  ```

  ```tsx
  <Route match={route.account}>
    <p>Account {route.account.$params.id} details page</p>
  </Route>
  ```

- [Redirect](packages/boring-router-react/examples/redirect/main.tsx)

  Redirect on match.

  ```tsx
  <Redirect match={route.notFound} to={route.account} params={{id: '123'}} />
  ```

- [NavLink](packages/boring-router-react/examples/nav-link/main.tsx)

  Like `<Link>` but will add a class name if `to` matches.

  ```tsx
  <NavLink to={route.account}>Account</NavLink>
  ```

- [Function as Child](packages/boring-router-react/examples/function-as-child/main.tsx)

  Use `<Route />` with a function child.

  ```tsx
  <Route match={route.account}>
    {match => <p>Account {match.$params.id} details page</p>}
  </Route>
  ```

- [Route Component](packages/boring-router-react/examples/route-component/main.tsx)

  Use `<Route />` with a route component.

  ```tsx
  <Route match={route.account} component={AccountPage} />
  ```

  ```tsx
  <Route match={match.details}>
    <p>Account {match.$params.id} details page</p>
  </Route>
  ```

- [Multiple Route Match](packages/boring-router-react/examples/multi-route-match/main.tsx)

  Match with multiple route match for shared content.

  ```tsx
  <Route
    match={[route.account.signUp, route.account.resetPassword]}
    component={AccountPage}
  />
  ```

- [Parallel Routes](packages/boring-router-react/examples/parallel-routes/main.tsx)

  Match parallel routes for separate views.

  ```tsx
  <Route match={primaryRoute.account} component={AccountPage} />
  <Route match={popupRoute.popup} component={PopupView} />
  ```

- [Hooks](packages/boring-router-react/examples/hooks/main.tsx)

  Add hooks to route match.

  ```tsx
  route.account.$beforeEnter(() => {
    route.about.$push();
  });
  ```

- [Service](packages/boring-router-react/examples/service/main.tsx)

  Add service to route match.

  ```tsx
  route.account.$service(match => new AccountRouteService(match));
  ```

### Run an example

Clone this project and run the following commands:

```sh
yarn install
yarn build

yarn global add parcel-bundler

parcel examples/[name]/index.html
```

## License

MIT License.
