import {Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const primaryRoute = router.route({
  default: {
    $match: '',
  },
  account: {
    $query: {
      id: true,
    },
  },
});

export type RouterType = typeof primaryRoute;

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
          {match => (
            <>
              <p>Account {match.$params.id} page</p>
              <Link to={primaryRoute.default}>Home</Link>
            </>
          )}
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
