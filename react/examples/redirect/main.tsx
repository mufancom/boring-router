import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Redirect, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
  default: {
    $match: '',
  },
  account: true,
  profile: true,
  about: {
    $query: {
      source: true,
    },
  },
  notFound: {
    $match: RouteMatch.rest,
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
          <div>
            <Link to={rootRoute.account}>Account</Link>
          </div>
          <div>
            <Link to={rootRoute.about}>About</Link>
          </div>
          <div>
            <Link to={rootRoute.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </Route>
        <Route match={rootRoute.account}>
          <p>Account page</p>
          <Link to={rootRoute.default}>Home</Link>
        </Route>
        <Route match={rootRoute.about}>
          <p>About page</p>
          <Link to={rootRoute.default}>Home</Link>
        </Route>
        <Redirect
          match={[rootRoute.account, rootRoute.profile]}
          to={rootRoute.about}
        />
        <Redirect
          match={rootRoute.notFound}
          to={rootRoute.about}
          params={{source: 'not-found'}}
        />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
