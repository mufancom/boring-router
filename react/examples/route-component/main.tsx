import {Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route, RouteComponentProps} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
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

export type RouterType = typeof rootRoute;

export type AccountPageProps = RouteComponentProps<RouterType['account']>;

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    let {match} = this.props;

    return (
      <>
        <p>Account page</p>
        <Link to={rootRoute.default}>Home</Link>
        <hr />
        <Link to={match.details} preserveQuery>
          Details
        </Link>
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
        <Route match={rootRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={rootRoute.account} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
        </Route>
        <Route match={rootRoute.account} component={AccountPage} />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
