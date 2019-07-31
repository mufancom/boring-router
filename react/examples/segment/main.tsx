import {RouteMatch, Router} from 'boring-router';
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
        <Route match={primaryRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={primaryRoute.account.id} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
        </Route>
        <Route match={primaryRoute.account}>
          <p>Account page</p>
          <Link to={primaryRoute.default}>Home</Link>
          <hr />
          <Route match={primaryRoute.account.id}>
            <p>Account {primaryRoute.account.id.$params.id} details page</p>
          </Route>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
