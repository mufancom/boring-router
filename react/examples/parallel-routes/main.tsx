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
  },
  {
    popup: {
      account: {
        $exact: true,
        $children: {
          login: true,
          register: true,
        },
      },
      profile: true,
    },
    sidebar: {
      cart: true,
    },
  },
  history,
);

router.about.$parallel({matches: [router.$.sidebar.cart]});
router.contact.$parallel({groups: ['popup']});

router.about.$beforeEnter(match => {
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
        <Route match={router.default}>
          <p>Home page</p>
          <div>
            <Link to={router.$.popup.account} toggle>
              Account
            </Link>
            {' | '}
            <Link to={router.$.popup.profile} toggle>
              Profile
            </Link>
          </div>
          <div>
            <Link to={router.$.sidebar.cart}>Cart</Link>
          </div>
          <div>
            <Link to={router.news}>News</Link>
          </div>
          <div>
            <Link to={router.about}>About (With Cart)</Link>
          </div>
          <div>
            <Link to={router.contact}>Contact (With 'popup' Group)</Link>
          </div>
          <div>
            <Link to={router.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </Route>
        <Route match={router.$.popup.account}>
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
                  router.$replace({leaves: 'popup'});
                }}
              >
                x
              </a>
            </p>
            <Route match={router.$.popup.account} exact={true}>
              <p>
                <Link to={router.$.popup.account.login}>Login</Link>
                <br />
                <Link to={router.$.popup.account.register}>Register</Link>
              </p>
              <p>
                <Link to={router.$.popup.profile}>Profile</Link>
              </p>
            </Route>
            <Route match={router.$.popup.account.login}>
              <p>- Login</p>
              <Link to={router.$.popup.account}>Back</Link>
            </Route>
            <Route match={router.$.popup.account.register}>
              <p>- Register</p>
              <Link to={router.$.popup.account}>Back</Link>
            </Route>
          </div>
        </Route>
        <Route match={router.$.popup.profile}>
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
                  router.$replace({leaves: 'popup'});
                }}
              >
                x
              </a>
            </p>
            <p>
              <Link to={router.$.popup.account}>Account</Link>
            </p>
          </div>
        </Route>
        <Route match={router.$.sidebar.cart}>
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
                  router.$replace({leaves: 'sidebar'});
                }}
              >
                x
              </a>
            </p>
          </div>
        </Route>
        <Route match={router.news}>
          <p>News page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Route match={router.about}>
          <p>About page</p>
          <Link to={router.default}>Home</Link>
        </Route>
        <Route match={router.contact}>
          <p>Contact page</p>
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
