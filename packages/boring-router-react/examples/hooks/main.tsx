import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
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

route.account.$beforeEnter(() => {
  route.about.$push({source: 'reaction'});
});

route.profile.$beforeEnter(match => {
  console.info('before enter profile');

  if (match.$exact) {
    match.details.$push();
  }
});

route.profile.$afterEnter(() => {
  console.info('after enter profile');
});

route.profile.$beforeLeave(() => {
  console.info('before leave profile');
});

route.profile.$afterLeave(() => {
  console.info('after leave profile');
});

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={route.default}>
      <p>Home page</p>
      <div>
        <Link to={route.account}>Account</Link>
      </div>
      <div>
        <Link to={route.profile}>Profile</Link>
      </div>
      <div>
        <Link to={route.about}>About</Link>
      </div>
    </Route>
    <Route match={route.profile.details}>
      <p>Profile details page</p>
      <Link to={route.default}>Home</Link>
    </Route>
    <Route match={route.about}>
      <p>About page</p>
      <Link to={route.default}>Home</Link>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
