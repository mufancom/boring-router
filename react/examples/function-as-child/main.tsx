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
    $query: {
      id: true,
    },
  },
});

export type RouterType = typeof rootRoute;

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
          {match => (
            <>
              <p>Account {match.$params.id} page</p>
              <Link to={rootRoute.default}>Home</Link>
            </>
          )}
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
