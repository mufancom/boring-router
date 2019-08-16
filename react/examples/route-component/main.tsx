import {Router} from 'boring-router';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {
  BrowserHistory,
  Link,
  Route,
  RouteComponentProps,
} from '../../bld/library';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  default: {
    $match: '',
  },
  account: {
    $exact: true,
    $query: {
      id: true,
    },
    $children: {
      details: true,
    },
  },
});

export type RouteType = typeof route;

export type AccountPageProps = RouteComponentProps<RouteType['account']>;

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    let {match} = this.props;

    return (
      <>
        <p>Account page</p>
        <Link to={route.default}>Home</Link>
        <hr />
        <Link to={match.details}>Details</Link>
        <Route match={match.details}>
          <p>Account {match.$params.id} details page</p>
        </Route>
      </>
    );
  }
}

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={route.default}>
          <p>Home page</p>
          <div>
            <Link to={route.account} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
        </Route>
        <Route match={route.account} component={AccountPage} />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
