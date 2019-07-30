import {Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
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

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={rootRoute.default}>
          <p>Home page</p>
          <Link to={rootRoute.account} params={{id: '123'}}>
            Account 123
          </Link>
        </Route>
        <Route match={rootRoute.account}>
          <p>Account page</p>
          <Link to={rootRoute.default}>Home</Link>
          <hr />
          <p>Account {rootRoute.account.$params.id} page</p>
          <Link to={rootRoute.account.details}>Details</Link>
          <Route match={rootRoute.account.details}>
            <p>Account {rootRoute.account.details.$params.id} details</p>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
