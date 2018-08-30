import {observer} from 'mobx-react';
import React, {Component, ComponentType, ReactNode} from 'react';

import {GeneralParamDict, RouteMatch} from './route-match';

export type RouteComponentPropsType<
  TRouteMatch extends RouteMatch
> = TRouteMatch extends RouteMatch<infer TParamDict>
  ? RouteComponentProps<TParamDict>
  : never;

export interface RouteComponentProps<TParamDict extends GeneralParamDict> {
  match: RouteMatch<TParamDict>;
}

export interface RouteProps<TParamDict extends GeneralParamDict> {
  match: RouteMatch<TParamDict>;
  exact?: boolean;
  component?: ComponentType<RouteComponentProps<TParamDict>>;
}

@observer
export class Route<TParamDict extends GeneralParamDict> extends Component<
  RouteProps<TParamDict>
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
