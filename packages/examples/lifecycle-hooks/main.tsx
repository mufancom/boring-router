import 'mobx-react-lite/batchingForReactDom';

import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  home: {
    $match: '',
  },
  redirect: {
    $children: {
      target: {
        $match: RouteMatch.SEGMENT,
      },
    },
  },
  revert: true,
  account: {
    // For route with children, exact match is by default ignored. Make
    // `$exact` true to enable exact match.
    $exact: true,
    $children: {
      accountId: {
        $match: RouteMatch.SEGMENT,
      },
    },
  },
  about: true,
  notFound: {
    $match: RouteMatch.REST,
  },
});

// route //

route.$beforeEnterOrUpdate(
  next => {
    console.info('route.$beforeEnterOrUpdate');
    console.info(`  ${route.$rest.$ref()} -> ${next.$rest.$ref()}`);
  },
  {traceDescendants: true},
);

// route.account //

route.account.$beforeEnter(() => {
  console.info('route.account.$beforeEnter');
});

route.account.$willEnter(() => {
  console.info('route.account.$willEnter');
});

route.account.$afterEnter(() => {
  console.info('route.account.$afterEnter');
});

// Navigation from `/account/1` to `/account/2` will not trigger the 3 update
// hooks below, but `/account` to `/account/1` or vice versa will. This is
// because the `accountId` part is not on `account`, but `/account` to
// `/account/1` would change the fact that whether `account` is an exact match.

route.account.$beforeUpdate(() => {
  console.info('route.account.$beforeUpdate');
});

route.account.$willUpdate(() => {
  console.info('route.account.$willUpdate');
});

route.account.$afterUpdate(() => {
  console.info('route.account.$afterUpdate');
});

route.account.$beforeLeave(() => {
  console.info('route.account.$beforeLeave');
});

route.account.$willLeave(() => {
  console.info('route.account.$willLeave');
});

route.account.$afterLeave(() => {
  console.info('route.account.$afterLeave');
});

// route.account.accountId //

route.account.accountId.$beforeUpdate(async () => {
  // It's safe to have asynchronous before hooks with Boring Router, because we
  // can restore the history stack afterwards.

  console.info('route.account.accountId.$beforeUpdate');

  await new Promise(resolve => setTimeout(resolve, 100));

  return confirm('route.account.accountId.$beforeUpdate');
});

route.account.accountId.$beforeLeave(async () => {
  console.info('route.account.accountId.$beforeLeave');

  await new Promise(resolve => setTimeout(resolve, 100));

  return confirm('route.account.accountId.$beforeLeave');
});

// route.redirect.target //

// Redirect `/redirect/:target`.
route.redirect.target.$beforeEnter(next => {
  // At this point, the route states were yet to be updated. To access new
  // information like the navigating params, we should use the `next` object.

  switch (next.$params.target) {
    // Use the `$next` object if you need information (like queries and
    // segment values) from the new states to be applied. It is also
    // recommended to use `$next` most of the cases inside a `before/will` x
    // `enter/update`.
    case 'account':
      route.$next.account.$replace();
      break;
    case 'about':
      route.$next.about.$replace();
      break;
    default:
      route.$next.home.$replace();
      break;
  }
});

// route.revert //

// Always cancel navigation to `/revert`.
route.revert.$beforeEnter(() => false);

///

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <p>
      Try "Account" -&gt; "Account 1" -&gt; "Account 2" -&gt; "Redirect to
      About"
    </p>
    <nav>
      <Link to={route.home}>Home</Link>
      {' | '}
      <Link to={route.account}>Account</Link>
      {' | '}
      <Link to={route.about}>About</Link>
      {' | '}
      <Link to={route.revert}>Revert</Link>
      {' | '}
      <Link to={route.notFound} params={{notFound: 'boring'}}>
        Boring
      </Link>
    </nav>
    <nav>
      <Link to={route.redirect.target} params={{target: 'account'}}>
        Redirect to Account
      </Link>
      {' | '}
      <Link to={route.redirect.target} params={{target: 'about'}}>
        Redirect to About
      </Link>
    </nav>
    <hr />
    <Route match={route.home}>
      <p>Home page</p>
    </Route>
    <Route match={route.account}>
      <p>Account page</p>
      <Link to={route.account.accountId} params={{accountId: '1'}}>
        Account 1
      </Link>
      {' | '}
      <Link to={route.account.accountId} params={{accountId: '2'}}>
        Account 2
      </Link>
      <Route match={route.account.accountId}>
        {match => (
          <>
            <hr />
            <div>Account ID {match.$params.accountId}</div>
          </>
        )}
      </Route>
    </Route>
    <Route match={route.about}>
      <p>About page</p>
    </Route>
    <Route match={route.notFound}>
      <p>Not found</p>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
