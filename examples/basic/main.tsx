import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Route, Router} from '../../bld/library';

import {Link} from './link';

const history = createBrowserHistory();

Link.history = history;

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: true,
    about: true,
    notFound: {
      $match: '**',
    },
  },
  history,
);

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
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
        <Route match={router.notFound}>
          <p>Not found</p>
          <Link to={router.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
