import {Router} from 'boring-router';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {BrowserHistory, NavLink} from '../../bld/library';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
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
        <NavLink to={route.default}>Home</NavLink>{' '}
        <NavLink to={route.account}>Account</NavLink>{' '}
        <NavLink to={route.account} exact>
          Account Exact
        </NavLink>{' '}
        <NavLink to={route.account.settings}>Account Settings</NavLink>{' '}
        <NavLink activeClassName="boring-active" to={route.about}>
          About
        </NavLink>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
