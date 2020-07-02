[![NPM Package](https://badge.fury.io/js/boring-router.svg)](https://www.npmjs.com/package/boring-router)
[![Build Status](https://travis-ci.org/makeflow/boring-router.svg?branch=master)](https://travis-ci.org/makeflow/boring-router)

# Boring Router

A type-safe, yet reactive router using MobX.

[Documentation](https://makeflow.github.io/boring-router/)

## Installation

```shell
# Install dependencies if you haven't
yarn add react react-dom mobx mobx-react-lite

# Install Boring Router packages
yarn add boring-router boring-router-react
```

## Introduction

Boring Router is a state-first router with light-weight route components. It manages observable (MobX) route states like `route.$matched` and `route.$params`, so the route components as well as your code can react to those states. Boring Router is written in TypeScript and it puts type safety in mind designing the API.

### Route Notation

Boring Router uses schema-based, type-safe route notation. You don't need, and it is not recommended to write routes as strings with Boring Router.

Route schema can be shared with Node.js backend and this makes route notations type-safe everywhere.

### Parallel Routes

Views like sidebar, overlay can be easily routed with Boring Router parallel routes.

URL for parallel routes looks like `/workbench?_sidebar=/notifications`. Additional parallel routes work like primary route except that it does not have dedicated query strings.

### Lifecycle Hooks

Boring Router supports `before/will/after` x `enter/update/leave` hooks.

To support full lifecycle hooks while keeping history navigation behavior right, Boring Router implements its own `BrowserHistory` with the ability to restore browser history stack according to a given snapshot.

## Usage

```tsx
import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React, {Component} from 'react';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  account: true,
  about: true,
  notFound: {
    $match: RouteMatch.REST,
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

## License

MIT License.
