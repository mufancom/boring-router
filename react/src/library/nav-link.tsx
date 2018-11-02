import {RouteMatch} from 'boring-router';
import classNames from 'classnames';
import {observer} from 'mobx-react';
import React, {Component, ReactNode} from 'react';

import {Link, LinkProps} from './link';

export interface NavLinkProps<TRouteMatch extends RouteMatch>
  extends LinkProps<TRouteMatch> {
  exact?: boolean;
  activeClassName?: string;
}

@observer
export class NavLink<TRouteMatch extends RouteMatch> extends Component<
  NavLinkProps<TRouteMatch>
> {
  render(): ReactNode {
    let {className, activeClassName = 'active', exact, ...props} = this.props;

    let {to} = props;

    let matched = exact ? to.$exact : to.$matched;

    return (
      <Link
        className={classNames(className, matched && activeClassName)}
        {...props}
      />
    );
  }
}
