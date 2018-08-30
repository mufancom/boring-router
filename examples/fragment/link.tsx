import {History} from 'history';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';

import {RouteMatch} from '../../bld/library';

export interface LinkProps<TRouteMatch> {
  className?: string;
  to: TRouteMatch | string;
  params?: TRouteMatch extends RouteMatch<infer TParamDict>
    ? Partial<TParamDict>
    : never;
  preserveQuery?: boolean;
  children: ReactNode;
}

@observer
export class Link<TRouteMatch extends RouteMatch> extends Component<
  LinkProps<TRouteMatch>
> {
  render(): ReactNode {
    let {className, children} = this.props;

    return (
      <a
        className={className}
        onClick={this.onClick}
        href="javascript:;"
        children={children}
      />
    );
  }

  private onClick = (): void => {
    let {to, params, preserveQuery} = this.props;

    if (to instanceof RouteMatch) {
      to = to.$path(params, preserveQuery);
    }

    Link.history.push(to);
  };

  static history: History;
}
