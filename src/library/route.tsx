import {observer} from 'mobx-react';
import React, {Component, ComponentType, ReactNode} from 'react';

import {RouteMatch} from './route-match';

export interface RouteComponentProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch;
}

export type RouteComponent<TRouteMatch extends RouteMatch> = ComponentType<
  RouteComponentProps<TRouteMatch>
>;

export type RouteFunctionChild<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => ReactNode;

export interface RouteProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch | TRouteMatch[];
  exact?: boolean;
  component?: RouteComponent<TRouteMatch>;
  children?: RouteFunctionChild<TRouteMatch> | ReactNode;
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

    if (firstMatch) {
      if (children !== undefined && children !== null) {
        if (RouteComponent) {
          throw new Error(
            'Cannot specify `component` and `children` simultaneously',
          );
        }

        if (typeof children === 'function') {
          return children(firstMatch);
        } else {
          return children;
        }
      } else {
        if (RouteComponent) {
          return <RouteComponent match={firstMatch} />;
        }
      }
    }

    return <></>;
  }
}
