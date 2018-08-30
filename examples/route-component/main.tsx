import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Route, RouteComponentProps, Router} from '../../bld/library';

import {Link} from './link';

const history = createBrowserHistory();

Link.history = history;

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $query: {
        id: true,
      },
      $children: {
        details: true,
      },
    },
  },
  history,
);

export type RouterType = typeof router;

export type AccountPageProps = RouteComponentProps<RouterType['account']>;

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    let {match} = this.props;

    return (
      <>
        <p>Account page</p>
        <Link to={router.default}>Home</Link>
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
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
        </Route>
        <Route match={router.account} component={AccountPage} />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
