import {Router} from 'boring-router';
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
  account: {
    $exact: true,
    $children: {
      details: true,
    },
  },
});

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <div>
        <Link to={route.account}>Account</Link>
      </div>
    </Route>
    <Route match={route.account}>
      <p>Account page</p>
      <Link to={route.default}>Home</Link>
      <hr />
      <Route match={route.account} exact>
        <p>Exact account page</p>
        <Link to={route.account.details}>Account details</Link>
      </Route>
      <Route match={route.account.details}>
        <p>Account details page</p>
        <Link to={route.account}>Account</Link>
      </Route>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
