import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route, RouteComponentProps, Router} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
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
  },
  history,
);

export type RouterType = typeof router;

export type AccountPageProps = RouteComponentProps<
  RouterType['account']['signUp' | 'resetPassword']
>;

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    return (
      <>
        <p>Account page</p>
        <Link to={router.default}>Home</Link>
        <hr />
        <Route match={router.account.signUp}>
          <p>Sign up</p>
        </Route>
        <Route match={router.account.resetPassword}>
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
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account.signUp}>Sign up</Link>
          </div>
          <div>
            <Link to={router.account.resetPassword}>Reset password</Link>
          </div>
          <div>
            <Link to={router.account.settings}>Settings</Link>
          </div>
        </Route>
        <Route
          match={[router.account.signUp, router.account.resetPassword]}
          component={AccountPage}
        />
        <Route match={router.account.settings}>
          <p>Account settings</p>
          <Link to={router.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
