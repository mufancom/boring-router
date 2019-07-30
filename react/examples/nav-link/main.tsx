import {Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {NavLink} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
  default: {
    $match: '',
  },
  account: {
    $exact: true,
    $children: {
      settings: true,
    },
  },
  about: true,
});

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <NavLink to={rootRoute.default}>Home</NavLink>{' '}
        <NavLink to={rootRoute.account}>Account</NavLink>{' '}
        <NavLink to={rootRoute.account} exact>
          Account Exact
        </NavLink>{' '}
        <NavLink to={rootRoute.account.settings}>Account Settings</NavLink>{' '}
        <NavLink activeClassName="boring-active" to={rootRoute.about}>
          About
        </NavLink>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
