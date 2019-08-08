import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router(history);

const primaryRoute = router.route({
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

primaryRoute.account.$beforeEnter(() => {
  primaryRoute.about.$push({source: 'reaction'});
});

primaryRoute.profile.$beforeEnter(match => {
  console.info('before enter profile');
  console.info('before enter ref', match.$ref());

  if (match.$exact) {
    match.details.$push();
  }
});

primaryRoute.profile.$afterEnter(() => {
  console.info('after enter profile');
});

primaryRoute.profile.$beforeLeave(() => {
  console.info('before leave profile');
});

primaryRoute.profile.$afterLeave(() => {
  console.info('after leave profile');
});

@observer
export class App extends Component {
  render(): ReactNode {
    return (
      <>
        <h1>Boring Router</h1>
        <Route match={primaryRoute.default}>
          <p>Home page</p>
          <div>
            <Link to={primaryRoute.account}>Account</Link>
          </div>
          <div>
            <Link to={primaryRoute.profile}>Profile</Link>
          </div>
          <div>
            <Link to={primaryRoute.about}>About</Link>
          </div>
        </Route>
        <Route match={primaryRoute.profile.details}>
          <p>Profile details page</p>
          <Link to={primaryRoute.default}>Home</Link>
        </Route>
        <Route match={primaryRoute.about}>
          <p>About page</p>
          <Link to={primaryRoute.default}>Home</Link>
        </Route>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
