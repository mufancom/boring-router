import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {
  HistoryProvider,
  Link,
  Redirect,
  Route,
  RouteMatch,
  Router,
} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
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
  },
  history,
);

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <HistoryProvider value={history}>
        <h1>Boring Router</h1>
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account}>Account</Link>
          </div>
          <div>
            <Link to={router.about}>About</Link>
          </div>
          <div>
            <Link to="/boring">Boring</Link>
          </div>
        </Route>
        <Route match={router.account}>
          <p>Account page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Route match={router.about}>
          <p>About page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Redirect match={[router.account, router.profile]} to={router.about} />
        <Redirect
          match={router.notFound}
          to={router.about}
          params={{source: 'not-found'}}
        />
      </HistoryProvider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
