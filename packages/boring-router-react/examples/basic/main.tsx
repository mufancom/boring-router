import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  default: {
    $match: '',
  },
  account: true,
  about: true,
  revert: true,
  notFound: {
    $match: RouteMatch.rest,
  },
});

route.revert.$beforeEnter(() => false);

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <div>
        <Link to={route.account}>Account</Link>
      </div>
      <div>
        <Link to={route.about}>About</Link>
      </div>
      <div>
        <Link to={route.revert}>Revert</Link>
      </div>
      <div>
        <Link to={route.notFound} params={{notFound: 'boring'}}>
          Boring
        </Link>
      </div>
      <div>
        <Link to={route.notFound.$({notFound: 'boring'})}>
          Boring (builder)
        </Link>
      </div>
    </Route>
    <Route match={route.account}>
      <p>Account page</p>
      <Link to={route.default}>Home</Link>
    </Route>
    <Route match={route.about}>
      <p>About page</p>
      <Link to={route.default}>Home</Link>
    </Route>
    <Route match={route.notFound}>
      <p>Not found</p>
      <Link to={route.default}>Home</Link>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
