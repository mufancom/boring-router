import {observer} from 'mobx-react';
import React, {Component, ComponentType, ReactNode} from 'react';

import {RouteMatch} from './route-match';

export interface RouteComponentProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch;
}

export interface RouteProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch;
  exact?: boolean;
  component?: ComponentType<RouteComponentProps<TRouteMatch>>;
}

@observer
export class Route<TRouteMatch extends RouteMatch> extends Component<
  RouteProps<TRouteMatch>
> {
  render(): ReactNode {
    let {match, exact, component: RouteComponent, children} = this.props;

    return (exact ? (
      match.$exact
    ) : (
      match.$matched
    )) ? (
      RouteComponent ? (
        <RouteComponent match={match} />
      ) : (
        children || <></>
      )
    ) : (
      <></>
    );
  }
}
