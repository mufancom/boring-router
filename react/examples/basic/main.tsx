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
  account: true,
  about: true,
  revert: true,
  notFound: {
    $match: RouteMatch.rest,
  },
});

route.revert.$beforeEnter(() => false);

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={route.default}>
          <p>Home page</p>
          <div>
            <Link to={route.account}>Account</Link>
          </div>
          <div>
            <Link to={route.about}>About</Link>
          </div>
          <div>
            <Link to={route.revert}>Revert</Link>
          </div>
          <div>
            <Link to={route.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </Route>
        <Route match={route.account}>
          <p>Account page</p>
          <Link to={route.default}>Home</Link>
        </Route>
        <Route match={route.about}>
          <p>About page</p>
          <Link to={route.default}>Home</Link>
        </Route>
        <Route match={route.notFound}>
          <p>Not found</p>
          <Link to={route.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
