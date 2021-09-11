import {RouteMatch} from 'boring-router';
import {observer} from 'mobx-react-lite';
import React, {ComponentType, ReactElement, ReactNode} from 'react';

export interface RouteComponentProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch;
}

export type RouteComponent<TRouteMatch extends RouteMatch> = ComponentType<
  RouteComponentProps<TRouteMatch>
>;

export type RouteFunctionChild<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => ReactElement;

export interface RouteProps<TRouteMatch extends RouteMatch> {
  match: TRouteMatch | TRouteMatch[];
  exact?: boolean;
  component?: RouteComponent<TRouteMatch>;
  children?: RouteFunctionChild<TRouteMatch> | ReactNode;
}

export const Route = observer(
  <TRouteMatch extends RouteMatch>({
    match,
    exact,
    component: RouteComponent,
    children,
  }: RouteProps<TRouteMatch>) => {
    let matches = Array.isArray(match) ? match : [match];

    let firstMatch = matches.find(match =>
      exact ? match.$exact : match.$matched,
    );

    if (firstMatch) {
      // eslint-disable-next-line no-null/no-null
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
  },
);
