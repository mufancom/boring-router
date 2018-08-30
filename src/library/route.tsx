import {observer} from 'mobx-react';
import React, {Component, ComponentType, ReactNode} from 'react';

import {GeneralFragmentDict, GeneralQueryDict, RouteMatch} from './route-match';

export type RouteComponentPropsType<
  TRouteMatch extends RouteMatch
> = TRouteMatch extends RouteMatch<infer TFragmentDict, infer TQueryDict>
  ? RouteComponentProps<TFragmentDict, TQueryDict>
  : never;

export interface RouteComponentProps<
  TFragmentDict extends GeneralFragmentDict = GeneralFragmentDict,
  TQueryDict extends GeneralQueryDict = GeneralQueryDict
> {
  match: RouteMatch<TFragmentDict, TQueryDict>;
}

export interface RouteProps<
  TFragmentDict extends GeneralFragmentDict,
  TQueryDict extends GeneralQueryDict
> {
  match: RouteMatch<TFragmentDict, TQueryDict>;
  component?: ComponentType<RouteComponentProps<TFragmentDict, TQueryDict>>;
}

@observer
export class Route<
  TFragmentDict extends GeneralFragmentDict,
  TQueryDict extends GeneralQueryDict
> extends Component<RouteProps<TFragmentDict, TQueryDict>> {
  render(): ReactNode {
    let {match, component: RouteComponent, children} = this.props;

    return match.$matched ? (
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
