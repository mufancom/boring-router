import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const rootRoute = router.route({
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
});

rootRoute.account.$beforeEnter(() => {
  rootRoute.about.$push({source: 'reaction'});
});

rootRoute.profile.$beforeEnter(match => {
  console.info('before enter profile');
  console.info('before enter ref', match.$ref());

  if (match.$exact) {
    match.details.$push();
  }
});

rootRoute.profile.$afterEnter(() => {
  console.info('after enter profile');
});

rootRoute.profile.$beforeLeave(() => {
  console.info('before leave profile');
});

rootRoute.profile.$afterLeave(() => {
  console.info('after leave profile');
});

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={rootRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={rootRoute.account}>Account</Link>
          </div>
          <div>
            <Link to={rootRoute.profile}>Profile</Link>
          </div>
          <div>
            <Link to={rootRoute.about}>About</Link>
          </div>
        </Route>
        <Route match={rootRoute.profile.details}>
          <p>Profile details page</p>
          <Link to={rootRoute.default}>Home</Link>
        </Route>
        <Route match={rootRoute.about}>
          <p>About page</p>
          <Link to={rootRoute.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
