[![NPM Package](https://badge.fury.io/js/boring-router.svg)](https://www.npmjs.com/package/boring-router)
[![Build Status](https://travis-ci.org/makeflow/boring-router.svg?branch=master)](https://travis-ci.org/makeflow/boring-router)

# Boring Router

A light-weight, type-safe, yet reactive router service using MobX.

## Why

There are multiple reasons pushing me to write Boring Router instead of sticking with React Router.

- Making React Router work with a global store/service is not straightforward. Having to parse location twice with the same schema defined with two different approaches looks redundant to me.
- React Router (and many other alternatives) provides basically no type safety between path schema and match result. And you have to write `to` as strings in links.
- People can easily write ambiguous path schema without it bringing them attention.
- I think I've got a nice idea. 😉

## Installation

```sh
# peer dependencies
yarn add history react mobx mobx-react

# boring router package
yarn add boring-router
```

## Usage

```tsx
import {Link, Route, RouteMatch, Router} from 'boring-router';
import {observer} from 'mobx-react';
import {createBrowserHistory} from 'history';
import React, {Component} from 'react';

const history = createBrowserHistory();

const router = Router.create(
  {
    account: true,
    about: true,
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history,
);

@observer
class App extends Component {
  render() {
    return (
      <>
        <Route match={router.account}>
          Account page
          <hr />
          <Link to={router.about}>About</Link>
        </Route>
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
  $children?: RouteSchemaDict;
}
```

Two pre-defined `$match` regular expression is available as `RouteMatch.fragment` (`/[^/]+/`) and `RouteMatch.rest` (`/.+/`).

A `schema` wrapper function is available to make TypeScript intellisense happier for separated schema definition:

```ts
function schema<T extends RouteSchemaDict>(schema: T): T;
```

## Route match

The value of expression like `router.account` in the usage example above is a `RouteMatch`, and it has the following reactive properties and methods:

```ts
interface RouteMatch<TParamDict> {
  $matched: boolean;
  $exact: boolean;
  $params: TParamDict;

  $ref(params?: Partial<TParamDict>, preserveQuery?: boolean): string;
  $push(params?: Partial<TParamDict>, preserveQuery?: boolean): string;
  $replace(params?: Partial<TParamDict>, preserveQuery?: boolean): string;
  $action(action: RouteMatchAction, exact?: boolean): string;
}
```

## Examples

### Example list

- [Basic](examples/basic/main.tsx)

  Basic usage.

  ```tsx
  <Route match={router.account}>
    <p>Account page</p>
  </Route>
  ```

- [Exact](examples/exact/main.tsx)

  Match exact path.

  ```tsx
  <Route match={router.account} exact>
    <p>Exact account page</p>
  </Route>
  ```

- [Fragment](examples/fragment/main.tsx)

  Boring Router's version of `/account/:id` alike parameter.

  ```tsx
  <Link to={router.account.id} params={{id: '123'}}>
    Account 123
  </Link>
  ```

  ```tsx
  <Route match={router.account.id}>
    <p>Account {router.account.id.$params.id} details page</p>
  </Route>
  ```

- [Query](examples/query/main.tsx)

  Handle query string parameter.

  ```tsx
  <Link to={router.account} params={{id: '123'}}>
    Account 123
  </Link>
  ```

  ```tsx
  <Route match={router.account}>
    <p>Account {router.account.$params.id} details page</p>
  </Route>
  ```

- [Redirect](examples/redirect/main.tsx)

  Redirect on match.

  ```tsx
  <Redirect match={router.notFound} to={router.account} params={{id: '123'}} />
  ```

- [Function as Child](examples/function-as-child/main.tsx)

  Use `<Route />` with a function child.

  ```tsx
  <Route match={router.account}>
    {match => <p>Account {match.$params.id} details page</p>}
  </Route>
  ```

- [Route Component](examples/route-component/main.tsx)

  Use `<Route />` with a route component.

  ```tsx
  <Route match={router.account} component={AccountPage} />
  ```

  ```tsx
  <Route match={match.details}>
    <p>Account {match.$params.id} details page</p>
  </Route>
  ```

- [Multiple Route Match](examples/multi-route-match/main.tsx)

  Match with multiple route match for shared content.

  ```tsx
  <Route
    match={[router.account.signUp, router.account.resetPassword]}
    component={AccountPage}
  />
  ```

### Run an example

```sh
yarn install
yarn build

yarn global add parcel

parcel examples/[name]/index.html
```

## License

MIT License.
