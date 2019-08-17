import {Router} from 'boring-router';
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
  account: {
    $query: {
      id: true,
    },
  },
});

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={route.default}>
          <p>Home page</p>
          <Link to={route.account} params={{id: '123'}}>
            Account 123
          </Link>
        </Route>
        <Route match={route.account}>
          {match => (
            <>
              <p>Account {match.$params.id} page</p>
              <Link to={route.default}>Home</Link>
            </>
          )}
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
