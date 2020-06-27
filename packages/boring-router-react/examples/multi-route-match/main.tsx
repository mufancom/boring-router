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
    $children: {
      signUp: true,
      resetPassword: true,
      settings: true,
    },
  },
});

type RouteType = typeof route;

type AccountPageProps = RouteComponentProps<
  RouteType['account']['signUp' | 'resetPassword']
>;

const AccountPage = observer((_props: AccountPageProps) => (
  <>
    <p>Account page</p>
    <Link to={route.default}>Home</Link>
    <hr />
    <Route match={route.account.signUp}>
      <p>Sign up</p>
    </Route>
    <Route match={route.account.resetPassword}>
      <p>Reset password</p>
    </Route>
  </>
));

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <div>
        <Link to={route.account.signUp}>Sign up</Link>
      </div>
      <div>
        <Link to={route.account.resetPassword}>Reset password</Link>
      </div>
      <div>
        <Link to={route.account.settings}>Settings</Link>
      </div>
    </Route>
    <Route
      match={[route.account.signUp, route.account.resetPassword]}
      component={AccountPage}
    />
    <Route match={route.account.settings}>
      <p>Account settings</p>
      <Link to={route.default}>Home</Link>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
