import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = Router.create(
  {
    default: {
      $match: '',
    },
    account: true,
    profile: {
      $exact: true,
      $children: {
        details: true,
      },
    },
    about: {
      $query: {
        source: true,
      },
    },
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history,
);

router.account.$beforeEnter(() => {
  router.about.$push({source: 'reaction'});
});

router.profile
  .$beforeEnter(match => {
    console.info('before enter profile');
    console.info('before enter ref', match.$ref());

    if (match.$exact) {
      match.details.$push();
    }
  })
  .$afterEnter(() => {
    console.info('after enter profile');
  })
  .$beforeLeave(() => {
    console.info('before leave profile');
  })
  .$afterLeave(() => {
    console.info('after leave profile');
  });

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.account}>Account</Link>
          </div>
          <div>
            <Link to={router.profile}>Profile</Link>
          </div>
          <div>
            <Link to={router.about}>About</Link>
          </div>
        </Route>
        <Route match={router.profile.details}>
          <p>Profile details page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Route match={router.about}>
          <p>About page</p>
          <Link to={router.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));