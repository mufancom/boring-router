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
import {observer} from 'mobx-react-lite';
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

## License

MIT License.
