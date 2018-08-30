import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Route, RouteMatch, Router} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: {
      $children: {
        id: {
          $match: '*',
        },
      },
    },
    about: {
      $query: {
        source: true,
      },
    },
    notFound: {
      $match: '**',
    },
  },
  history,
);

export interface LinkProps<TRouteMatch> {
  className?: string;
  to: TRouteMatch | string;
  params?: TRouteMatch extends RouteMatch<infer TFragmentDict, infer TQueryDict>
    ? Partial<TFragmentDict & TQueryDict>
    : never;
  preserveQuery?: boolean;
  children: ReactNode;
}

@observer
export class Link<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
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
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$path(params, preserveQuery);
    }

    history.push(to);
  };
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
            <Link to={router.account.id} params={{id: '123'}}>
              Account 123
            </Link>
          </div>
          <div>
            <Link to={router.about} params={{source: 'ads'}}>
              About ads
            </Link>
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
