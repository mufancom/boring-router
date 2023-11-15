import type {RouteMatch} from 'boring-router';
import {observer} from 'mobx-react-lite';
import type {ComponentType, ReactElement, ReactNode} from 'react';
import React from 'react';

export type RouteComponentProps<TRouteMatch extends RouteMatch> = {
  match: TRouteMatch;
};

export type RouteComponent<TRouteMatch extends RouteMatch> = ComponentType<
  RouteComponentProps<TRouteMatch>
>;

export type RouteFunctionChild<TRouteMatch extends RouteMatch> = (
  match: TRouteMatch,
) => ReactElement;

export type RouteProps<TRouteMatch extends RouteMatch> = {
  match: TRouteMatch | TRouteMatch[];
  exact?: boolean;
  component?: RouteComponent<TRouteMatch>;
  children?: RouteFunctionChild<TRouteMatch> | ReactNode;
};

export const Route = observer(
  <TRouteMatch extends RouteMatch>({
    match,
    exact,
    component: RouteComponent,
    children,
  }: RouteProps<TRouteMatch>): ReactElement => {
    const matches = Array.isArray(match) ? match : [match];

    const firstMatch = matches.find(match =>
      exact ? match.$exact : match.$matched,
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
          return <>{children}</>;
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
