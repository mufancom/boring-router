import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Redirect, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const primaryRoute = router.route({
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
        <Route match={primaryRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={primaryRoute.account}>Account</Link>
          </div>
          <div>
            <Link to={primaryRoute.about}>About</Link>
          </div>
          <div>
            <Link to={primaryRoute.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </Route>
        <Route match={primaryRoute.account}>
          <p>Account page</p>
          <Link to={primaryRoute.default}>Home</Link>
        </Route>
        <Route match={primaryRoute.about}>
          <p>About page</p>
          <Link to={primaryRoute.default}>Home</Link>
        </Route>
        <Redirect
          match={[primaryRoute.account, primaryRoute.profile]}
          to={primaryRoute.about}
        />
        <Redirect
          match={primaryRoute.notFound}
          to={primaryRoute.about}
          params={{source: 'not-found'}}
        />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
