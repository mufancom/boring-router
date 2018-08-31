import {observer} from 'mobx-react';
import React, {Component, ComponentType, ReactNode} from 'react';

import {RouteMatch} from './route-match';

export interface RouteComponentProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch;
}

export type RouteComponent<TRouteMatch extends RouteMatch> = ComponentType<
  RouteComponentProps<TRouteMatch>
>;

export interface RouteProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch | TRouteMatch[];
  exact?: boolean;
  component?: RouteComponent<TRouteMatch>;
}

@observer
export class Route<TRouteMatch extends RouteMatch> extends Component<
  RouteProps<TRouteMatch>
> {
  render(): ReactNode {
    let {match, exact, component: RouteComponent, children} = this.props;

    let matches = Array.isArray(match) ? match : [match];

    let firstMatch = matches.find(
      match => (exact ? match.$exact : match.$matched),
    );

    return firstMatch ? (
      RouteComponent ? (
        <RouteComponent match={firstMatch} />
      ) : (
        children || <></>
      )
    ) : (
      <></>
    );
  }
}
