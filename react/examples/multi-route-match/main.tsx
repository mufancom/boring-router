import {Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route, RouteComponentProps} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
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

export type RouterType = typeof rootRoute;

export type AccountPageProps = RouteComponentProps<
  RouterType['account']['signUp' | 'resetPassword']
>;

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    return (
      <>
        <p>Account page</p>
        <Link to={rootRoute.default}>Home</Link>
        <hr />
        <Route match={rootRoute.account.signUp}>
          <p>Sign up</p>
        </Route>
        <Route match={rootRoute.account.resetPassword}>
          <p>Reset password</p>
        </Route>
      </>
    );
  }
}

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={rootRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={rootRoute.account.signUp}>Sign up</Link>
          </div>
          <div>
            <Link to={rootRoute.account.resetPassword}>Reset password</Link>
          </div>
          <div>
            <Link to={rootRoute.account.settings}>Settings</Link>
          </div>
        </Route>
        <Route
          match={[rootRoute.account.signUp, rootRoute.account.resetPassword]}
          component={AccountPage}
        />
        <Route match={rootRoute.account.settings}>
          <p>Account settings</p>
          <Link to={rootRoute.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
