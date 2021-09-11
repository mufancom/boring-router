import {Router} from 'boring-router';
import {BrowserHistory, Link, NavLink, Route} from 'boring-router-react';
import {observer} from 'mobx-react';
import React from 'react';
import ReactDOM from 'react-dom';

const history = new BrowserHistory();

const router = new Router(history);

const primaryRoute = router.$route({
  $children: {
    workbench: {
      $exact: 'todo',
      $children: {
        todo: true,
        done: true,
      },
    },
    settings: true,
  },
});

const sidebarRoute = router.$route('sidebar', {
  $children: {
    status: true,
    notification: true,
  },
});

const overlayRoute = router.$route('overlay', {
  $children: {
    task: {
      $children: {
        taskId: {
          $match: /\d+/,
        },
      },
    },
  },
});

const Sidebar = observer(({route}: {route: typeof sidebarRoute}) => {
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

const TaskOverlay = observer(({route}: {route: typeof overlayRoute}) => {
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

const Main = observer(({route}: {route: typeof primaryRoute}) => {
  return (
    <div id="main">
      <h1>Boring Router</h1>
      <div>
        <NavLink exact to={route}>
          Home
        </NavLink>
        {' | '}
        <NavLink to={route.workbench}>Workbench</NavLink>
        {' | '}
        <NavLink to={route.settings}>Settings</NavLink>
      </div>
      <hr />
      <Route exact match={route}>
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
    <Main route={primaryRoute} />
  </>
));

ReactDOM.render(<App />, document.getElementById('app'));
