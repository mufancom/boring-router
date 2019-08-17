import {Router} from 'boring-router';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {BrowserHistory, Link, Route} from '../../bld/library';

const history = new BrowserHistory();

const router = new Router(history);

const primaryRoute = router.$route({
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
        <Route match={primaryRoute.default}>
          <p>Home page</p>
          <Link to={primaryRoute.account} params={{id: '123'}}>
            Account 123
          </Link>
        </Route>
        <Route match={primaryRoute.account}>
          <p>Account page</p>
          <Link to={primaryRoute.default}>Home</Link>
          <hr />
          <p>Account {primaryRoute.account.$params.id} page</p>
          <Link to={primaryRoute.account.details}>Details</Link>
          <Route match={primaryRoute.account.details}>
            <p>Account {primaryRoute.account.details.$params.id} details</p>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
