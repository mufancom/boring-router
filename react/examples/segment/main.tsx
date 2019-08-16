import {RouteMatch, Router} from 'boring-router';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {BrowserHistory, Link, Route} from '../../bld/library';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  default: {
    $match: '',
  },
  account: {
    $exact: true,
    $children: {
      id: {
        $match: RouteMatch.segment,
      },
    },
  },
});

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={route.default}>
          <p>Home page</p>
          <div>
            <Link to={route.account.id} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
        </Route>
        <Route match={route.account}>
          <p>Account page</p>
          <Link to={route.default}>Home</Link>
          <hr />
          <Route match={route.account.id}>
            <p>Account {route.account.id.$params.id} details page</p>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
