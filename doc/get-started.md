---
name: Get Started
route: /get-started
---

# Get Started

## Installation

```bash
# Install dependencies if you haven't
yarn add react react-dom mobx mobx-react-lite

# Install Boring Router packages
yarn add boring-router boring-router-react
```

## Setup a router

```ts
import {Router} from 'boring-router';
import {BrowserHistory} from 'boring-router-react';

const history = new BrowserHistory();

const router = new Router(history);
```

## Create primary route

```ts
const route = router.$route({
  $children: {
    // Match `/workbench`.
    workbench: true,
    // Match `/user-settings`.
    userSettings: true,
    // Match the rest.
    notFound: {
      $match: /.*/,
    },
  },
});
```

## Add some route components

```tsx
import {Route, Link} from 'boring-router-react';
import {observer} from 'mobx-react';
import React from 'react';
import ReactDOM from 'react-dom';

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
