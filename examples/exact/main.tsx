import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route, Router} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $children: {
        details: true,
      },
    },
  },
  history,
);

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account}>Account</Link>
          </div>
        </Route>
        <Route match={router.account}>
          <p>Account page</p>
          <Link to={router.default}>Home</Link>
          <hr />
          <Route match={router.account} exact>
            <p>Exact account page</p>
            <Link to={router.account.details}>Account details</Link>
          </Route>
          <Route match={router.account.details}>
            <p>Account details page</p>
            <Link to={router.account}>Account</Link>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
