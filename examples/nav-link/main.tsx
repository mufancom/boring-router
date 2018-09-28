import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {NavLink, Router} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
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
  },
  history,
);

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <NavLink to={router.default}>Home</NavLink>{' '}
        <NavLink to={router.account}>Account</NavLink>{' '}
        <NavLink to={router.account} exact>
          Account Exact
        </NavLink>{' '}
        <NavLink to={router.account.settings}>Account Settings</NavLink>{' '}
        <NavLink activeClassName="boring-active" to={router.about}>
          About
        </NavLink>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
