import 'mobx-react-lite/batchingForReactDom';

import {Router} from 'boring-router';
import {BrowserHistory, Link, NavLink, Route} from 'boring-router-react';
import {observer} from 'mobx-react-lite';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const route = router.$route({
  home: {
    $match: '',
  },
  workbench: {
    $exact: 'todo',
    $children: {
      todo: true,
      done: true,
    },
  },
  settings: true,
});

const sidebarRoute = router.$route('sidebar', {
  status: true,
  notification: true,
});

const overlayRoute = router.$route('overlay', {
  task: {
    $children: {
      taskId: {
        $match: /\d+/,
      },
    },
  },
});

const Sidebar = observer<{route: typeof sidebarRoute}>(({route}) => {
  return (
    <div id="sidebar" className={route.$matched ? 'expanded' : 'collapsed'}>
      {route.$matched ? (
        <Link className="toggle" to={route} leave>
          -
        </Link>
      ) : (
        <Link className="toggle" to={route.status}>
          +
        </Link>
      )}
      <Route match={route}>
        <div className="nav">
          <NavLink to={route.status}>Status</NavLink>
          {' | '}
          <NavLink to={route.notification}>Notification</NavLink>
        </div>
        <Route match={route.status}>
          <div className="content">Some status...</div>
        </Route>
        <Route match={route.notification}>
          <div className="content">Some notifications...</div>
        </Route>
      </Route>
    </div>
  );
});

const TaskOverlay = observer<{route: typeof overlayRoute}>(({route}) => {
  return (
    <Route match={route.task.taskId}>
      {match => (
        <div className="content">
          <p>Task ID: {match.$params.taskId}</p>
          <div>
            <Link to={match} params={{taskId: '123'}}>
              Task 123
            </Link>
            {' | '}
            <Link to={match} params={{taskId: '456'}}>
              Task 456
            </Link>
            {' | '}
            <Link to={match} leave>
              Close
            </Link>
          </div>
        </div>
      )}
    </Route>
  );
});

const Main = observer<{route: typeof route}>(({route}) => {
  return (
    <div id="main">
      <h1>Boring Router</h1>
      <div>
        <NavLink to={route.home}>Home</NavLink>
        {' | '}
        <NavLink to={route.workbench}>Workbench</NavLink>
        {' | '}
        <NavLink to={route.settings}>Settings</NavLink>
      </div>
      <hr />
      <Route match={route.home}>
        <p>Home page</p>
        <Link to={overlayRoute.task.taskId} params={{taskId: '123'}}>
          Task
        </Link>
      </Route>
      <Route match={route.workbench}>
        {match => (
          <>
            <div>
              <NavLink to={match.todo}>To-do</NavLink>
              {' | '}
              <NavLink to={match.done}>Done</NavLink>
            </div>
            <hr />
            <Route match={match.todo}>To-do list</Route>
            <Route match={match.done}>Done list</Route>
          </>
        )}
      </Route>
      <Route match={route.settings}>Settings page</Route>
      <Route match={overlayRoute}>
        <div id="overlay">
          <TaskOverlay route={overlayRoute} />
        </div>
      </Route>
    </div>
  );
});

const App = observer(() => (
  <>
    <Sidebar route={sidebarRoute} />
    <Main route={route} />
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
