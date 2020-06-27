import {Router} from 'boring-router';
import {BrowserHistory, NavLink} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

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

const App = observer(() => (
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
));

ReactDOM.render(<App />, document.getElementById('app'));
