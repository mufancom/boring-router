import {createBrowserHistory} from 'history';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {
  IRouteService,
  Link,
  Route,
  RouteMatch,
  Router,
} from '../../bld/library';

const history = createBrowserHistory();

class Account {
  constructor(readonly id: string) {}

  get avatarURL(): string {
    return `https://gravatar.com/avatar/${this.id}`;
  }
}

const router = Router.create(
  {
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
  },
  history,
);

type AccountIdRouteMatch = typeof router.account.id;

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
    }, 1000);
  }

  afterLeave(): void {
    clearInterval(this.timer);
  }
}

router.account.id.$service(match => new AccountIdRouteService(match));

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={router.default}>
          <p>Home page</p>
          <Link
            to={router.account.id}
            params={{id: '4a35d104523ef520dd5d9f60c7e1eeb1'}}
          >
            Account
          </Link>
        </Route>
        <Route match={router.account.id}>
          {({account, tick}) => (
            <>
              <p>Account page</p>
              <Link to={router.default}>Home</Link>
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
