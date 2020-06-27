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
    $query: {
      id: true,
    },
  },
});

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <Link to={route.account} params={{id: '123'}}>
        Account 123
      </Link>
    </Route>
    <Route match={route.account}>
      {match => (
        <>
          <p>Account {match.$params.id} page</p>
          <Link to={route.default}>Home</Link>
        </>
      )}
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
