import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route, RouteMatch, Router} from '../../bld/library';

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
          $match: RouteMatch.fragment,
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

router.account.id.$service(match => {
  let timer: number;

  return {
    beforeEnter(next) {
      match.tick = 0;

      timer = setInterval(() => {
        match.tick++;
      }, 1000);

      match.account = new Account(next.$params.id);
    },
    afterLeave() {
      clearInterval(timer);

      match.tick = undefined!;
      match.account = undefined!;
    },
  };
});

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
