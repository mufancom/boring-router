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
    account: {
      $exact: true,
      $group: 'popup',
      $children: {
        login: true,
        register: true,
      },
    },
    profile: {
      $group: 'popup',
    },
    cart: {
      $group: 'sidebar',
    },
    news: true,
    about: true,
    contact: true,
    notFound: {
      $match: RouteMatch.rest,
    },
  },
  history,
);

router.about.$parallel({matches: [router.cart]});
router.contact.$parallel({groups: ['popup']});

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
            &nbsp;|&nbsp;
            <Link to={router.profile}>Profile</Link>
          </div>
          <div>
            <Link to={router.cart}>Cart</Link>
          </div>
          <div>
            <Link to={router.news}>News</Link>
          </div>
          <div>
            <Link to={router.about}>About(With Cart)</Link>
          </div>
          <div>
            <Link to={router.contact}>Contact(With 'popup' Group)</Link>
          </div>
          <div>
            <Link to={router.notFound} params={{notFound: 'boring'}}>
              Boring
            </Link>
          </div>
        </Route>
        <Route match={router.account}>
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: 300,
              height: 200,
            }}
          >
            <p>Account page</p>
            <Route match={router.account} exact={true}>
              <p>
                <Link to={router.account.login}>Login</Link>
                <br />
                <Link to={router.account.register}>Register</Link>
              </p>
              <p>
                <Link to={router.profile}>Profile</Link>
              </p>
            </Route>
            <Route match={router.account.login}>
              <p>- Login</p>
              <Link to={router.account}>Back</Link>
            </Route>
            <Route match={router.account.register}>
              <p>- Register</p>
              <Link to={router.account}>Back</Link>
            </Route>
          </div>
        </Route>
        <Route match={router.profile}>
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: 300,
              height: 200,
            }}
          >
            <p>Profile page</p>
            <p>
              <Link to={router.account}>Account</Link>
            </p>
          </div>
        </Route>
        <Route match={router.cart}>
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 200,
              width: 300,
              height: 200,
            }}
          >
            <p>Cart page</p>
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
