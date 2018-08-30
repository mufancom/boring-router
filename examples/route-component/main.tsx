import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Route, RouteComponentPropsType, Router} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $query: {
        id: true,
      },
    },
  },
  history,
);

export interface LinkProps {
  className?: string;
  to: string;
  children: ReactNode;
}

@observer
export class Link extends Component<LinkProps> {
  render(): ReactNode {
    let {className, children} = this.props;

    return (
      <a
        className={className}
        onClick={this.onClick}
        href="javascript:;"
        children={children}
      />
    );
  }

  private onClick = (): void => {
    history.push(this.props.to);
  };
}

export type RouterType = typeof router;

export interface AccountPageProps
  extends RouteComponentPropsType<RouterType['account']> {}

export class AccountPage extends Component<AccountPageProps> {
  render(): ReactNode {
    let {
      match: {$query},
    } = this.props;

    return (
      <>
        <p>Account page</p>
        <Link to={router.default.$path()}>Home</Link>
        <hr />
        <Route match={router.account}>
          <p>Account {$query.id} details page</p>
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
            <Link to={router.account.$path({id: '123'})}>Account 123</Link>
          </div>
        </Route>
        <Route match={router.account} component={AccountPage} />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
