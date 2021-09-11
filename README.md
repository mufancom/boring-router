[![NPM Package](https://badge.fury.io/js/boring-router.svg)](https://www.npmjs.com/package/boring-router)
[![Build Status](https://travis-ci.org/makeflow/boring-router.svg?branch=master)](https://travis-ci.org/makeflow/boring-router)

# Boring Router

A type-safe MobX router with parallel routing support.

- [Examples](https://makeflow.github.io/boring-router/examples)
- [Documentation](https://makeflow.github.io/boring-router/) | [中文文档](https://www.yuque.com/makeflow/boring-router/introduction)

## Introduction

Boring Router is a state-first router with light-weight route components. It manages observable (MobX) route states like `route.$matched` and `route.$params`, so the route components as well as your code can react to those states. Boring Router is written in TypeScript and it puts type safety in mind designing the API.

## Installation

```bash
# Install dependencies if you haven't
yarn add react react-dom mobx mobx-react-lite

# Install Boring Router packages
yarn add boring-router boring-router-react
```

## Usage

```tsx
import {Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  $children: {
    workbench: true,
    userSettings: true,
    notFound: {
      $match: /.*/,
    },
  },
});

const App = observer(() => {
  return (
    <>
      <ul>
        <li>
          <Link to={route}>Home</Link>
        </li>
        <li>
          <Link to={route.workbench}>Workbench</Link>
        </li>
        <li>
          <Link to={route.userSettings}>User Settings</Link>
        </li>
      </ul>
      <hr />
      <Route exact match={route} component={HomeView} />
      <Route match={route.workbench} component={WorkbenchView} />
      <Route match={route.userSettings} component={UserSettingsView} />
      <Route match={route.notFound} component={NotFoundView} />
    </>
  );
});

ReactDOM.render(<App />, document.getElementById('app'));
```

## Features

- **Schema-based, type-safe route notation.**

  You don't need, and it is not recommended to write routes as strings with Boring Router. Route schema can be shared with Node.js backend and this makes route notations type-safe everywhere.

  Unlike most of other schema-based router, how to use the observable route states to render the view is completely under your control: you can use it with the built-in `Route` component, or simply compose rendering condition with the route states in your own components.

- **Parallel routes that makes different views route-trackable.**

  Views like sidebar and overlay can be easily routed with Boring Router parallel routes.

  URL for parallel routes looks like `/workbench?_sidebar=/notifications`, and additional parallel routes work just like primary route in most cases.

- **Powerful and complete lifecycle hooks.**

  Boring Router supports `before/will/after` x `enter/update/leave` hooks.

  To support full lifecycle hooks while keeping history navigation behavior right, Boring Router implements its own `BrowserHistory` with the ability to restore browser history stack according to a given snapshot.

- **Server-side rendering.**

  Boring Router by its nature supports SSR. By using life-cycle hooks (usually asynchronous `willEnter` hook) and route services, we can easily achieve asynchronous content loading.

## License

MIT License.
