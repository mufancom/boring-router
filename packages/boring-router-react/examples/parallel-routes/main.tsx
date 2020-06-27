import {RouteMatch, Router} from 'boring-router';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router<'popup' | 'sidebar'>(history);

const primaryRoute = router.$route({
  default: {
    $match: '',
  },
  news: true,
  about: {
    $exact: true,
    $children: {
      test: true,
    },
  },
  contact: true,
  notFound: {
    $match: RouteMatch.rest,
  },
});

const popupRoute = router.$route('popup', {
  account: {
    $exact: true,
    $children: {
      login: true,
      register: true,
    },
  },
  profile: true,
});

const sidebarRoute = router.$route('sidebar', {
  cart: true,
});

primaryRoute.about.$parallel({matches: [sidebarRoute.cart]});
primaryRoute.contact.$parallel({groups: ['popup']});

primaryRoute.about.$beforeEnter(next => {
  if (next.$exact) {
    next.test.$push();
  }
});

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <Route match={primaryRoute.default}>
      {() => (
        <>
          <p>Home page</p>
          <div>
            <Link to={popupRoute.account} toggle>
              Account
            </Link>
            {' | '}
            <Link to={popupRoute.profile} toggle>
              Profile
            </Link>
          </div>
          <div>
            <Link to={sidebarRoute.cart} toggle>
              Cart
            </Link>
          </div>
          <div>
            <Link to={primaryRoute.news}>News</Link>
          </div>
          <div>
            <Link to={primaryRoute.about}>About (With Cart)</Link>
          </div>
          <div>
            <Link to={primaryRoute.contact}>Contact (With 'popup' Group)</Link>
          </div>
          <div>
            <Link to={primaryRoute.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </>
      )}
    </Route>
    <Route match={popupRoute.account}>
      {match => (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 300,
            height: 200,
          }}
        >
          <p>
            Account popup{' '}
            <Link to={match} leave>
              x
            </Link>
          </p>
          <Route exact match={match}>
            <p>
              <Link to={match.login}>Login</Link>
              <br />
              <Link to={match.register}>Register</Link>
            </p>
            <p>
              <Link to={popupRoute.profile}>Profile</Link>
            </p>
          </Route>
          <Route match={match.login}>
            <p>- Login</p>
            <Link to={match}>Back</Link>
          </Route>
          <Route match={match.register}>
            <p>- Register</p>
            <Link to={match}>Back</Link>
          </Route>
        </div>
      )}
    </Route>
    <Route match={popupRoute.profile}>
      {match => (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 300,
            height: 200,
          }}
        >
          <p>
            Profile popup{' '}
            <Link to={match} leave>
              x
            </Link>
          </p>
          <p>
            <Link to={popupRoute.account}>Account</Link>
          </p>
        </div>
      )}
    </Route>
    <Route match={sidebarRoute.cart}>
      {match => (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 200,
            width: 300,
            height: 200,
          }}
        >
          <p>
            Cart sidebar{' '}
            <Link to={match} leave>
              x
            </Link>
          </p>
        </div>
      )}
    </Route>
    <Route match={primaryRoute.news}>
      <p>News page</p>
      <Link to={primaryRoute.default}>Home</Link>
    </Route>
    <Route match={primaryRoute.about}>
      <p>About page</p>
      <Link to={primaryRoute.default}>Home</Link>
    </Route>
    <Route match={primaryRoute.contact}>
      <p>Contact page</p>
      <Link to={primaryRoute.default}>Home</Link>
    </Route>
    <Route match={primaryRoute.notFound}>
      <p>Not found</p>
      <Link to={primaryRoute.default}>Home</Link>
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
