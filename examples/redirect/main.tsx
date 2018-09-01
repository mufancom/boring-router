import {createBrowserHistory} from 'history';
import {observable} from 'mobx';
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
    settings: true,
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
  @observable
  loggedIn = false;

  render(): ReactNode {
    return (
      <HistoryProvider value={history}>
        <h1>Boring Router</h1>
        <button onClick={() => (this.loggedIn = true)}>Log In</button>
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account}>Account</Link>
          </div>
          <div>
            <Link to={router.about}>About</Link>
          </div>
          <div>
            <Link to={router.profile}>Profile</Link>
          </div>
          <div>
            <Link to={router.profile}>Settings</Link>
          </div>
          <div>
            <Link to="/boring">Boring</Link>
          </div>
        </Route>
        <Route match={router.account}>
          <p>Account page</p>
          <Link to={router.default}>Home</Link>
          <Redirect match={!this.loggedIn} to={router.default} />
        </Route>
        <Route match={router.about}>
          <p>About page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Redirect match={[router.profile, router.settings]} to={router.about} />
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
