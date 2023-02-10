import {Router} from 'boring-router';
import type {RouteComponentProps} from 'boring-router-react';
import {BrowserHistory, Link, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import type {FunctionComponent} from 'react';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  $children: {
    element: true,
    routeComponent: true,
    functionAsChild: true,
  },
});

const RouteComponentView: FunctionComponent<
  RouteComponentProps<typeof route.routeComponent>
> = props => <div>Route Component (path {props.match.$ref()})</div>;

const App = observer(() => (
  <>
    <h1>Boring Router</h1>
    <nav>
      <Link to={route}>Home</Link>
      {' | '}
      <Link to={route.element}>Element</Link>
      {' | '}
      <Link to={route.routeComponent}>Route Component</Link>
      {' | '}
      <Link to={route.functionAsChild}>Function as Child</Link>
    </nav>
    <hr />
    <Route exact match={route}>
      Home page
    </Route>
    <Route match={route.element}>
      <div>Element (path {route.element.$ref()})</div>
    </Route>
    <Route match={route.routeComponent} component={RouteComponentView} />
    <Route match={route.functionAsChild}>
      {match => <div>Function as Child (path {match.$ref()})</div>}
    </Route>
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
