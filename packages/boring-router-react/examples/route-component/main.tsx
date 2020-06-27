import {Router} from 'boring-router';
import {
  BrowserHistory,
  Link,
  Route,
  RouteComponentProps,
} from 'boring-router-react';
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
    $query: {
      id: true,
    },
    $children: {
      details: true,
    },
  },
});

type RouteType = typeof route;

type AccountPageProps = RouteComponentProps<RouteType['account']>;

const AccountPage = observer(({match}: AccountPageProps) => (
  <>
    <p>Account page</p>
    <Link to={route.default}>Home</Link>
    <hr />
    <Link to={match.details}>Details</Link>
    <Route match={match.details}>
      <p>Account {match.$params.id} details page</p>
    </Route>
  </>
));

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <div>
        <Link to={route.account} params={{id: '123'}}>
          Account 123
        </Link>
      </div>
    </Route>
    <Route match={route.account} component={AccountPage} />
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
