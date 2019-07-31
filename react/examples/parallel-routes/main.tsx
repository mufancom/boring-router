import {RouteMatch, Router} from 'boring-router';
import {createBrowserHistory} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';
import ReactDOM from 'react-dom';

import {Link, Route} from '../../bld/library';

const history = createBrowserHistory();

const router = new Router<'popup' | 'sidebar'>(history);

const primaryRoute = router.route({
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

const popupRoute = router.route('popup', {
  account: {
    $exact: true,
    $children: {
      login: true,
      register: true,
    },
  },
  profile: true,
});

const sidebarRoute = router.route('sidebar', {
  cart: true,
});

primaryRoute.about.$parallel({matches: [sidebarRoute.cart]});
primaryRoute.contact.$parallel({groups: ['popup']});

primaryRoute.about.$beforeEnter(match => {
  if (match.$exact) {
    match.test.$push();
  }
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
            <Link to={popupRoute.account} toggle>
              Account
            </Link>
            {' | '}
            <Link to={popupRoute.profile} toggle>
              Profile
            </Link>
          </div>
          <div>
            <Link to={sidebarRoute.cart}>Cart</Link>
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
        </Route>
        <Route match={popupRoute.account}>
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
              <a
                href="javascript:void(0);"
                onClick={() => {
                  primaryRoute.$replace({}, {leaves: ['popup']});
                }}
              >
                x
              </a>
            </p>
            <Route match={popupRoute.account} exact={true}>
              <p>
                <Link to={popupRoute.account.login}>Login</Link>
                <br />
                <Link to={popupRoute.account.register}>Register</Link>
              </p>
              <p>
                <Link to={popupRoute.profile}>Profile</Link>
              </p>
            </Route>
            <Route match={popupRoute.account.login}>
              <p>- Login</p>
              <Link to={popupRoute.account}>Back</Link>
            </Route>
            <Route match={popupRoute.account.register}>
              <p>- Register</p>
              <Link to={popupRoute.account}>Back</Link>
            </Route>
          </div>
        </Route>
        <Route match={popupRoute.profile}>
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
              <a
                href="javascript:void(0);"
                onClick={() => {
                  primaryRoute.$replace({}, {leaves: ['popup']});
                }}
              >
                x
              </a>
            </p>
            <p>
              <Link to={popupRoute.account}>Account</Link>
            </p>
          </div>
        </Route>
        <Route match={sidebarRoute.cart}>
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
              <a
                href="javascript:;"
                onClick={() => {
                  primaryRoute.$replace({}, {leaves: ['sidebar']});
                }}
              >
                x
              </a>
            </p>
          </div>
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
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
