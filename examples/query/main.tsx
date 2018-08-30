import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Route, Router} from '../../bld/library';

import {Link} from './link';

const history = createBrowserHistory();

Link.history = history;

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $query: {
        id: true,
      },
      $children: {
        details: {
          $query: {
            id: true,
          },
        },
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
          <Link to={router.account} params={{id: '123'}}>
            Account 123
          </Link>
        </Route>
        <Route match={router.account}>
          <p>Account page</p>
          <Link to={router.default}>Home</Link>
          <hr />
          <p>Account {router.account.$params.id} page</p>
          <Link to={router.account.details} preserveQuery>
            Details
          </Link>
          <Route match={router.account.details}>
            <p>Account {router.account.details.$params.id} details</p>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
