import {IRouteService, RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

class Account {
  constructor(readonly id: string) {}

  get avatarURL(): string {
    return `https://gravatar.com/avatar/${this.id}`;
  }
}

const router = new Router(history);

const primaryRoute = router.route({
  default: {
    $match: '',
  },
  account: {
    $children: {
      id: {
        $match: RouteMatch.segment,
        $extension: {
          tick: undefined! as number,
          account: undefined! as Account,
        },
      },
    },
  },
  profile: true,
  notFound: {
    $match: RouteMatch.rest,
  },
});

type AccountIdRouteMatch = typeof primaryRoute.account.id;

class AccountIdRouteService implements IRouteService<AccountIdRouteMatch> {
  private timer!: number;

  @observable
  tick!: number;

  constructor(private match: AccountIdRouteMatch) {}

  get account(): Account {
    let {id} = this.match.$params;
    return new Account(id);
  }

  beforeEnter(): void {
    this.tick = 0;

    this.timer = setInterval(() => {
      this.tick++;
    }, 1000) as any;
  }

  afterLeave(): void {
    clearInterval(this.timer);
  }
}

primaryRoute.account.id.$service(match => new AccountIdRouteService(match));

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={primaryRoute.default}>
          <p>Home page</p>
          <Link
            to={primaryRoute.account.id}
            params={{id: '4a35d104523ef520dd5d9f60c7e1eeb1'}}
          >
            Account
          </Link>
        </Route>
        <Route match={primaryRoute.account.id}>
          {({account, tick}) => (
            <>
              <p>Account page</p>
              <Link to={primaryRoute.default}>Home</Link>
              <hr />
              <p>Account {account.id}</p>
              <img src={account.avatarURL} alt="avatar" />
              <p>Tick {tick}</p>
            </>
          )}
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
